-- Add documents column to community_posts table (if not already added)
-- This column stores an array of document objects (url, name, type)
-- Note: This column may already exist from the create table migration

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts' 
    AND column_name = 'documents'
  ) THEN
    ALTER TABLE public.community_posts
      ADD COLUMN documents JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Update the posts view to include documents (only if it's a view, not a table)
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
      created_at,
      updated_at
    FROM public.community_posts;
  END IF;
END $$;

-- Update the posts_authenticated view to include documents
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
  created_at,
  updated_at
FROM public.community_posts
WHERE status = 'published';

