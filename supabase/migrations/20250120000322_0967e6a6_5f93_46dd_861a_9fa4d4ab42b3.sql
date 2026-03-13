-- Migration 2: Applications Tabelle umbauen (korrigiert)
-- WICHTIG: Backup erstellen, Policies anpassen, Daten migrieren

-- 1. Backup der existierenden Daten
CREATE TABLE IF NOT EXISTS public.applications_backup_migration AS 
SELECT * FROM public.applications;

-- 2. Abhängige RLS Policies temporär droppen
DROP POLICY IF EXISTS applications_company_access ON public.applications;
DROP POLICY IF EXISTS applications_select_policy ON public.applications;

-- 3. Neue Spalten mit Enum-Typen hinzufügen
ALTER TABLE public.applications 
  ADD COLUMN IF NOT EXISTS source_new application_source,
  ADD COLUMN IF NOT EXISTS status_new application_status,
  ADD COLUMN IF NOT EXISTS reason_short text,
  ADD COLUMN IF NOT EXISTS reason_custom text,
  ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT true;

-- 4. Datenmigration: alte 'source' -> neue 'source_new'
UPDATE public.applications 
SET source_new = CASE 
  WHEN source = 'portal' THEN 'applied'::application_source
  WHEN source = 'sourced' THEN 'sourced'::application_source
  ELSE 'applied'::application_source
END
WHERE source_new IS NULL;

-- 5. Datenmigration: alte 'stage'/'status' -> neue 'status_new'
UPDATE public.applications
SET status_new = CASE
  WHEN stage = 'new' OR status = 'pending' THEN 'new'::application_status
  WHEN stage = 'interview' THEN 'interview'::application_status
  WHEN stage = 'rejected' OR status = 'rejected' THEN 'rejected'::application_status
  WHEN stage = 'hired' THEN 'hired'::application_status
  WHEN unlocked_at IS NOT NULL THEN 'unlocked'::application_status
  ELSE 'new'::application_status
END
WHERE status_new IS NULL;

-- 6. Absagegründe migrieren (falls vorhanden)
UPDATE public.applications
SET reason_short = CASE
  WHEN rejection_reason IS NOT NULL AND rejection_reason != '' THEN 'custom'
  ELSE NULL
END,
reason_custom = rejection_reason
WHERE status_new = 'rejected'::application_status;

-- 7. is_new Flag setzen (nur bei neuen Bewerbungen)
UPDATE public.applications
SET is_new = CASE
  WHEN source_new = 'applied'::application_source AND status_new = 'new'::application_status THEN true
  ELSE false
END;

-- 8. Alte Spalten droppen (inkl. user_id da wir nur candidate_id brauchen)
ALTER TABLE public.applications 
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS stage,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS rejection_reason,
  DROP COLUMN IF EXISTS viewed_by_company,
  DROP COLUMN IF EXISTS job_post_id,
  DROP COLUMN IF EXISTS cover_letter,
  DROP COLUMN IF EXISTS resume_url,
  DROP COLUMN IF EXISTS portfolio_url,
  DROP COLUMN IF EXISTS linked_job_id,
  DROP COLUMN IF EXISTS interview_note,
  DROP COLUMN IF EXISTS contacted_confirmed,
  DROP COLUMN IF EXISTS contacted_confirmed_at,
  DROP COLUMN IF EXISTS company_response_at,
  DROP COLUMN IF EXISTS archived_at,
  DROP COLUMN IF EXISTS archived_by,
  DROP COLUMN IF EXISTS unread,
  DROP COLUMN IF EXISTS applied_at,
  DROP COLUMN IF EXISTS unlock_type,
  DROP COLUMN IF EXISTS user_id;

-- 9. Neue Spalten umbenennen und NOT NULL setzen
ALTER TABLE public.applications 
  ALTER COLUMN source_new SET NOT NULL,
  ALTER COLUMN status_new SET NOT NULL;

ALTER TABLE public.applications 
  RENAME COLUMN source_new TO source;
ALTER TABLE public.applications 
  RENAME COLUMN status_new TO status;

-- 10. job_id kann NULL sein (bei initiativer Freischaltung ohne Stelle)
ALTER TABLE public.applications 
  ALTER COLUMN job_id DROP NOT NULL;

-- 11. Unique Constraint für (company_id, candidate_id, job_id)
CREATE UNIQUE INDEX IF NOT EXISTS applications_unique_per_job_idx
ON public.applications (company_id, candidate_id, COALESCE(job_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 12. Neue RLS Policies (aus dem Plan)
CREATE POLICY applications_company_read
ON public.applications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.company_users cu
  WHERE cu.user_id = auth.uid() AND cu.company_id = applications.company_id
));

CREATE POLICY applications_company_update
ON public.applications FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.company_users cu
  WHERE cu.user_id = auth.uid() AND cu.company_id = applications.company_id
));

-- Insert: Kandidat bewirbt sich (applied/new)
CREATE POLICY applications_insert_candidate
ON public.applications FOR INSERT
WITH CHECK (
  candidate_id = auth.uid()
  AND source = 'applied'
  AND status = 'new'
  AND job_id IS NOT NULL
  AND company_id = (SELECT j.company_id FROM public.job_posts j WHERE j.id = job_id)
);

-- Insert: Firma schaltet frei (sourced/unlocked)
CREATE POLICY applications_insert_company
ON public.applications FOR INSERT
WITH CHECK (
  source = 'sourced'
  AND status = 'unlocked'
  AND EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.user_id = auth.uid() AND cu.company_id = applications.company_id
  )
);

-- 13. Guard-Trigger montieren
DROP TRIGGER IF EXISTS trg_applications_guard ON public.applications;
CREATE TRIGGER trg_applications_guard
BEFORE INSERT OR UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.tg_applications_guard();

-- 14. Kommentar
COMMENT ON TABLE public.applications IS 'Migration 2 completed: Unified applications with enums and transitions';