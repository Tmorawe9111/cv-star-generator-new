-- Add DELETE policy for company posts
-- Allow companies to delete their own posts (author_type = 'company' AND company_id matches)

-- Policy: Allow companies to delete their own posts
DROP POLICY IF EXISTS "companies_delete_own_posts" ON public.posts;
CREATE POLICY "companies_delete_own_posts" ON public.posts
FOR DELETE USING (
  author_type = 'company' 
  AND company_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = posts.company_id
    AND cu.user_id = auth.uid()
    AND cu.role IN ('owner', 'admin', 'marketing')
  )
);

COMMENT ON POLICY "companies_delete_own_posts" ON public.posts IS 
'Allows company members (owner, admin, marketing) to delete posts from their company.';

