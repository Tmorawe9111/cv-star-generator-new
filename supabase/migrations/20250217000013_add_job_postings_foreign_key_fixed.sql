-- Add foreign key constraint to profile_unlocks (only if it doesn't exist)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_profile_unlocks_job_posting_id' 
        AND table_name = 'profile_unlocks'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profile_unlocks 
        ADD CONSTRAINT fk_profile_unlocks_job_posting_id 
        FOREIGN KEY (job_posting_id) REFERENCES public.job_postings(id) ON DELETE SET NULL;
    END IF;
END $$;
