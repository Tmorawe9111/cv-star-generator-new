-- Interview Requests System Migration
-- This migration creates the interview_requests table and related functionality

-- 1. Add new notification type for interview requests
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'interview_request_received';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'interview_request_accepted';
ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'interview_request_declined';

-- 2. Create interview_requests table
CREATE TABLE IF NOT EXISTS public.interview_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_candidate_id UUID NOT NULL REFERENCES public.company_candidates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.job_posts(id) ON DELETE SET NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('vor_ort', 'online')),
  planned_at TIMESTAMPTZ NOT NULL,
  meeting_link TEXT, -- Will be set after candidate accepts
  location_address TEXT, -- For vor_ort interviews
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  company_message TEXT, -- Optional message from company
  candidate_response TEXT, -- Optional response from candidate
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_requests_company_candidate_id ON public.interview_requests(company_candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_candidate_id ON public.interview_requests(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_company_id ON public.interview_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_status ON public.interview_requests(status);
CREATE INDEX IF NOT EXISTS idx_interview_requests_planned_at ON public.interview_requests(planned_at);

-- 4. Enable RLS
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Companies can view their own interview requests
CREATE POLICY "Companies can view their interview requests"
  ON public.interview_requests FOR SELECT
  USING (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
    )
  );

-- Candidates can view their own interview requests
CREATE POLICY "Candidates can view their interview requests"
  ON public.interview_requests FOR SELECT
  USING (candidate_id = auth.uid());

-- Companies can create interview requests
CREATE POLICY "Companies can create interview requests"
  ON public.interview_requests FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
    )
  );

-- Companies can update their interview requests (e.g., cancel)
CREATE POLICY "Companies can update their interview requests"
  ON public.interview_requests FOR UPDATE
  USING (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
    )
  );

-- Candidates can update interview requests to accept/decline
CREATE POLICY "Candidates can respond to interview requests"
  ON public.interview_requests FOR UPDATE
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

-- 6. Function to create interview request and send notification
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

  -- Create notification for candidate
  PERFORM create_notification(
    p_recipient_type := 'profile',
    p_recipient_id := v_candidate_id,
    p_type := 'interview_request_received',
    p_title := 'Interview-Anfrage erhalten',
    p_body := COALESCE(v_company_name, 'Ein Unternehmen') || 
              CASE 
                WHEN v_job_title IS NOT NULL THEN ' möchte dich für "' || v_job_title || '" kennenlernen.'
                ELSE ' möchte dich kennenlernen.'
              END,
    p_actor_type := 'company',
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
    -- Format: https://meet.google.com/xxx-xxxx-xxx
    -- For now, we'll use a placeholder that can be replaced with actual API integration
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
    stage = 'interview_planned',
    interview_date = v_request.planned_at,
    updated_at = now()
  WHERE id = v_request.company_candidate_id;

  -- Create notification for company
  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := v_request.company_id,
    p_type := 'interview_request_accepted',
    p_title := 'Interview-Anfrage angenommen',
    p_body := 'Der Kandidat hat deine Interview-Anfrage angenommen.',
    p_actor_type := 'profile',
    p_actor_id := v_request.candidate_id,
    p_payload := jsonb_build_object(
      'interview_request_id', p_request_id,
      'company_candidate_id', v_request.company_candidate_id,
      'candidate_id', v_request.candidate_id,
      'planned_at', v_request.planned_at,
      'meeting_link', v_meeting_link
    ),
    p_group_key := 'interview_acc_' || v_request.company_id::text || '_' || v_request.candidate_id::text,
    p_priority := 8,
    p_channels := ARRAY['in_app'::notif_channel, 'email'::notif_channel]
  );

  -- TODO: Send email to candidate with meeting link
  -- This will be handled by an Edge Function or email service

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

  -- Create notification for company
  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := v_request.company_id,
    p_type := 'interview_request_declined',
    p_title := 'Interview-Anfrage abgelehnt',
    p_body := 'Der Kandidat hat deine Interview-Anfrage abgelehnt.',
    p_actor_type := 'profile',
    p_actor_id := v_request.candidate_id,
    p_payload := jsonb_build_object(
      'interview_request_id', p_request_id,
      'company_candidate_id', v_request.company_candidate_id,
      'candidate_id', v_request.candidate_id
    ),
    p_group_key := 'interview_dec_' || v_request.company_id::text || '_' || v_request.candidate_id::text,
    p_priority := 5,
    p_channels := ARRAY['in_app'::notif_channel]
  );

  RETURN p_request_id;
END;
$$;

-- 9. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.interview_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_interview_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_interview_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_interview_request TO authenticated;

