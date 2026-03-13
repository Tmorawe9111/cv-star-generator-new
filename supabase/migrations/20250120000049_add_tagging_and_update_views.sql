-- Add tagging columns to community_posts for future filtering
-- These columns will be used later for personalized feed filtering
-- For now, all posts are visible to everyone, but we prepare the structure

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb, -- Array of tag strings (e.g., ["handwerk", "ausbildung", "berlin"])
  ADD COLUMN IF NOT EXISTS industry_tags JSONB DEFAULT '[]'::jsonb, -- Array of industry tags (e.g., ["handwerk", "gastronomie"])
  ADD COLUMN IF NOT EXISTS location_tags JSONB DEFAULT '[]'::jsonb, -- Array of location tags (e.g., ["berlin", "hamburg"])
  ADD COLUMN IF NOT EXISTS job_type_tags JSONB DEFAULT '[]'::jsonb, -- Array of job type tags (e.g., ["ausbildung", "praktikum", "vollzeit"])
  ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '[]'::jsonb; -- Array of target audience (e.g., ["schueler", "azubi", "ausgelernt"])

-- Create indexes for future tag-based filtering
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON public.community_posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_community_posts_industry_tags ON public.community_posts USING GIN (industry_tags);
CREATE INDEX IF NOT EXISTS idx_community_posts_location_tags ON public.community_posts USING GIN (location_tags);
CREATE INDEX IF NOT EXISTS idx_community_posts_job_type_tags ON public.community_posts USING GIN (job_type_tags);
CREATE INDEX IF NOT EXISTS idx_community_posts_target_audience ON public.community_posts USING GIN (target_audience);

-- Update posts view to include all new columns
DO $$ 
BEGIN
  -- Only update if 'posts' is a view, not a table
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'posts'
  ) THEN
    CREATE OR REPLACE VIEW posts AS
    SELECT
      id,
      author_id,
      author_type,
      user_id,
      company_id,
      content,
      body_md,
      media,
      documents,
      image_url,
      post_type,
      status,
      visibility,
      scheduled_at,
      published_at,
      likes_count,
      comments_count,
      shares_count,
      views_count,
      job_id,
      applies_enabled,
      cta_label,
      cta_url,
      promotion_theme,
      tags,
      industry_tags,
      location_tags,
      job_type_tags,
      target_audience,
      created_at,
      updated_at
    FROM public.community_posts;
  END IF;
END $$;

-- Update posts_authenticated view
DROP VIEW IF EXISTS posts_authenticated;
CREATE VIEW posts_authenticated AS
SELECT
  id,
  author_id,
  author_type,
  user_id,
  company_id,
  content,
  body_md,
  media,
  documents,
  image_url,
  post_type,
  status,
  visibility,
  scheduled_at,
  published_at,
  likes_count,
  comments_count,
  shares_count,
  views_count,
  job_id,
  applies_enabled,
  cta_label,
  cta_url,
  promotion_theme,
  tags,
  industry_tags,
  location_tags,
  job_type_tags,
  target_audience,
  created_at,
  updated_at
FROM public.community_posts
WHERE status = 'published';

-- Update posts_with_engagement view to include all columns and support company posts
-- This view is used by the feed to calculate engagement scores
DROP VIEW IF EXISTS posts_with_engagement;
CREATE VIEW posts_with_engagement AS
SELECT 
  p.*,
  COALESCE(likes.count, 0)::integer as like_count,
  COALESCE(comments.count, 0)::integer as comment_count,
  (COALESCE(likes.count, 0) * 2 + COALESCE(comments.count, 0) * 3)::integer as engagement_score
FROM posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM community_likes 
  WHERE post_id IS NOT NULL
  GROUP BY post_id
) likes ON p.id = likes.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM community_comments 
  WHERE post_id IS NOT NULL AND is_deleted = false
  GROUP BY post_id
) comments ON p.id = comments.post_id;

-- Create a function to automatically tag posts based on company/job data
-- This will be called when a post is created or updated
CREATE OR REPLACE FUNCTION public.auto_tag_community_post()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_industry TEXT;
  v_company_city TEXT;
  v_job_title TEXT;
  v_job_city TEXT;
  v_job_employment_type TEXT;
  v_tags JSONB := '[]'::jsonb;
  v_industry_tags JSONB := '[]'::jsonb;
  v_location_tags JSONB := '[]'::jsonb;
  v_job_type_tags JSONB := '[]'::jsonb;
BEGIN
  -- Only auto-tag if tags are empty (allow manual override)
  IF NEW.tags IS NULL OR (NEW.tags::text = '[]' OR jsonb_array_length(NEW.tags) = 0) THEN
    -- Tag based on company if it's a company post
    IF NEW.author_type = 'company' AND NEW.company_id IS NOT NULL THEN
      -- Get company industry and location
      SELECT industry, city
      INTO v_company_industry, v_company_city
      FROM companies
      WHERE id = NEW.company_id;
      
      -- Add industry tags
      IF v_company_industry IS NOT NULL AND v_company_industry != '' THEN
        v_industry_tags := jsonb_build_array(LOWER(v_company_industry));
        v_tags := v_tags || jsonb_build_array(LOWER(v_company_industry));
      END IF;
      
      -- Add location tags
      IF v_company_city IS NOT NULL AND v_company_city != '' THEN
        v_location_tags := jsonb_build_array(LOWER(v_company_city));
        v_tags := v_tags || jsonb_build_array(LOWER(v_company_city));
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
        -- Only add if not already in location_tags
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-tag posts
DROP TRIGGER IF EXISTS trigger_auto_tag_community_post ON public.community_posts;
CREATE TRIGGER trigger_auto_tag_community_post
  BEFORE INSERT OR UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_tag_community_post();

