-- Add industry column to job_posts table
ALTER TABLE public.job_posts 
ADD COLUMN IF NOT EXISTS industry text;

-- Ensure status column exists for draft functionality (if not already present)
ALTER TABLE public.job_posts 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_job_posts_industry ON public.job_posts(industry);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON public.job_posts(status);