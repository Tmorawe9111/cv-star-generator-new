-- Ensure RLS policy for company posts is correct
-- This migration ensures company users can create posts

-- Drop all existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users and companies can create posts" ON public.community_posts;

-- Create a comprehensive INSERT policy that allows both users and company users to create posts
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

-- Also ensure the constraint allows company posts
-- The constraint should already exist, but we verify it's correct
DO $$
BEGIN
  -- Check if constraint exists and is correct
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'community_posts_author_check'
    AND conrelid = 'public.community_posts'::regclass
  ) THEN
    -- Add constraint if it doesn't exist
    ALTER TABLE public.community_posts
    ADD CONSTRAINT community_posts_author_check CHECK (
      (author_type = 'user' AND author_id = user_id AND company_id IS NULL) OR
      (author_type = 'company' AND author_id = company_id AND company_id IS NOT NULL)
    );
  END IF;
END $$;

