-- Fix blog_posts foreign key constraint to handle profile deletion
-- Set ON DELETE behavior to SET NULL so blog posts are preserved when author profile is deleted

-- Drop the existing foreign key constraint
ALTER TABLE public.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

-- Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Add comment
COMMENT ON CONSTRAINT blog_posts_author_id_fkey ON public.blog_posts IS 
'Foreign key to profiles table. When a profile is deleted, author_id is set to NULL to preserve blog posts.';

