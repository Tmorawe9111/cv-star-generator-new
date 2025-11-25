-- Phase 1: Extend notif_type ENUM with new types
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'application_received';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'application_withdrawn';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'candidate_message';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'job_post_approved';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'job_post_rejected';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'job_post_expiring';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'billing_invoice_ready';

-- Phase 2: Trigger 1 - Application Received
CREATE OR REPLACE FUNCTION notify_application_received()
RETURNS TRIGGER AS $$
DECLARE
  v_candidate_name TEXT;
  v_job_title TEXT;
BEGIN
  -- Check if status is 'new' (new applications from candidates)
  IF NEW.status != 'new' OR NEW.source != 'applied' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email) INTO v_candidate_name
  FROM profiles
  WHERE id = NEW.candidate_id;

  SELECT title INTO v_job_title
  FROM job_posts
  WHERE id = NEW.job_id;

  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := NEW.company_id,
    p_type := 'application_received',
    p_title := 'Neue Bewerbung',
    p_body := COALESCE(v_candidate_name, 'Ein Kandidat') || ' hat sich auf "' || COALESCE(v_job_title, 'eine Position') || '" beworben',
    p_actor_type := 'profile',
    p_actor_id := NEW.candidate_id,
    p_payload := jsonb_build_object(
      'application_id', NEW.id,
      'job_id', NEW.job_id,
      'candidate_id', NEW.candidate_id,
      'job_title', v_job_title
    ),
    p_group_key := 'app_rcv_' || NEW.job_id::text,
    p_priority := 7
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_application_received ON applications;
CREATE TRIGGER trigger_application_received
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION notify_application_received();

-- Phase 3: Trigger 2 - Application Withdrawn
CREATE OR REPLACE FUNCTION notify_application_withdrawn()
RETURNS TRIGGER AS $$
DECLARE
  v_candidate_name TEXT;
  v_job_title TEXT;
BEGIN
  IF OLD.status = 'withdrawn' OR NEW.status != 'withdrawn' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email) INTO v_candidate_name
  FROM profiles
  WHERE id = NEW.candidate_id;

  SELECT title INTO v_job_title
  FROM job_posts
  WHERE id = NEW.job_id;

  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := NEW.company_id,
    p_type := 'application_withdrawn',
    p_title := 'Bewerbung zurückgezogen',
    p_body := COALESCE(v_candidate_name, 'Ein Kandidat') || ' hat die Bewerbung auf "' || COALESCE(v_job_title, 'eine Position') || '" zurückgezogen',
    p_actor_type := 'profile',
    p_actor_id := NEW.candidate_id,
    p_payload := jsonb_build_object(
      'application_id', NEW.id,
      'job_id', NEW.job_id,
      'candidate_id', NEW.candidate_id,
      'job_title', v_job_title
    ),
    p_group_key := 'app_wdrw_' || NEW.job_id::text,
    p_priority := 5
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_application_withdrawn ON applications;
CREATE TRIGGER trigger_application_withdrawn
AFTER UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION notify_application_withdrawn();

-- Phase 4: Trigger 3 - Candidate Message
CREATE OR REPLACE FUNCTION notify_candidate_message()
RETURNS TRIGGER AS $$
DECLARE
  v_conv RECORD;
  v_recipient_id UUID;
  v_sender_name TEXT;
  v_is_company_recipient BOOLEAN := false;
BEGIN
  SELECT a_id, b_id INTO v_conv
  FROM conversations
  WHERE id = NEW.conversation_id;

  IF v_conv IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.sender_id) THEN
    IF v_conv.a_id = NEW.sender_id THEN
      v_recipient_id := v_conv.b_id;
    ELSE
      v_recipient_id := v_conv.a_id;
    END IF;

    IF EXISTS (SELECT 1 FROM companies WHERE id = v_recipient_id) THEN
      v_is_company_recipient := true;
    END IF;
  END IF;

  IF NOT v_is_company_recipient THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email) INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := v_recipient_id,
    p_type := 'candidate_message',
    p_title := 'Neue Nachricht',
    p_body := COALESCE(v_sender_name, 'Ein Kandidat') || ' hat dir eine Nachricht geschickt',
    p_actor_type := 'profile',
    p_actor_id := NEW.sender_id,
    p_payload := jsonb_build_object(
      'message_id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'preview', LEFT(NEW.content, 100)
    ),
    p_group_key := 'msg_' || NEW.conversation_id::text,
    p_priority := 8
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_candidate_message ON messages;
CREATE TRIGGER trigger_candidate_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_candidate_message();

-- Phase 5: Trigger 4+5 - Job Approved/Rejected
CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_notif_type notif_type;
  v_title TEXT;
  v_body TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    v_notif_type := 'job_post_approved';
    v_title := 'Stellenanzeige freigegeben';
    v_body := 'Deine Stellenanzeige "' || NEW.title || '" wurde freigegeben und ist jetzt live';
  ELSIF NEW.status = 'rejected' THEN
    v_notif_type := 'job_post_rejected';
    v_title := 'Stellenanzeige abgelehnt';
    v_body := 'Deine Stellenanzeige "' || NEW.title || '" wurde leider abgelehnt. Bitte überarbeite sie';
  ELSE
    RETURN NEW;
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

DROP TRIGGER IF EXISTS trigger_job_status_change ON job_posts;
CREATE TRIGGER trigger_job_status_change
AFTER UPDATE ON job_posts
FOR EACH ROW
EXECUTE FUNCTION notify_job_status_change();

-- Phase 6: Trigger 6 - Job Expiring Soon (Function only, cron setup manual)
CREATE OR REPLACE FUNCTION notify_expiring_jobs()
RETURNS void AS $$
DECLARE
  v_job RECORD;
BEGIN
  FOR v_job IN
    SELECT id, company_id, title, end_date
    FROM job_posts
    WHERE status = 'approved'
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

-- Phase 7: Trigger 7 - Billing Invoice Ready
CREATE OR REPLACE FUNCTION notify_billing_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_number TEXT;
  v_org_id UUID;
BEGIN
  IF NEW.event_type != 'invoice_ready' THEN
    RETURN NEW;
  END IF;

  v_org_id := NEW.org_id;
  v_invoice_number := NEW.payload->>'invoice_number';

  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := v_org_id,
    p_type := 'billing_invoice_ready',
    p_title := 'Neue Rechnung verfügbar',
    p_body := 'Rechnung ' || COALESCE(v_invoice_number, '#' || NEW.id::text) || ' ist jetzt verfügbar',
    p_actor_type := NULL,
    p_actor_id := NULL,
    p_payload := jsonb_build_object(
      'billing_event_id', NEW.id,
      'invoice_number', v_invoice_number,
      'event_type', NEW.event_type
    ),
    p_group_key := 'billing_' || v_org_id::text,
    p_priority := 4
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_billing_invoice ON billing_events;
CREATE TRIGGER trigger_billing_invoice
AFTER INSERT OR UPDATE ON billing_events
FOR EACH ROW
EXECUTE FUNCTION notify_billing_invoice();

-- Note: pg_cron setup for notify_expiring_jobs() must be done manually:
-- SELECT cron.schedule('notify-expiring-jobs', '0 9 * * *', $$SELECT notify_expiring_jobs()$$);