-- Extend posts table to support companies, tags, and visibility system
-- This migration makes posts table the single source of truth for all posts

-- Add columns for company posts support
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_id UUID,
  ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'user' CHECK (author_type IN ('user', 'company')),
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS body_md TEXT,
  ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'link', 'poll', 'event', 'job')),
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'CommunityAndCompanies' CHECK (visibility IN ('Community', 'CommunityAndCompanies')),
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.job_posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applies_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS cta_url TEXT,
  ADD COLUMN IF NOT EXISTS promotion_theme TEXT;

-- Add tagging columns for filtering
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS industry_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS job_type_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '[]'::jsonb;

-- Ensure status column exists and has correct values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived', 'deleted'));
  ELSE
    -- Update status constraint if it exists but doesn't include all values
    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
    ALTER TABLE public.posts ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'scheduled', 'published', 'archived', 'deleted'));
  END IF;
END $$;

-- Backfill author_id from user_id for existing posts
UPDATE public.posts
SET author_id = user_id, author_type = 'user'
WHERE author_id IS NULL AND user_id IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author_type ON public.posts(author_type);
CREATE INDEX IF NOT EXISTS idx_posts_company_id ON public.posts(company_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_posts_industry_tags ON public.posts USING GIN (industry_tags);
CREATE INDEX IF NOT EXISTS idx_posts_location_tags ON public.posts USING GIN (location_tags);
CREATE INDEX IF NOT EXISTS idx_posts_job_type_tags ON public.posts USING GIN (job_type_tags);
CREATE INDEX IF NOT EXISTS idx_posts_target_audience ON public.posts USING GIN (target_audience);

-- Create function to automatically tag posts based on company/job/user data
CREATE OR REPLACE FUNCTION public.auto_tag_post()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_industry TEXT;
  v_company_city TEXT;
  v_user_branche TEXT;
  v_user_ort TEXT;
  v_user_status TEXT;
  v_job_title TEXT;
  v_job_city TEXT;
  v_job_employment_type TEXT;
  v_tags JSONB := '[]'::jsonb;
  v_industry_tags JSONB := '[]'::jsonb;
  v_location_tags JSONB := '[]'::jsonb;
  v_job_type_tags JSONB := '[]'::jsonb;
  v_target_audience JSONB := '[]'::jsonb;
BEGIN
  -- Only auto-tag if tags are empty (allow manual override)
  IF NEW.tags IS NULL OR (NEW.tags::text = '[]' OR jsonb_array_length(NEW.tags) = 0) THEN
    -- Tag based on company if it's a company post
    IF NEW.author_type = 'company' AND NEW.company_id IS NOT NULL THEN
      -- Use main_location (city column may not exist)
      SELECT industry, main_location
      INTO v_company_industry, v_company_city
      FROM companies
      WHERE id = NEW.company_id;
      
      -- Add industry tags
      IF v_company_industry IS NOT NULL AND v_company_industry != '' THEN
        v_industry_tags := jsonb_build_array(LOWER(v_company_industry));
        v_tags := v_tags || jsonb_build_array(LOWER(v_company_industry));
      END IF;
      
      -- Add location tags (use main_location if city doesn't exist)
      IF v_company_city IS NOT NULL AND v_company_city != '' THEN
        v_location_tags := jsonb_build_array(LOWER(v_company_city));
        v_tags := v_tags || jsonb_build_array(LOWER(v_company_city));
      END IF;
    END IF;
    
    -- Tag based on user if it's a user post
    IF NEW.author_type = 'user' AND NEW.user_id IS NOT NULL THEN
      SELECT branche, ort, status
      INTO v_user_branche, v_user_ort, v_user_status
      FROM profiles
      WHERE id = NEW.user_id;
      
      -- Add industry tags from user's branche
      IF v_user_branche IS NOT NULL AND v_user_branche != '' THEN
        v_industry_tags := jsonb_build_array(LOWER(v_user_branche));
        v_tags := v_tags || jsonb_build_array(LOWER(v_user_branche));
      END IF;
      
      -- Add location tags from user's ort
      IF v_user_ort IS NOT NULL AND v_user_ort != '' THEN
        v_location_tags := jsonb_build_array(LOWER(v_user_ort));
        v_tags := v_tags || jsonb_build_array(LOWER(v_user_ort));
      END IF;
      
      -- Add target audience from user's status
      IF v_user_status IS NOT NULL AND v_user_status != '' THEN
        v_target_audience := jsonb_build_array(LOWER(v_user_status));
        v_tags := v_tags || jsonb_build_array(LOWER(v_user_status));
      END IF;
    END IF;
    
    -- Tag based on job if it's a job post
    IF NEW.job_id IS NOT NULL THEN
      SELECT title, city, employment_type
      INTO v_job_title, v_job_city, v_job_employment_type
      FROM job_posts
      WHERE id = NEW.job_id;
      
      -- Add job type tags
      IF v_job_employment_type IS NOT NULL AND v_job_employment_type != '' THEN
        v_job_type_tags := jsonb_build_array(LOWER(v_job_employment_type));
        v_tags := v_tags || jsonb_build_array(LOWER(v_job_employment_type));
      END IF;
      
      -- Add location from job
      IF v_job_city IS NOT NULL AND v_job_city != '' THEN
        IF NOT (v_location_tags @> jsonb_build_array(LOWER(v_job_city))) THEN
          v_location_tags := v_location_tags || jsonb_build_array(LOWER(v_job_city));
          v_tags := v_tags || jsonb_build_array(LOWER(v_job_city));
        END IF;
      END IF;
    END IF;
    
    -- Set the tags (only if we have some)
    IF jsonb_array_length(v_tags) > 0 THEN
      NEW.tags := v_tags;
      NEW.industry_tags := v_industry_tags;
      NEW.location_tags := v_location_tags;
      NEW.job_type_tags := v_job_type_tags;
      NEW.target_audience := v_target_audience;
    END IF;
  END IF;
  
  -- Set author_id if missing
  IF NEW.author_id IS NULL THEN
    IF NEW.author_type = 'user' THEN
      NEW.author_id := NEW.user_id;
    ELSIF NEW.author_type = 'company' THEN
      NEW.author_id := NEW.company_id;
    END IF;
  END IF;
  
  -- Set published_at if missing
  IF NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-tag posts
DROP TRIGGER IF EXISTS trigger_auto_tag_post ON public.posts;
CREATE TRIGGER trigger_auto_tag_post
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_tag_post();

-- Update RLS policies to allow company users to create posts
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Company users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users and companies can create posts" ON public.posts;

CREATE POLICY "Users and companies can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Regular users can create posts
    (author_type = 'user' AND author_id = auth.uid()) OR
    -- Company users can create posts for their company
    (author_type = 'company' AND author_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

-- Update SELECT policy to respect visibility
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts based on visibility" ON public.posts;

CREATE POLICY "Users can view posts based on visibility" 
ON public.posts 
FOR SELECT 
USING (
  status = 'published' AND (
    -- Community posts: visible to all users (not companies)
    (visibility = 'Community' AND author_type = 'user') OR
    -- CommunityAndCompanies posts: visible to everyone
    (visibility = 'CommunityAndCompanies')
  )
);

-- Create policy for companies to view posts
DROP POLICY IF EXISTS "Companies can view CommunityAndCompanies posts" ON public.posts;

CREATE POLICY "Companies can view CommunityAndCompanies posts" 
ON public.posts 
FOR SELECT 
USING (
  status = 'published' AND 
  visibility = 'CommunityAndCompanies' AND
  -- Check if viewer is a company user
  EXISTS (
    SELECT 1 FROM public.company_users 
    WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
  )
);

