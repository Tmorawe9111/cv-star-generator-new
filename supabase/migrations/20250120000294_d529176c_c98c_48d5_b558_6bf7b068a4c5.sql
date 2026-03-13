-- Fix create_notification function to properly handle recipient_type enum comparison
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_type notif_recipient, 
  p_recipient_id uuid, 
  p_type notif_type, 
  p_title text, 
  p_body text DEFAULT NULL::text, 
  p_actor_type notif_recipient DEFAULT NULL::notif_recipient, 
  p_actor_id uuid DEFAULT NULL::uuid, 
  p_payload jsonb DEFAULT '{}'::jsonb, 
  p_group_key text DEFAULT NULL::text, 
  p_priority integer DEFAULT 0, 
  p_channels notif_channel[] DEFAULT ARRAY['in_app'::notif_channel]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    WHERE recipient_type = p_recipient_type::notif_recipient
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
    p_recipient_type::notif_recipient,
    p_recipient_id,
    p_type,
    p_title,
    p_body,
    p_actor_type::notif_recipient,
    p_actor_id,
    p_payload,
    p_group_key,
    p_priority,
    p_channels
  ) RETURNING id INTO v_notif_id;

  RETURN v_notif_id;
END;
$$;