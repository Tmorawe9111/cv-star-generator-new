-- Add employee_count and mission_statement to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS employee_count integer,
  ADD COLUMN IF NOT EXISTS mission_statement text;

-- Optional: simple non-negative check for employee_count
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_employee_count_nonneg'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_employee_count_nonneg CHECK (employee_count IS NULL OR employee_count >= 0);
  END IF;
END $$;