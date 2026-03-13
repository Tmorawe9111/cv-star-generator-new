-- Fix: Replace 'approved' with 'published' in job notification triggers

-- Drop and recreate the job status change function with correct status
DROP FUNCTION IF EXISTS notify_job_status_change() CASCADE;

CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_notif_type notif_type;
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- Nur bei Status-Änderung zu published/rejected
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Use 'published' instead of 'approved'
  IF NEW.status = 'published' THEN
    v_notif_type := 'job_post_approved';
    v_title := 'Stellenanzeige freigegeben';
    v_body := 'Deine Stellenanzeige "' || NEW.title || '" wurde freigegeben und ist jetzt live';
  ELSIF NEW.status = 'rejected' THEN
    v_notif_type := 'job_post_rejected';
    v_title := 'Stellenanzeige abgelehnt';
    v_body := 'Deine Stellenanzeige "' || NEW.title || '" wurde leider abgelehnt. Bitte überarbeite sie';
  ELSE
    RETURN NEW; -- Andere Status ignorieren
  END IF;

  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := NEW.company_id,
    p_type := v_notif_type,
    p_title := v_title,
    p_body := v_body,
    p_actor_type := NULL,
    p_actor_id := NULL,
    p_payload := jsonb_build_object(
      'job_id', NEW.id,
      'job_title', NEW.title,
      'status', NEW.status
    ),
    p_group_key := 'job_status_' || NEW.id::text,
    p_priority := 6
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER trigger_job_status_change
AFTER UPDATE ON job_posts
FOR EACH ROW
EXECUTE FUNCTION notify_job_status_change();

-- Fix the expiring jobs function to use 'published' instead of 'approved'
DROP FUNCTION IF EXISTS notify_expiring_jobs() CASCADE;

CREATE OR REPLACE FUNCTION notify_expiring_jobs()
RETURNS void AS $$
DECLARE
  v_job RECORD;
BEGIN
  -- Finde alle Jobs, die in genau 7 Tagen ablaufen
  FOR v_job IN
    SELECT id, company_id, title, end_date
    FROM job_posts
    WHERE status = 'published'  -- Changed from 'approved'
    AND end_date IS NOT NULL
    AND end_date::date = (CURRENT_DATE + INTERVAL '7 days')::date
  LOOP
    PERFORM create_notification(
      p_recipient_type := 'company',
      p_recipient_id := v_job.company_id,
      p_type := 'job_post_expiring',
      p_title := 'Stellenanzeige läuft bald ab',
      p_body := 'Deine Stellenanzeige "' || v_job.title || '" läuft in 7 Tagen ab',
      p_actor_type := NULL,
      p_actor_id := NULL,
      p_payload := jsonb_build_object(
        'job_id', v_job.id,
        'job_title', v_job.title,
        'end_date', v_job.end_date
      ),
      p_group_key := 'job_exp_' || v_job.id::text,
      p_priority := 5
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;