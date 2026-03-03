-- Komplette Erstellung des Interview-Systems
-- Führe dies direkt im Supabase SQL Editor aus

-- 1. Erstelle die interview_requests Tabelle falls sie nicht existiert
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

-- 2. Erstelle Indexe für Performance
CREATE INDEX IF NOT EXISTS idx_interview_requests_company_candidate_id 
  ON public.interview_requests(company_candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_company_id 
  ON public.interview_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_candidate_id 
  ON public.interview_requests(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_status 
  ON public.interview_requests(status);
CREATE INDEX IF NOT EXISTS idx_interview_requests_planned_at 
  ON public.interview_requests(planned_at);

-- 3. Erstelle Trigger für updated_at
CREATE OR REPLACE FUNCTION public.update_interview_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_interview_requests_updated_at ON public.interview_requests;
CREATE TRIGGER trigger_update_interview_requests_updated_at
  BEFORE UPDATE ON public.interview_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_interview_requests_updated_at();

-- 4. Füge Notification Types hinzu falls sie noch nicht existieren
DO $$ 
BEGIN
  -- Versuche die Werte hinzuzufügen, ignoriere Fehler falls sie bereits existieren
  BEGIN
    ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'interview_request_received';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'interview_request_accepted';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TYPE notif_type ADD VALUE IF NOT EXISTS 'interview_request_declined';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 5. Erstelle die create_interview_request Funktion
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

-- 6. Erstelle die accept_interview_request Funktion
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
  BEGIN
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
  EXCEPTION
    WHEN OTHERS THEN
      -- Fallback: Skip notification if insert fails
      NULL;
  END;

  RETURN p_request_id;
END;
$$;

-- 7. Erstelle die decline_interview_request Funktion
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
  BEGIN
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
  EXCEPTION
    WHEN OTHERS THEN
      -- Fallback: Skip notification if insert fails
      NULL;
  END;

  RETURN p_request_id;
END;
$$;

-- 8. Aktiviere RLS für interview_requests
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;

-- 9. Erstelle RLS Policies
-- Companies can see their own interview requests
DROP POLICY IF EXISTS "Companies can view their interview requests" ON public.interview_requests;
CREATE POLICY "Companies can view their interview requests" ON public.interview_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = interview_requests.company_id
        AND cu.user_id = auth.uid()
        AND cu.accepted_at IS NOT NULL
    )
  );

-- Candidates can see their own interview requests
DROP POLICY IF EXISTS "Candidates can view their interview requests" ON public.interview_requests;
CREATE POLICY "Candidates can view their interview requests" ON public.interview_requests
  FOR SELECT
  USING (candidate_id = auth.uid());

-- Companies can create interview requests (via function)
DROP POLICY IF EXISTS "Companies can create interview requests" ON public.interview_requests;
CREATE POLICY "Companies can create interview requests" ON public.interview_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = interview_requests.company_id
        AND cu.user_id = auth.uid()
        AND cu.accepted_at IS NOT NULL
    )
  );

-- Companies can update their interview requests
DROP POLICY IF EXISTS "Companies can update their interview requests" ON public.interview_requests;
CREATE POLICY "Companies can update their interview requests" ON public.interview_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = interview_requests.company_id
        AND cu.user_id = auth.uid()
        AND cu.accepted_at IS NOT NULL
    )
  );

-- Candidates can update their own interview requests (to accept/decline)
DROP POLICY IF EXISTS "Candidates can update their interview requests" ON public.interview_requests;
CREATE POLICY "Candidates can update their interview requests" ON public.interview_requests
  FOR UPDATE
  USING (candidate_id = auth.uid());

-- 10. Gewähre Berechtigungen
GRANT SELECT, INSERT, UPDATE ON public.interview_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_interview_request(UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_interview_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_interview_request(UUID, TEXT) TO authenticated;


