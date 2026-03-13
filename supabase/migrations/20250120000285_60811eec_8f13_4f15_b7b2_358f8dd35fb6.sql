-- Phase 1: Create notification helper function with deduplication
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_type public.recipient_type,
  p_recipient_id UUID,
  p_type public.notif_type,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_actor_type public.recipient_type DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_group_key TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 0,
  p_channels public.notif_channel[] DEFAULT ARRAY['in_app'::public.notif_channel]
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_notif_id UUID;
  v_user_prefs RECORD;
BEGIN
  -- Check user preferences
  SELECT in_app, email INTO v_user_prefs
  FROM public.notification_prefs
  WHERE user_id = p_recipient_id AND type = p_type;

  -- If user has disabled in_app, skip
  IF v_user_prefs.in_app IS FALSE THEN
    RETURN NULL;
  END IF;

  -- Deduplicate: Check if similar notification exists within last 5 minutes
  IF p_group_key IS NOT NULL THEN
    SELECT id INTO v_notif_id
    FROM public.notifications
    WHERE recipient_type = p_recipient_type
      AND recipient_id = p_recipient_id
      AND group_key = p_group_key
      AND created_at > (now() - INTERVAL '5 minutes')
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_notif_id IS NOT NULL THEN
      -- Update existing notification instead of creating new
      UPDATE public.notifications
      SET 
        title = p_title,
        body = p_body,
        payload = p_payload,
        created_at = now()
      WHERE id = v_notif_id;
      
      RETURN v_notif_id;
    END IF;
  END IF;

  -- Create new notification
  INSERT INTO public.notifications (
    recipient_type,
    recipient_id,
    type,
    title,
    body,
    actor_type,
    actor_id,
    payload,
    group_key,
    priority,
    channels
  ) VALUES (
    p_recipient_type,
    p_recipient_id,
    p_type,
    p_title,
    p_body,
    p_actor_type,
    p_actor_id,
    p_payload,
    p_group_key,
    p_priority,
    p_channels
  ) RETURNING id INTO v_notif_id;

  RETURN v_notif_id;
END;
$$;

-- Phase 6: Add soft delete column
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_deleted 
ON public.notifications(deleted_at) 
WHERE deleted_at IS NULL;

-- Phase 2: Event Triggers
-- 2.1 Notify company when candidate applies
CREATE OR REPLACE FUNCTION notify_application_submitted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_candidate_name TEXT;
  v_job_title TEXT;
BEGIN
  SELECT full_name INTO v_candidate_name FROM profiles WHERE id = NEW.candidate_id;
  SELECT title INTO v_job_title FROM job_posts WHERE id = NEW.job_id;

  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := NEW.company_id,
    p_type := 'pipeline_activity_team',
    p_title := 'Neue Bewerbung eingegangen',
    p_body := v_candidate_name || ' hat sich auf "' || v_job_title || '" beworben',
    p_actor_type := 'profile',
    p_actor_id := NEW.candidate_id,
    p_payload := jsonb_build_object(
      'application_id', NEW.id,
      'job_id', NEW.job_id,
      'candidate_id', NEW.candidate_id
    ),
    p_group_key := 'app_' || NEW.job_id::text,
    p_priority := 5
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_application_notification ON applications;
CREATE TRIGGER trigger_application_notification
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION notify_application_submitted();

-- 2.2 Notify company when someone requests employment
CREATE OR REPLACE FUNCTION notify_employment_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_company_name TEXT;
BEGIN
  SELECT full_name INTO v_user_name FROM profiles WHERE id = NEW.user_id;
  SELECT name INTO v_company_name FROM companies WHERE id = NEW.company_id;

  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := NEW.company_id,
    p_type := 'employment_request',
    p_title := 'Neue Beschäftigungsanfrage',
    p_body := v_user_name || ' möchte bei ' || v_company_name || ' arbeiten',
    p_actor_type := 'profile',
    p_actor_id := NEW.user_id,
    p_payload := jsonb_build_object(
      'request_id', NEW.id,
      'user_id', NEW.user_id,
      'user_name', v_user_name,
      'company_name', v_company_name
    ),
    p_group_key := 'emp_req_' || NEW.user_id::text,
    p_priority := 8
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_employment_request_notification ON company_employment_requests;
CREATE TRIGGER trigger_employment_request_notification
AFTER INSERT ON company_employment_requests
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_employment_request();

-- 2.3 Notify candidate when company follows them
CREATE OR REPLACE FUNCTION notify_follow_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_name TEXT;
BEGIN
  SELECT name INTO v_company_name FROM companies WHERE id = NEW.company_id;

  PERFORM create_notification(
    p_recipient_type := 'profile',
    p_recipient_id := NEW.candidate_id,
    p_type := 'follow_request_received',
    p_title := 'Neue Follow-Anfrage',
    p_body := v_company_name || ' möchte dir folgen',
    p_actor_type := 'company',
    p_actor_id := NEW.company_id,
    p_payload := jsonb_build_object(
      'follow_id', NEW.id,
      'company_id', NEW.company_id
    ),
    p_group_key := 'follow_' || NEW.company_id::text,
    p_priority := 6
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_follow_request_notification ON company_follows;
CREATE TRIGGER trigger_follow_request_notification
AFTER INSERT ON company_follows
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_follow_request();