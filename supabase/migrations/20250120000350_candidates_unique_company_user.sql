-- Ensure candidates is a thin link table: one row per (company_id, user_id)
-- This prevents duplicate candidate bridge rows used by applications.

DO $$
BEGIN
  -- If duplicates exist, abort with a clear message (we don't auto-delete).
  IF EXISTS (
    SELECT 1
    FROM public.candidates
    GROUP BY company_id, user_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add unique constraint candidates(company_id,user_id): duplicates exist. Please deduplicate first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'candidates_company_user_unique'
      AND conrelid = 'public.candidates'::regclass
  ) THEN
    ALTER TABLE public.candidates
      ADD CONSTRAINT candidates_company_user_unique UNIQUE (company_id, user_id);
  END IF;
END $$;


