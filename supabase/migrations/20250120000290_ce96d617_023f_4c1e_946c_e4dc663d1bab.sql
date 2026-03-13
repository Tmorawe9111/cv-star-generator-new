-- Add unique constraint for company_id and candidate_id combination
ALTER TABLE public.company_candidates
ADD CONSTRAINT company_candidates_company_id_candidate_id_key 
UNIQUE (company_id, candidate_id);