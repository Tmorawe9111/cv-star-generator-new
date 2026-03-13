-- Phase 1A: Job Management - Tables & Triggers

-- 1. Create job_status enum
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('draft', 'published', 'paused', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Extend job_posts table
DO $$ BEGIN
  ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS status job_status DEFAULT 'draft';
  ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS one_click_apply boolean DEFAULT true;
  ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS documents_required text[] DEFAULT '{}';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 3. Create user_documents table
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('cv', 'anschreiben', 'zeugnis', 'id', 'arbeitserlaubnis')),
  storage_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  is_valid boolean DEFAULT true,
  file_name text,
  file_size integer
);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own documents" ON user_documents;
CREATE POLICY "Users can manage their own documents"
ON user_documents FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Create token_ledger table
CREATE TABLE IF NOT EXISTS token_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES job_posts(id) ON DELETE SET NULL,
  delta integer NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view token ledger" ON token_ledger;
CREATE POLICY "Company members can view token ledger"
ON token_ledger FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_users 
    WHERE user_id = auth.uid()
  )
);

-- 5. Create job_status_history table
CREATE TABLE IF NOT EXISTS job_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_posts(id) ON DELETE CASCADE NOT NULL,
  from_status job_status,
  to_status job_status NOT NULL,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid
);

ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view job status history" ON job_status_history;
CREATE POLICY "Company members can view job status history"
ON job_status_history FOR SELECT
USING (
  job_id IN (
    SELECT id FROM job_posts 
    WHERE company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  )
);

-- 6. Immutable title/location trigger
CREATE OR REPLACE FUNCTION enforce_immutable_title_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (OLD.status = 'published') THEN
    IF (NEW.title <> OLD.title) THEN
      RAISE EXCEPTION 'Titel ist nach Veröffentlichung nicht mehr änderbar.';
    END IF;
    IF (NEW.city <> OLD.city OR COALESCE(NEW.country, '') <> COALESCE(OLD.country, '')) THEN
      RAISE EXCEPTION 'Standort ist nach Veröffentlichung nicht mehr änderbar.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_title_location ON job_posts;
CREATE TRIGGER trg_immutable_title_location
BEFORE UPDATE ON job_posts
FOR EACH ROW EXECUTE FUNCTION enforce_immutable_title_location();

-- 7. Extend applications table
DO $$ BEGIN
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS match_score integer;
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS unlock_type text CHECK (unlock_type IN ('job_based', 'independent'));
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS linked_job_id uuid REFERENCES job_posts(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 8. Set existing jobs to correct status
UPDATE job_posts 
SET status = 'published' 
WHERE is_active = true AND (status IS NULL OR status::text = 'draft');

UPDATE job_posts 
SET status = 'inactive' 
WHERE is_active = false AND (status IS NULL OR status::text != 'inactive');

-- 9. Create indexes
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_job_posts_company_status ON job_posts(company_id, status);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_type ON user_documents(user_id, document_type);
CREATE INDEX IF NOT EXISTS idx_token_ledger_company ON token_ledger(company_id, created_at DESC);