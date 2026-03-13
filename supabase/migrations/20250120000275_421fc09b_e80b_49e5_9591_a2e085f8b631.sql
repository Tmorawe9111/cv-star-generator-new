-- Add INSERT policy for job_posts to allow company members to create jobs
CREATE POLICY "Company members can insert jobs" ON public.job_posts
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = auth.uid() 
    AND accepted_at IS NOT NULL
  )
);

-- Ensure SELECT policy exists for company members
DROP POLICY IF EXISTS "Company members can view their jobs" ON public.job_posts;
CREATE POLICY "Company members can view their jobs" ON public.job_posts
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = auth.uid() 
    AND accepted_at IS NOT NULL
  )
);

-- Ensure UPDATE policy exists for company members
DROP POLICY IF EXISTS "Company members can update their jobs" ON public.job_posts;
CREATE POLICY "Company members can update their jobs" ON public.job_posts
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = auth.uid() 
    AND accepted_at IS NOT NULL
  )
);

-- Ensure DELETE policy exists for company members
DROP POLICY IF EXISTS "Company members can delete their jobs" ON public.job_posts;
CREATE POLICY "Company members can delete their jobs" ON public.job_posts
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = auth.uid() 
    AND accepted_at IS NOT NULL
  )
);