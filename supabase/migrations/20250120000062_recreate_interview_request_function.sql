-- Recreate create_interview_request function if it doesn't exist
-- This ensures the function is available in the schema cache

CREATE OR REPLACE FUNCTION public.create_interview_request(
  p_company_candidate_id UUID,
  p_interview_type TEXT,
  p_planned_at TIMESTAMPTZ,
  p_location_address TEXT DEFAULT NULL,
  p_company_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_company_id UUID;
  v_candidate_id UUID;
  v_job_id UUID;
  v_company_name TEXT;
  v_job_title TEXT;
  v_candidate_name TEXT;
  v_candidate_email TEXT;
BEGIN
  -- Get company_candidate details
  SELECT 
    cc.company_id,
    cc.candidate_id,
    (cc.linked_job_ids->>0)::UUID
  INTO v_company_id, v_candidate_id, v_job_id
  FROM public.company_candidates cc
  WHERE cc.id = p_company_candidate_id;

  IF v_company_id IS NULL OR v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'Company candidate not found';
  END IF;

  -- Get company name
  SELECT name INTO v_company_name
  FROM public.companies
  WHERE id = v_company_id;

  -- Get job title if job_id exists
  IF v_job_id IS NOT NULL THEN
    SELECT title INTO v_job_title
    FROM public.job_posts
    WHERE id = v_job_id;
  END IF;

  -- Get candidate details
  SELECT 
    COALESCE(vorname || ' ' || nachname, email, 'Kandidat') AS name,
    email
  INTO v_candidate_name, v_candidate_email
  FROM public.profiles
  WHERE id = v_candidate_id;

  -- Create interview request
  INSERT INTO public.interview_requests (
    company_candidate_id,
    company_id,
    candidate_id,
    job_id,
    interview_type,
    planned_at,
    location_address,
    company_message,
    status
  ) VALUES (
    p_company_candidate_id,
    v_company_id,
    v_candidate_id,
    v_job_id,
    p_interview_type,
    p_planned_at,
    p_location_address,
    p_company_message,
    'pending'
  )
  RETURNING id INTO v_request_id;

  -- Update company_candidates status to INTERVIEW_GEPLANT
  UPDATE public.company_candidates
  SET 
    status = 'INTERVIEW_GEPLANT'::candidate_status,
    interview_date = p_planned_at,
    updated_at = now()
  WHERE id = p_company_candidate_id;

  -- Create notification for candidate using create_notification function
  PERFORM create_notification(
    p_recipient_type := 'profile'::notif_recipient,
    p_recipient_id := v_candidate_id,
    p_type := 'interview_request_received'::notif_type,
    p_title := 'Interview-Anfrage erhalten',
    p_body := COALESCE(v_company_name, 'Ein Unternehmen') || 
              CASE 
                WHEN v_job_title IS NOT NULL THEN ' möchte dich für "' || v_job_title || '" kennenlernen.'
                ELSE ' möchte dich kennenlernen.'
              END,
    p_actor_type := 'company'::notif_recipient,
    p_actor_id := v_company_id,
    p_payload := jsonb_build_object(
      'interview_request_id', v_request_id,
      'company_candidate_id', p_company_candidate_id,
      'company_id', v_company_id,
      'job_id', v_job_id,
      'job_title', v_job_title,
      'interview_type', p_interview_type,
      'planned_at', p_planned_at,
      'location_address', p_location_address
    ),
    p_group_key := 'interview_req_' || v_candidate_id::text || '_' || v_company_id::text,
    p_priority := 9,
    p_channels := ARRAY['in_app'::notif_channel, 'email'::notif_channel]
  );

  RETURN v_request_id;
END;
$$;

-- 7. Function to accept interview request and generate meeting link
CREATE OR REPLACE FUNCTION public.accept_interview_request(
  p_request_id UUID,
  p_candidate_response TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_company_name TEXT;
  v_job_title TEXT;
  v_meeting_link TEXT;
  v_company_email TEXT;
BEGIN
  -- Get request details
  SELECT 
    ir.*,
    c.name AS company_name,
    jp.title AS job_title
  INTO v_request
  FROM public.interview_requests ir
  LEFT JOIN public.companies c ON c.id = ir.company_id
  LEFT JOIN public.job_posts jp ON jp.id = ir.job_id
  WHERE ir.id = p_request_id AND ir.candidate_id = auth.uid();

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Interview request not found or unauthorized';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Interview request is not pending';
  END IF;

  -- Generate meeting link for online interviews
  IF v_request.interview_type = 'online' THEN
    -- Generate Google Meet link (can be replaced with Zoom/Teams API later)
    v_meeting_link := 'https://meet.google.com/new?hs=122&authuser=0';
    -- TODO: Integrate with Google Calendar API or Zoom API to create actual meeting
  END IF;

  -- Update interview request
  UPDATE public.interview_requests
  SET 
    status = 'accepted',
    meeting_link = v_meeting_link,
    candidate_response = p_candidate_response,
    accepted_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  -- Update company_candidates status to INTERVIEW_GEPLANT
  UPDATE public.company_candidates
  SET 
    status = 'INTERVIEW_GEPLANT'::candidate_status,
    interview_date = v_request.planned_at,
    updated_at = now()
  WHERE id = v_request.company_candidate_id;

  -- Create notification for company users
  INSERT INTO public.notifications (
    recipient_id,
    type,
    title,
    body,
    payload
  )
  SELECT 
    cu.user_id,
    'interview_request_accepted'::notif_type,
    'Interview-Anfrage angenommen',
    'Der Kandidat hat deine Interview-Anfrage angenommen.',
    jsonb_build_object(
      'interview_request_id', p_request_id,
      'company_candidate_id', v_request.company_candidate_id,
      'candidate_id', v_request.candidate_id,
      'planned_at', v_request.planned_at,
      'meeting_link', v_meeting_link
    )
  FROM public.company_users cu
  WHERE cu.company_id = v_request.company_id
    AND cu.accepted_at IS NOT NULL
  ON CONFLICT DO NOTHING;

  RETURN p_request_id;
END;
$$;

-- 8. Function to decline interview request
CREATE OR REPLACE FUNCTION public.decline_interview_request(
  p_request_id UUID,
  p_candidate_response TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Get request details
  SELECT * INTO v_request
  FROM public.interview_requests
  WHERE id = p_request_id AND candidate_id = auth.uid();

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Interview request not found or unauthorized';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Interview request is not pending';
  END IF;

  -- Update interview request
  UPDATE public.interview_requests
  SET 
    status = 'declined',
    candidate_response = p_candidate_response,
    declined_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  -- Create notification for company users
  INSERT INTO public.notifications (
    recipient_id,
    type,
    title,
    body,
    payload
  )
  SELECT 
    cu.user_id,
    'interview_request_declined'::notif_type,
    'Interview-Anfrage abgelehnt',
    'Der Kandidat hat deine Interview-Anfrage abgelehnt.',
    jsonb_build_object(
      'interview_request_id', p_request_id,
      'company_candidate_id', v_request.company_candidate_id,
      'candidate_id', v_request.candidate_id
    )
  FROM public.company_users cu
  WHERE cu.company_id = v_request.company_id
    AND cu.accepted_at IS NOT NULL
  ON CONFLICT DO NOTHING;

  RETURN p_request_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_interview_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_interview_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_interview_request TO authenticated;

