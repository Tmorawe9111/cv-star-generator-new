-- Fix notify_application_withdrawn trigger/function:
-- legacy versions referenced application_status='withdrawn' which is not part of the enum.
-- Canonical: use status='archived' for candidate-withdrawn applications.

DROP TRIGGER IF EXISTS trigger_application_withdrawn ON public.applications;

CREATE OR REPLACE FUNCTION public.notify_application_withdrawn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate_name text;
  v_job_title text;
  v_reason text;
BEGIN
  -- Fire only on updates that transition into archived
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'archived' OR NEW.status <> 'archived' THEN
    RETURN NEW;
  END IF;

  -- Optional: only treat as "withdrawn" if we have our marker (prevents noise when companies archive)
  -- If marker column not used, this still works and notifies on archived transition.
  IF NEW.reason_short IS NOT NULL AND NEW.reason_short <> '' AND NEW.reason_short <> 'candidate_withdrew' THEN
    -- archived for another reason; skip notification
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email) INTO v_candidate_name
  FROM public.profiles
  WHERE id = NEW.candidate_id;

  SELECT title INTO v_job_title
  FROM public.job_posts
  WHERE id = NEW.job_id;

  v_reason := NULLIF(COALESCE(NEW.reason_custom, ''), '');

  PERFORM public.create_notification(
    p_recipient_type := 'company',
    p_recipient_id := NEW.company_id,
    p_type := 'application_withdrawn',
    p_title := 'Bewerbung zurückgezogen',
    p_body := COALESCE(v_candidate_name, 'Ein Kandidat') ||
      ' hat die Bewerbung auf "' || COALESCE(v_job_title, 'eine Position') || '" zurückgezogen' ||
      CASE WHEN v_reason IS NOT NULL THEN ' (' || v_reason || ')' ELSE '' END,
    p_actor_type := 'profile',
    p_actor_id := NEW.candidate_id,
    p_payload := jsonb_build_object(
      'application_id', NEW.id,
      'job_id', NEW.job_id,
      'candidate_id', NEW.candidate_id,
      'job_title', v_job_title,
      'reason', v_reason
    ),
    p_group_key := 'app_wdrw_' || COALESCE(NEW.job_id::text, NEW.id::text),
    p_priority := 5
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_application_withdrawn
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_application_withdrawn();


