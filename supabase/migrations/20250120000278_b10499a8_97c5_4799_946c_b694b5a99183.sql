-- Ensure token_ledger has job_id column
DO $$ BEGIN
  ALTER TABLE token_ledger ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES job_posts(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;