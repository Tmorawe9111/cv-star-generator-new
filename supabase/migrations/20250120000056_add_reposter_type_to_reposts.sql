-- Add reposter_type column to post_reposts table for company/user distinction
-- This allows companies to repost user posts

ALTER TABLE public.post_reposts
  ADD COLUMN IF NOT EXISTS reposter_type TEXT DEFAULT 'user' CHECK (reposter_type IN ('user', 'company'));

-- Update existing reposts to be 'user' type
UPDATE public.post_reposts
SET reposter_type = 'user'
WHERE reposter_type IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_post_reposts_reposter_type ON public.post_reposts(reposter_type, reposter_id);

