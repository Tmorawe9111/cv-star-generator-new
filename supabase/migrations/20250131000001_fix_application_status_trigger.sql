-- Fix application_received trigger to use correct enum value
-- The trigger was checking for 'submitted' which doesn't exist in application_status enum
-- Valid values are: 'new', 'unlocked', 'interview', 'offer', 'hired', 'rejected', 'archived'

CREATE OR REPLACE FUNCTION notify_application_received()
RETURNS TRIGGER AS $$
DECLARE
  v_candidate_name TEXT;
  v_job_title TEXT;
BEGIN
  -- Check if status is 'new' (new applications from candidates)
  -- Only notify for applications that were submitted by candidates (source = 'applied')
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

