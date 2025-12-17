-- Ensure applications.candidate_id consistently references profiles.id (auth.uid()).
-- Historically some rows used candidates.id (company-specific bridge row).
-- This migration normalizes existing data and prevents future duplicates.

-- IMPORTANT:
-- In older schemas, applications.candidate_id had a FK to candidates(id), so converting it to profiles(id)
-- would fail unless we drop that FK first.

-- 0) Drop FK to candidates (if present) and uniqueness index that may conflict during migration
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_candidate_id_fkey;

DROP INDEX IF EXISTS public.applications_unique_per_job_idx;
DROP INDEX IF EXISTS public.uniq_applications_candidate_job;

-- 1) Convert legacy rows: applications.candidate_id == candidates.id  -> candidates.user_id (= profiles.id)
UPDATE public.applications a
SET candidate_id = c.user_id
FROM public.candidates c
WHERE a.candidate_id = c.id;

-- 2) Deduplicate (after normalization) by (company_id, candidate_id, job_id), keeping the most recent row
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY company_id, candidate_id, COALESCE(job_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.applications
  WHERE candidate_id IS NOT NULL
)
DELETE FROM public.applications a
USING ranked r
WHERE a.id = r.id
  AND r.rn > 1;

-- 3) Enforce: one application per (company, candidate, job)
CREATE UNIQUE INDEX IF NOT EXISTS applications_unique_per_job_idx
ON public.applications (company_id, candidate_id, COALESCE(job_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Optional: also enforce one application per candidate per job (global job_id)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_applications_candidate_job
ON public.applications (candidate_id, job_id)
WHERE candidate_id IS NOT NULL AND job_id IS NOT NULL;

-- 4) Add FK to profiles for PostgREST embeds (applications.candidate_id -> profiles.id)
ALTER TABLE public.applications
  ADD CONSTRAINT applications_candidate_id_fkey
  FOREIGN KEY (candidate_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


