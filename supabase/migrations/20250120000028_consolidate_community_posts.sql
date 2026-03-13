-- Community Posts Consolidation Migration
-- This migration consolidates all post-related tables into a single, unified structure
-- Date: 2025-01-30

-- Step 1: Create backup of existing data
CREATE TABLE IF NOT EXISTS posts_backup AS SELECT * FROM posts;
CREATE TABLE IF NOT EXISTS community_posts_backup AS SELECT * FROM community_posts;

-- Step 2: Drop existing conflicting tables
DROP TABLE IF EXISTS community_likes CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE;
DROP TABLE IF EXISTS community_shares CASCADE;
DROP TABLE IF EXISTS community_mentions CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_shares CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS shares CASCADE;

-- Step 3: Create unified community_posts table
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS posts CASCADE;

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
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT community_posts_author_check CHECK (
    (author_type = 'user' AND author_id = user_id AND company_id IS NULL) OR
    (author_type = 'company' AND author_id = company_id AND company_id IS NOT NULL)
  )
);

-- Step 4: Create unified comments table
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  
  -- Comment author
  author_id UUID NOT NULL,
  author_type TEXT NOT NULL DEFAULT 'user' CHECK (author_type IN ('user', 'company')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Comment content
  content TEXT NOT NULL,
  body_md TEXT, -- Markdown support
  
  -- Comment metadata
  parent_comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Engagement
  likes_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT community_comments_author_check CHECK (
    (author_type = 'user' AND author_id = user_id AND company_id IS NULL) OR
    (author_type = 'company' AND author_id = company_id AND company_id IS NOT NULL)
  )
);

-- Step 5: Create unified likes table
CREATE TABLE public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  
  -- Liker information
  liker_id UUID NOT NULL,
  liker_type TEXT NOT NULL DEFAULT 'user' CHECK (liker_type IN ('user', 'company')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Like metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT community_likes_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  CONSTRAINT community_likes_liker_check CHECK (
    (liker_type = 'user' AND liker_id = user_id AND company_id IS NULL) OR
    (liker_type = 'company' AND liker_id = company_id AND company_id IS NOT NULL)
  ),
  CONSTRAINT community_likes_unique_check UNIQUE (post_id, comment_id, liker_id)
);

-- Step 6: Create unified shares table
CREATE TABLE public.community_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  
  -- Sharer information
  sharer_id UUID NOT NULL,
  sharer_type TEXT NOT NULL DEFAULT 'user' CHECK (sharer_type IN ('user', 'company')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Share metadata
  shared_content TEXT, -- Optional comment when sharing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT community_shares_sharer_check CHECK (
    (sharer_type = 'user' AND sharer_id = user_id AND company_id IS NULL) OR
    (sharer_type = 'company' AND sharer_id = company_id AND company_id IS NOT NULL)
  )
);

-- Step 7: Create indexes for performance
CREATE INDEX idx_community_posts_status ON public.community_posts(status);
CREATE INDEX idx_community_posts_author ON public.community_posts(author_id, created_at DESC);
CREATE INDEX idx_community_posts_published ON public.community_posts(status, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_community_posts_company ON public.community_posts(company_id, created_at DESC) WHERE company_id IS NOT NULL;
CREATE INDEX idx_community_posts_user ON public.community_posts(user_id, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX idx_community_comments_post ON public.community_comments(post_id, created_at DESC);
CREATE INDEX idx_community_comments_author ON public.community_comments(author_id, created_at DESC);
CREATE INDEX idx_community_comments_parent ON public.community_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

CREATE INDEX idx_community_likes_post ON public.community_likes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_community_likes_comment ON public.community_likes(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX idx_community_likes_liker ON public.community_likes(liker_id, created_at DESC);

CREATE INDEX idx_community_shares_post ON public.community_shares(post_id, created_at DESC);
CREATE INDEX idx_community_shares_sharer ON public.community_shares(sharer_id, created_at DESC);

-- Step 8: Create trigger functions for counter updates
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.community_posts 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.community_posts 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET shares_count = shares_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET shares_count = shares_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create triggers
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.community_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER trigger_update_post_shares_count
  AFTER INSERT OR DELETE ON public.community_shares
  FOR EACH ROW EXECUTE FUNCTION update_post_shares_count();

-- Step 10: Enable Row Level Security
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_shares ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies
-- Posts policies
CREATE POLICY "Anyone can view published posts" 
ON public.community_posts 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Users can create posts" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (author_type = 'user' AND author_id = auth.uid()) OR
    (author_type = 'company' AND author_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

CREATE POLICY "Users can update their own posts" 
ON public.community_posts 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    (author_type = 'user' AND author_id = auth.uid()) OR
    (author_type = 'company' AND author_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

CREATE POLICY "Users can delete their own posts" 
ON public.community_posts 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    (author_type = 'user' AND author_id = auth.uid()) OR
    (author_type = 'company' AND author_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

-- Comments policies
CREATE POLICY "Anyone can view comments" 
ON public.community_comments 
FOR SELECT 
USING (NOT is_deleted);

CREATE POLICY "Users can create comments" 
ON public.community_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (author_type = 'user' AND author_id = auth.uid()) OR
    (author_type = 'company' AND author_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

CREATE POLICY "Users can update their own comments" 
ON public.community_comments 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    (author_type = 'user' AND author_id = auth.uid()) OR
    (author_type = 'company' AND author_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

CREATE POLICY "Users can delete their own comments" 
ON public.community_comments 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    (author_type = 'user' AND author_id = auth.uid()) OR
    (author_type = 'company' AND author_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

-- Likes policies
CREATE POLICY "Anyone can view likes" 
ON public.community_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create likes" 
ON public.community_likes 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (liker_type = 'user' AND liker_id = auth.uid()) OR
    (liker_type = 'company' AND liker_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

CREATE POLICY "Users can delete their own likes" 
ON public.community_likes 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    (liker_type = 'user' AND liker_id = auth.uid()) OR
    (liker_type = 'company' AND liker_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

-- Shares policies
CREATE POLICY "Anyone can view shares" 
ON public.community_shares 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create shares" 
ON public.community_shares 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (sharer_type = 'user' AND sharer_id = auth.uid()) OR
    (sharer_type = 'company' AND sharer_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    ))
  )
);

-- Step 12: Create views for backward compatibility
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
  created_at,
  updated_at
FROM public.community_posts;

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
  created_at,
  updated_at
FROM public.community_posts
WHERE status = 'published';

-- Step 13: Migrate existing data (if any exists)
-- This will be handled by the application layer to avoid data loss

-- Step 14: Create helper functions
CREATE OR REPLACE FUNCTION get_user_posts(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  likes_count INTEGER,
  comments_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.content,
    cp.created_at,
    cp.likes_count,
    cp.comments_count
  FROM public.community_posts cp
  WHERE cp.author_type = 'user' 
    AND cp.author_id = user_uuid 
    AND cp.status = 'published'
  ORDER BY cp.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_company_posts(company_uuid UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  likes_count INTEGER,
  comments_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.content,
    cp.created_at,
    cp.likes_count,
    cp.comments_count
  FROM public.community_posts cp
  WHERE cp.author_type = 'company' 
    AND cp.author_id = company_uuid 
    AND cp.status = 'published'
  ORDER BY cp.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Migration completed successfully
-- All community post functionality is now consolidated into unified tables
