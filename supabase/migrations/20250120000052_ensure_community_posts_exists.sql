-- Ensure community_posts table exists
-- This migration creates the table if it doesn't exist, regardless of previous migrations

-- First, check if table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts'
  ) THEN
    -- Create the community_posts table
    CREATE TABLE public.community_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Author information (supports both users and companies)
      author_id UUID NOT NULL,
      author_type TEXT NOT NULL DEFAULT 'user' CHECK (author_type IN ('user', 'company')),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
      
      -- Content
      content TEXT NOT NULL,
      body_md TEXT, -- Markdown content
      media JSONB DEFAULT '[]'::jsonb, -- Array of media objects
      documents JSONB DEFAULT '[]'::jsonb, -- Array of document objects
      image_url TEXT, -- Legacy support
      
      -- Post metadata
      post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'link', 'poll', 'event', 'job')),
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived', 'deleted')),
      visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'connections', 'community_only')),
      
      -- Scheduling
      scheduled_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ DEFAULT now(),
      
      -- Engagement counters (updated via triggers)
      likes_count INTEGER NOT NULL DEFAULT 0,
      comments_count INTEGER NOT NULL DEFAULT 0,
      shares_count INTEGER NOT NULL DEFAULT 0,
      views_count INTEGER NOT NULL DEFAULT 0,
      
      -- Job posting specific fields
      job_id UUID REFERENCES public.job_posts(id) ON DELETE SET NULL,
      applies_enabled BOOLEAN DEFAULT false,
      cta_label TEXT,
      cta_url TEXT,
      promotion_theme TEXT,
      
      -- Tagging fields (for future filtering)
      tags JSONB DEFAULT '[]'::jsonb,
      industry_tags JSONB DEFAULT '[]'::jsonb,
      location_tags JSONB DEFAULT '[]'::jsonb,
      job_type_tags JSONB DEFAULT '[]'::jsonb,
      target_audience JSONB DEFAULT '[]'::jsonb,
      
      -- Metadata
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      -- Constraints
      CONSTRAINT community_posts_author_check CHECK (
        (author_type = 'user' AND author_id = user_id AND company_id IS NULL) OR
        (author_type = 'company' AND author_id = company_id AND company_id IS NOT NULL)
      )
    );

    -- Enable RLS
    ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

    -- Create indexes for better performance
    CREATE INDEX idx_community_posts_author_id ON public.community_posts(author_id);
    CREATE INDEX idx_community_posts_author_type ON public.community_posts(author_type);
    CREATE INDEX idx_community_posts_company_id ON public.community_posts(company_id);
    CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
    CREATE INDEX idx_community_posts_status ON public.community_posts(status);
    CREATE INDEX idx_community_posts_post_type ON public.community_posts(post_type);
    CREATE INDEX idx_community_posts_published_at ON public.community_posts(published_at DESC);
    CREATE INDEX idx_community_posts_tags ON public.community_posts USING GIN (tags);
    CREATE INDEX idx_community_posts_industry_tags ON public.community_posts USING GIN (industry_tags);
    CREATE INDEX idx_community_posts_location_tags ON public.community_posts USING GIN (location_tags);
  END IF;
END $$;

-- Add missing columns if table exists but columns are missing
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS cta_url TEXT,
  ADD COLUMN IF NOT EXISTS promotion_theme TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS industry_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS job_type_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS is enabled
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for INSERT (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'community_posts' 
    AND policyname = 'Users and companies can create posts'
  ) THEN
    CREATE POLICY "Users and companies can create posts" 
    ON public.community_posts 
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
  END IF;
END $$;

-- Create RLS policy for SELECT (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'community_posts' 
    AND policyname = 'Anyone can view published posts'
  ) THEN
    CREATE POLICY "Anyone can view published posts" 
    ON public.community_posts 
    FOR SELECT 
    USING (status = 'published');
  END IF;
END $$;

