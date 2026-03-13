-- Add linked_job_ids column to company_candidates for job-specific assignment
ALTER TABLE company_candidates 
ADD COLUMN linked_job_ids jsonb DEFAULT '[]'::jsonb;

-- Create GIN index for efficient jsonb contains queries
CREATE INDEX idx_company_candidates_linked_jobs 
ON company_candidates USING gin(linked_job_ids);

-- Add comment for documentation
COMMENT ON COLUMN company_candidates.linked_job_ids IS 'Array of job_post IDs this candidate is linked to, e.g. ["uuid1", "uuid2"]';