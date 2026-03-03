-- Add foreign key constraint to profile_unlocks after job_postings table exists

-- First, add the foreign key constraint
ALTER TABLE public.profile_unlocks 
ADD CONSTRAINT fk_profile_unlocks_job_posting_id 
FOREIGN KEY (job_posting_id) REFERENCES public.job_postings(id) ON DELETE SET NULL;
