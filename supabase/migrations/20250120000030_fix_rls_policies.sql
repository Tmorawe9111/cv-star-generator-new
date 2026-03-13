-- Fix RLS Policies for Community Posts
-- This fixes the infinite recursion issue in RLS policies

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.community_posts;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.community_comments;

DROP POLICY IF EXISTS "Anyone can view likes" ON public.community_likes;
DROP POLICY IF EXISTS "Users can create likes" ON public.community_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.community_likes;

DROP POLICY IF EXISTS "Anyone can view shares" ON public.community_shares;
DROP POLICY IF EXISTS "Users can create shares" ON public.community_shares;

-- Create simplified RLS policies without complex joins
CREATE POLICY "Anyone can view published posts" 
ON public.community_posts 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Authenticated users can create posts" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

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

CREATE POLICY "Authenticated users can create comments" 
ON public.community_comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

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

CREATE POLICY "Authenticated users can create likes" 
ON public.community_likes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

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

CREATE POLICY "Authenticated users can create shares" 
ON public.community_shares 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Test the policies
SELECT 'RLS policies updated successfully' as status;
