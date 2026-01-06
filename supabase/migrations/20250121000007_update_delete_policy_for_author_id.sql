-- Update DELETE policy to support both user_id and author_id
-- This ensures posts can be deleted whether they use user_id or author_id

-- Drop existing delete policy
DROP POLICY IF EXISTS "users_delete_own_posts" ON public.posts;

-- Create updated policy that supports both user_id and author_id
CREATE POLICY "users_delete_own_posts" ON public.posts
FOR DELETE USING (
  author_type = 'user' 
  AND (
    auth.uid() = user_id 
    OR auth.uid() = author_id
  )
);

COMMENT ON POLICY "users_delete_own_posts" ON public.posts IS 
'Allows users to delete their own posts. Supports both user_id and author_id fields.';

