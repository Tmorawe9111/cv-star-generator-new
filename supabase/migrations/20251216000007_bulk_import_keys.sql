-- Bulk import keys for idempotent upserts

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN external_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_external_id_key' AND conrelid = 'public.companies'::regclass
  ) THEN
    ALTER TABLE public.companies
    ADD CONSTRAINT companies_external_id_key UNIQUE (external_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'company_locations' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.company_locations ADD COLUMN external_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_locations_company_external_id_key' AND conrelid = 'public.company_locations'::regclass
  ) THEN
    ALTER TABLE public.company_locations
    ADD CONSTRAINT company_locations_company_external_id_key UNIQUE (company_id, external_id);
  END IF;
END $$;

DO $$
BEGIN
  -- job_posts already has external_id in this repo; ensure idempotent constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'job_posts_company_external_id_key' AND conrelid = 'public.job_posts'::regclass
  ) THEN
    ALTER TABLE public.job_posts
    ADD CONSTRAINT job_posts_company_external_id_key UNIQUE (company_id, external_id);
  END IF;
END $$;

-- Idempotency mapping for seed user imports
CREATE TABLE IF NOT EXISTS public.seed_user_keys (
  external_id text PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.seed_user_keys_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seed_user_keys_updated_at ON public.seed_user_keys;
CREATE TRIGGER trg_seed_user_keys_updated_at
  BEFORE UPDATE ON public.seed_user_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_user_keys_set_updated_at();

ALTER TABLE public.seed_user_keys ENABLE ROW LEVEL SECURITY;

-- Keep RLS strict; Edge Functions (service role) bypass RLS.
DROP POLICY IF EXISTS "No direct access to seed_user_keys" ON public.seed_user_keys;
CREATE POLICY "No direct access to seed_user_keys"
  ON public.seed_user_keys
  FOR ALL
  USING (false)
  WITH CHECK (false);


