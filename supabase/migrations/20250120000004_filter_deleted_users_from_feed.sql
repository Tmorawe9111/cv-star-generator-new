-- ============================================
-- FIX: Filter deleted users from feed
-- ============================================
-- This migration ensures that posts from deleted users are not shown in the feed

-- Step 1: Update posts_with_engagement view to only show posts from existing profiles
CREATE OR REPLACE VIEW posts_with_engagement AS
SELECT 
  p.*,
  COALESCE(likes.count, 0)::integer as like_count,
  COALESCE(comments.count, 0)::integer as comment_count,
  (COALESCE(likes.count, 0) * 2 + COALESCE(comments.count, 0) * 3)::integer as engagement_score
FROM posts p
-- Only show posts from users who have a profile (user posts)
INNER JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_likes 
  GROUP BY post_id
) likes ON p.id = likes.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_comments 
  GROUP BY post_id
) comments ON p.id = comments.post_id
WHERE p.status = 'published'
  AND p.user_id IS NOT NULL;

-- Step 2: Create a function to clean up orphaned posts (posts without profiles)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete posts from users who don't have a profile anymore
  DELETE FROM posts
  WHERE user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = posts.user_id
    );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Step 3: Create a trigger to automatically delete posts when a profile is deleted
-- Note: This should already be handled by ON DELETE CASCADE, but we add it as a safety measure
CREATE OR REPLACE FUNCTION public.handle_profile_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all posts from the deleted profile
  DELETE FROM posts WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Create trigger (only if it doesn't exist)
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_deletion();

-- Step 4: Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_posts() TO authenticated;

-- Step 5: Run cleanup once to remove any existing orphaned posts
SELECT public.cleanup_orphaned_posts() as deleted_orphaned_posts;

