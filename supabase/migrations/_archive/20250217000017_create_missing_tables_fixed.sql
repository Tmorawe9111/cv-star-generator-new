-- Create missing tables for unlock system (without job_postings dependency)

-- 1. Create company_token_wallets table
CREATE TABLE IF NOT EXISTS public.company_token_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

-- 2. Create token_transactions table
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  idempotency_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 3. Create profile_unlocks table (without job_posting_id for now)
CREATE TABLE IF NOT EXISTS public.profile_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('basic', 'contact')),
  job_posting_id uuid, -- Will add foreign key later
  general_interest boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, profile_id, level)
);

-- 4. Create data_access_log table
CREATE TABLE IF NOT EXISTS public.data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  object_type text NOT NULL CHECK (object_type IN ('profile', 'attachment')),
  object_id text,
  action text NOT NULL CHECK (action IN ('view', 'download')),
  at timestamptz DEFAULT now()
);

-- 5. Create company_pipelines table
CREATE TABLE IF NOT EXISTS public.company_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Standard',
  created_at timestamptz DEFAULT now()
);

-- 6. Create pipeline_stages table
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.company_pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  UNIQUE (pipeline_id, position)
);

-- 7. Create pipeline_items table
CREATE TABLE IF NOT EXISTS public.pipeline_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
  position int DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE (company_id, profile_id)
);

-- 8. Create recently_viewed_profiles table
CREATE TABLE IF NOT EXISTS public.recently_viewed_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, profile_id)
);

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_token_wallets_company_id ON public.company_token_wallets(company_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_company_id ON public.token_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_profile_id ON public.token_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_idempotency_key ON public.token_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_profile_unlocks_company_profile ON public.profile_unlocks(company_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_data_access_log_company_profile ON public.data_access_log(company_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_items_company_profile ON public.pipeline_items(company_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_profiles_company ON public.recently_viewed_profiles(company_id);
