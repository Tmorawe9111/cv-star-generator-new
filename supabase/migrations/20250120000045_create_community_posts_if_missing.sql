-- Create community_posts table if it doesn't exist
-- This migration ensures the table exists before we try to modify it

CREATE TABLE IF NOT EXISTS public.community_posts (
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
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT community_posts_author_check CHECK (
    (author_type = 'user' AND author_id = user_id AND company_id IS NULL) OR
    (author_type = 'company' AND author_id = company_id AND company_id IS NOT NULL)
  )
);

-- Add columns if table already exists but columns are missing
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS cta_url TEXT,
  ADD COLUMN IF NOT EXISTS promotion_theme TEXT;

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_type ON public.community_posts(author_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_company_id ON public.community_posts(company_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON public.community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_posts_post_type ON public.community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_published_at ON public.community_posts(published_at DESC);

-- Create views for backward compatibility (only if they don't exist as tables)
-- First check if 'posts' is a table, if so, don't create a view
DO $$ 
BEGIN
  -- Only create view if 'posts' doesn't exist as a table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'posts'
    AND table_type = 'BASE TABLE'
  ) THEN
    -- Drop view if it exists
    DROP VIEW IF EXISTS posts;
    -- Create view
    CREATE VIEW posts AS
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

-- Create posts_authenticated view (always safe to replace)
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

