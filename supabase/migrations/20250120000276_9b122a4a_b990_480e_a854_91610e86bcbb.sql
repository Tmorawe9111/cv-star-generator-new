-- Add skills and qualification fields to job_posts table
ALTER TABLE public.job_posts
ADD COLUMN IF NOT EXISTS must_have TEXT[],
ADD COLUMN IF NOT EXISTS nice_to_have TEXT[],
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS additional_qualifications TEXT;