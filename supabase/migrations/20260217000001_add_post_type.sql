-- Add post_meta for guided post templates (Projekt, Suche, Frage, Erfolg, Empfehlung)
-- Extend post_type CHECK to allow new guided types

-- Add post_meta column for template field values
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_meta JSONB DEFAULT '{}'::jsonb;

-- Drop existing post_type constraint (name varies by PostgreSQL version)
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

-- Add new constraint with extended values
ALTER TABLE public.posts
  ADD CONSTRAINT posts_post_type_check
  CHECK (post_type IN (
    'text', 'image', 'link', 'poll', 'event', 'job',
    'freitext', 'projekt', 'suche', 'frage', 'erfolg', 'empfehlung'
  ));

-- Recreate posts_with_engagement view to include post_meta
DROP VIEW IF EXISTS posts_with_engagement CASCADE;
CREATE VIEW posts_with_engagement AS
SELECT 
  p.*,
  COALESCE(likes_post.count, 0)::integer as like_count,
  COALESCE(comments_post.count, 0)::integer as comment_count,
  (
    COALESCE(likes_post.count, 0) * 2 + 
    COALESCE(comments_post.count, 0) * 3
  )::integer as engagement_score
FROM public.posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM public.post_likes 
  WHERE post_id IS NOT NULL
  GROUP BY post_id
) likes_post ON p.id = likes_post.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM public.post_comments 
  WHERE post_id IS NOT NULL
  GROUP BY post_id
) comments_post ON p.id = comments_post.post_id
WHERE p.status = 'published';

GRANT SELECT ON posts_with_engagement TO authenticated, anon;
