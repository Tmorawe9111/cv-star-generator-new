-- Direkte SQL-Anweisung zum Erstellen der create_interview_request Funktion
-- Führe dies direkt im Supabase SQL Editor aus

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

  -- Create notification for candidate (simplified - try create_notification first)
  BEGIN
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
  EXCEPTION
    WHEN OTHERS THEN
      -- Fallback: Skip notification if create_notification doesn't work
      NULL;
  END;

  RETURN v_request_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_interview_request(UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;

