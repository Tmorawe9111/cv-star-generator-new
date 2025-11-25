-- Fix RLS policy for company users to create posts
-- Ensure company users can create posts in community_posts table

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;

-- Create a new INSERT policy that allows both users and company users to create posts
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

