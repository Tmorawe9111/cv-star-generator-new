-- Step 1: Delete orphan entries in company_candidates that reference non-existent candidates
DELETE FROM public.company_candidates
WHERE candidate_id NOT IN (SELECT id FROM public.candidates);

-- Step 2: Drop the incorrect foreign key constraint
ALTER TABLE public.company_candidates 
DROP CONSTRAINT IF EXISTS fk_company_candidates_profile;

-- Step 3: Add the correct foreign key constraint pointing to candidates table
ALTER TABLE public.company_candidates 
ADD CONSTRAINT fk_company_candidates_candidate 
FOREIGN KEY (candidate_id) 
REFERENCES public.candidates(id) 
ON DELETE CASCADE;