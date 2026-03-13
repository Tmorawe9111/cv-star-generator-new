-- Drop the old version of create_notification that uses recipient_type enum
DROP FUNCTION IF EXISTS public.create_notification(
  p_recipient_type recipient_type,
  p_recipient_id uuid,
  p_type notif_type,
  p_title text,
  p_body text,
  p_actor_type recipient_type,
  p_actor_id uuid,
  p_payload jsonb,
  p_group_key text,
  p_priority integer,
  p_channels notif_channel[]
);