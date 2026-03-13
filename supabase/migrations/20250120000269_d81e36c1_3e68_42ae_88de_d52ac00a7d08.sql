-- Migration: Erweitere job_posts für AI-Matching
-- Füge Skills, Languages, Certifications, strukturierte Beschreibungen hinzu

-- Neue Spalten für job_posts
ALTER TABLE job_posts
ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS required_languages jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tasks_md text,
ADD COLUMN IF NOT EXISTS requirements_md text,
ADD COLUMN IF NOT EXISTS benefits_description text,
ADD COLUMN IF NOT EXISTS work_mode text CHECK (work_mode IN ('remote', 'hybrid', 'onsite')),
ADD COLUMN IF NOT EXISTS working_hours text;

-- Kommentare für Dokumentation
COMMENT ON COLUMN job_posts.skills IS 'Skills mit Levels: [{"name": "AutoCAD", "level": "must_have"}, ...]';
COMMENT ON COLUMN job_posts.required_languages IS 'Sprachen mit Levels: [{"language": "Deutsch", "level": "C1"}, ...]';
COMMENT ON COLUMN job_posts.certifications IS 'Benötigte Zertifikate/Führerscheine';
COMMENT ON COLUMN job_posts.tasks_md IS 'Aufgaben und Tätigkeiten (Markdown)';
COMMENT ON COLUMN job_posts.requirements_md IS 'Anforderungen: Must-have & Nice-to-have (Markdown)';
COMMENT ON COLUMN job_posts.benefits_description IS 'Benefits und Zusatzleistungen (Markdown)';
COMMENT ON COLUMN job_posts.work_mode IS 'Arbeitsmodell: remote, hybrid, onsite';
COMMENT ON COLUMN job_posts.working_hours IS 'Arbeitszeiten (z.B. "40h/Woche, flexible Zeiten")';

-- Trigger: Auto-Matching bei neuem Job
CREATE OR REPLACE FUNCTION trigger_match_candidates_for_new_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nur bei INSERT oder Status-Change zu 'active'
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    
    -- Batch-Matching Edge Function aufrufen (asynchron via pg_net)
    PERFORM net.http_post(
      url := 'https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/compute-job-match-batch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveW1tdnVoY3hsdmN1b3lqbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODA3NTcsImV4cCI6MjA2OTk1Njc1N30.Pb5uz3xFH2Fupk9JSjcbxNrS-s_mE3ySnFy5B7HcZFw'
      ),
      body := jsonb_build_object('job_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger anhängen
DROP TRIGGER IF EXISTS on_job_publish_match_candidates ON job_posts;
CREATE TRIGGER on_job_publish_match_candidates
AFTER INSERT OR UPDATE OF is_active ON job_posts
FOR EACH ROW
EXECUTE FUNCTION trigger_match_candidates_for_new_job();

-- RLS Policy für candidate_match_cache: Companies sehen nur ihre Job-Matches
ALTER TABLE candidate_match_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies can view matches for their jobs" ON candidate_match_cache;
CREATE POLICY "Companies can view matches for their jobs"
ON candidate_match_cache
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM job_posts jp
    JOIN company_users cu ON cu.company_id = jp.company_id
    WHERE jp.id = candidate_match_cache.job_id
    AND cu.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Candidates can view their matches" ON candidate_match_cache;
CREATE POLICY "Candidates can view their matches"
ON candidate_match_cache
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_match_cache.candidate_id
    AND c.user_id = auth.uid()
  )
);