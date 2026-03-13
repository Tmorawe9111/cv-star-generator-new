-- Add RLS policy to allow public access to published jobs
CREATE POLICY "Public can view published jobs"
ON public.job_posts
FOR SELECT
USING (
  status = 'published' 
  AND is_active = true 
  AND is_public = true
);