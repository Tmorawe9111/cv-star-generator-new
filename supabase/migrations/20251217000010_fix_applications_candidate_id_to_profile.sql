-- Ensure applications.candidate_id consistently references profiles.id (auth.uid()).
-- Historically some rows used candidates.id (company-specific bridge row).
-- This migration normalizes existing data and prevents future duplicates.

-- 1) Convert legacy rows: applications.candidate_id == candidates.id  -> candidates.user_id
UPDATE public.applications a
SET candidate_id = c.user_id
FROM public.candidates c
WHERE a.candidate_id = c.id;

-- 2) Deduplicate (after normalization) by (candidate_id, job_id).
-- Keep the most recently updated row (or newest created_at as fallback).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY candidate_id, job_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.applications
  WHERE candidate_id IS NOT NULL
    AND job_id IS NOT NULL
)
DELETE FROM public.applications a
USING ranked r
WHERE a.id = r.id
  AND r.rn > 1;

-- 3) Enforce: one application per candidate per job
CREATE UNIQUE INDEX IF NOT EXISTS uniq_applications_candidate_job
ON public.applications (candidate_id, job_id);


