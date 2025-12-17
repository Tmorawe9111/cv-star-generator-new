-- Phase 1: Calendar Integration Infrastructure
-- This migration adds support for:
-- 1. Multiple time slots (3 instead of 1)
-- 2. Calendar provider integrations
-- 3. Time slot proposals (counter-offers)

-- 1. Create company_calendar_integrations table
CREATE TABLE IF NOT EXISTS public.company_calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'outlook', 'teams', 'calendly', 'zoom')),
  access_token text NOT NULL, -- Will be encrypted in production
  refresh_token text, -- Will be encrypted in production
  expires_at timestamptz,
  calendar_id text, -- Provider-specific calendar ID
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb, -- Provider-specific settings
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_calendar_integrations_company_id 
  ON public.company_calendar_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_calendar_integrations_provider 
  ON public.company_calendar_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_company_calendar_integrations_active 
  ON public.company_calendar_integrations(company_id, is_active) 
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.company_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_calendar_integrations
CREATE POLICY "Company users can view their calendar integrations"
  ON public.company_calendar_integrations FOR SELECT
  USING (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage calendar integrations"
  ON public.company_calendar_integrations FOR ALL
  USING (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu 
      WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu 
      WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
    )
  );

-- 2. Ensure interview_requests table exists and extend it for multiple time slots
DO $$ 
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_requests') THEN
    CREATE TABLE public.interview_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_candidate_id UUID NOT NULL REFERENCES public.company_candidates(id) ON DELETE CASCADE,
      company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      job_id UUID REFERENCES public.job_posts(id) ON DELETE SET NULL,
      interview_type TEXT NOT NULL CHECK (interview_type IN ('vor_ort', 'online')),
      planned_at TIMESTAMPTZ NOT NULL,
      meeting_link TEXT,
      location_address TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
      company_message TEXT,
      candidate_response TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      accepted_at TIMESTAMPTZ,
      declined_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_interview_requests_company_candidate_id ON public.interview_requests(company_candidate_id);
    CREATE INDEX IF NOT EXISTS idx_interview_requests_candidate_id ON public.interview_requests(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_interview_requests_company_id ON public.interview_requests(company_id);
    CREATE INDEX IF NOT EXISTS idx_interview_requests_status ON public.interview_requests(status);
    CREATE INDEX IF NOT EXISTS idx_interview_requests_planned_at ON public.interview_requests(planned_at);
    
    -- Enable RLS
    ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS Policies (if table was just created)
    -- Check if policies exist before creating (no nested DO blocks allowed)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'interview_requests' 
      AND policyname = 'Companies can view their interview requests'
    ) THEN
      CREATE POLICY "Companies can view their interview requests"
        ON public.interview_requests FOR SELECT
        USING (
          company_id IN (
            SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'interview_requests' 
      AND policyname = 'Candidates can view their interview requests'
    ) THEN
      CREATE POLICY "Candidates can view their interview requests"
        ON public.interview_requests FOR SELECT
        USING (candidate_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'interview_requests' 
      AND policyname = 'Companies can create interview requests'
    ) THEN
      CREATE POLICY "Companies can create interview requests"
        ON public.interview_requests FOR INSERT
        WITH CHECK (
          company_id IN (
            SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'interview_requests' 
      AND policyname = 'Companies can update their interview requests'
    ) THEN
      CREATE POLICY "Companies can update their interview requests"
        ON public.interview_requests FOR UPDATE
        USING (
          company_id IN (
            SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'interview_requests' 
      AND policyname = 'Candidates can respond to interview requests'
    ) THEN
      CREATE POLICY "Candidates can respond to interview requests"
        ON public.interview_requests FOR UPDATE
        USING (candidate_id = auth.uid())
        WITH CHECK (candidate_id = auth.uid());
    END IF;
  END IF;
  
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'interview_requests' AND column_name = 'time_slots') THEN
    ALTER TABLE public.interview_requests ADD COLUMN time_slots jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'interview_requests' AND column_name = 'selected_slot_index') THEN
    ALTER TABLE public.interview_requests ADD COLUMN selected_slot_index integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'interview_requests' AND column_name = 'video_link') THEN
    ALTER TABLE public.interview_requests ADD COLUMN video_link text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'interview_requests' AND column_name = 'calendar_event_id') THEN
    ALTER TABLE public.interview_requests ADD COLUMN calendar_event_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'interview_requests' AND column_name = 'calendar_provider') THEN
    ALTER TABLE public.interview_requests ADD COLUMN calendar_provider text;
  END IF;
  
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'interview_requests' 
    AND constraint_name = 'interview_requests_calendar_provider_check'
  ) THEN
    ALTER TABLE public.interview_requests 
      ADD CONSTRAINT interview_requests_calendar_provider_check 
      CHECK (calendar_provider IS NULL OR calendar_provider IN ('google', 'outlook', 'teams', 'calendly', 'zoom', 'manual'));
  END IF;
END $$;

-- Index for time_slots queries (after column is added)
CREATE INDEX IF NOT EXISTS idx_interview_requests_time_slots 
  ON public.interview_requests USING gin(time_slots);

-- 3. Create interview_time_slot_proposals table for counter-offers
CREATE TABLE IF NOT EXISTS public.interview_time_slot_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_request_id uuid NOT NULL REFERENCES public.interview_requests(id) ON DELETE CASCADE,
  proposed_at timestamptz NOT NULL,
  candidate_message text,
  status text CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interview_proposals_request_id 
  ON public.interview_time_slot_proposals(interview_request_id);
CREATE INDEX IF NOT EXISTS idx_interview_proposals_status 
  ON public.interview_time_slot_proposals(status);

-- Enable RLS
ALTER TABLE public.interview_time_slot_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_time_slot_proposals
CREATE POLICY "Candidates can view their proposals"
  ON public.interview_time_slot_proposals FOR SELECT
  USING (
    interview_request_id IN (
      SELECT ir.id FROM public.interview_requests ir WHERE ir.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Companies can view proposals for their requests"
  ON public.interview_time_slot_proposals FOR SELECT
  USING (
    interview_request_id IN (
      SELECT ir.id FROM public.interview_requests ir
      JOIN public.company_users cu ON cu.company_id = ir.company_id
      WHERE cu.user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can create proposals"
  ON public.interview_time_slot_proposals FOR INSERT
  WITH CHECK (
    interview_request_id IN (
      SELECT ir.id FROM public.interview_requests ir WHERE ir.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Companies can update proposals"
  ON public.interview_time_slot_proposals FOR UPDATE
  USING (
    interview_request_id IN (
      SELECT ir.id FROM public.interview_requests ir
      JOIN public.company_users cu ON cu.company_id = ir.company_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- 4. Update create_interview_request function to support multiple time slots
CREATE OR REPLACE FUNCTION public.create_interview_request(
  p_company_candidate_id uuid,
  p_interview_type text,
  p_planned_at timestamptz DEFAULT NULL, -- Deprecated, use time_slots instead
  p_time_slots jsonb DEFAULT NULL, -- Array of {start, end} objects
  p_location_address text DEFAULT NULL,
  p_company_message text DEFAULT NULL,
  p_video_link text DEFAULT NULL,
  p_calendar_provider text DEFAULT 'manual'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_company_id uuid;
  v_candidate_id uuid;
  v_job_id uuid;
  v_company_name text;
  v_job_title text;
  v_candidate_name text;
  v_time_slots jsonb;
  v_first_slot timestamptz;
  v_time_slots_parsed jsonb;
BEGIN
  -- Get company_candidate details
  SELECT 
    cc.company_id,
    cc.candidate_id,
    (cc.linked_job_ids->>0)::uuid
  INTO v_company_id, v_candidate_id, v_job_id
  FROM public.company_candidates cc
  WHERE cc.id = p_company_candidate_id;

  IF v_company_id IS NULL OR v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'Company candidate not found';
  END IF;

  -- Validate time slots
  IF p_time_slots IS NOT NULL THEN
    -- Parse jsonb if it's a string (handles both jsonb and text input)
    IF pg_typeof(p_time_slots) = 'text'::regtype THEN
      v_time_slots_parsed := p_time_slots::jsonb;
    ELSE
      v_time_slots_parsed := p_time_slots;
    END IF;
    
    -- Validate that we have 1-3 time slots
    IF jsonb_array_length(v_time_slots_parsed) < 1 OR jsonb_array_length(v_time_slots_parsed) > 3 THEN
      RAISE EXCEPTION 'Must provide 1-3 time slots';
    END IF;
    
    -- Format time slots with status
    v_time_slots := (
      SELECT jsonb_agg(
        jsonb_build_object(
          'start', slot->>'start',
          'end', slot->>'end',
          'status', 'pending',
          'index', idx - 1
        )
      )
      FROM jsonb_array_elements(v_time_slots_parsed) WITH ORDINALITY AS t(slot, idx)
    );
    
    -- Get first slot for planned_at (backward compatibility)
    BEGIN
      v_first_slot := (v_time_slots_parsed->0->>'start')::timestamptz;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid date format in first time slot: %', (v_time_slots_parsed->0->>'start');
    END;
  ELSIF p_planned_at IS NOT NULL THEN
    -- Legacy: single time slot
    v_first_slot := p_planned_at;
    v_time_slots := jsonb_build_array(
      jsonb_build_object(
        'start', p_planned_at::text,
        'end', (p_planned_at + interval '1 hour')::text,
        'status', 'pending',
        'index', 0
      )
    );
  ELSE
    RAISE EXCEPTION 'Must provide either time_slots or planned_at';
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
  INTO v_candidate_name, v_candidate_name
  FROM public.profiles
  WHERE id = v_candidate_id;

  -- Create interview request
  INSERT INTO public.interview_requests (
    company_candidate_id,
    company_id,
    candidate_id,
    job_id,
    interview_type,
    planned_at, -- Keep for backward compatibility
    time_slots,
    location_address,
    company_message,
    video_link,
    calendar_provider,
    status
  ) VALUES (
    p_company_candidate_id,
    v_company_id,
    v_candidate_id,
    v_job_id,
    p_interview_type,
    v_first_slot,
    v_time_slots,
    p_location_address,
    p_company_message,
    p_video_link,
    p_calendar_provider,
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
      'time_slots', v_time_slots,
      'location_address', p_location_address,
      'has_multiple_slots', jsonb_array_length(v_time_slots) > 1
    ),
    p_group_key := 'interview_req_' || v_candidate_id::text || '_' || v_company_id::text,
    p_priority := 9,
    p_channels := ARRAY['in_app'::notif_channel, 'email'::notif_channel]
  );

  RETURN v_request_id;
END;
$$;

-- 5. Update accept_interview_request to handle selected slot
CREATE OR REPLACE FUNCTION public.accept_interview_request(
  p_request_id uuid,
  p_selected_slot_index integer DEFAULT 0, -- Which slot was selected (0-2)
  p_candidate_response text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_company_name text;
  v_job_title text;
  v_meeting_link text;
  v_time_slots jsonb;
  v_selected_slot jsonb;
  v_planned_at timestamptz;
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

  -- Get selected time slot
  v_time_slots := v_request.time_slots;
  IF v_time_slots IS NULL OR jsonb_array_length(v_time_slots) = 0 THEN
    RAISE EXCEPTION 'No time slots available';
  END IF;

  -- Validate slot index
  IF p_selected_slot_index < 0 OR p_selected_slot_index >= jsonb_array_length(v_time_slots) THEN
    RAISE EXCEPTION 'Invalid slot index';
  END IF;

  -- Get selected slot
  v_selected_slot := v_time_slots->p_selected_slot_index;
  v_planned_at := (v_selected_slot->>'start')::timestamptz;

  -- Update all slots: mark selected as accepted, others as declined
  v_time_slots := (
    SELECT jsonb_agg(
      CASE 
        WHEN idx = p_selected_slot_index THEN 
          slot || jsonb_build_object('status', 'accepted')
        ELSE 
          slot || jsonb_build_object('status', 'declined')
      END
    )
    FROM jsonb_array_elements(v_time_slots) WITH ORDINALITY AS t(slot, idx)
  );

  -- Generate meeting link for online interviews
  IF v_request.interview_type = 'online' AND v_request.video_link IS NULL THEN
    -- Generate Google Meet link (can be replaced with actual API integration later)
    v_meeting_link := 'https://meet.google.com/new?hs=122&authuser=0';
  ELSE
    v_meeting_link := v_request.video_link;
  END IF;

  -- Update interview request
  UPDATE public.interview_requests
  SET 
    status = 'accepted',
    planned_at = v_planned_at, -- Update to selected slot
    time_slots = v_time_slots,
    selected_slot_index = p_selected_slot_index,
    meeting_link = COALESCE(v_meeting_link, meeting_link),
    candidate_response = p_candidate_response,
    accepted_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  -- Update company_candidates status to INTERVIEW_GEPLANT
  UPDATE public.company_candidates
  SET 
    status = 'INTERVIEW_GEPLANT'::candidate_status,
    stage = 'interview_planned',
    interview_date = v_planned_at,
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
      'planned_at', v_planned_at,
      'selected_slot_index', p_selected_slot_index,
      'meeting_link', v_meeting_link
    ),
    p_group_key := 'interview_acc_' || v_request.company_id::text || '_' || v_request.candidate_id::text,
    p_priority := 8,
    p_channels := ARRAY['in_app'::notif_channel, 'email'::notif_channel]
  );

  RETURN p_request_id;
END;
$$;

-- 6. Function to create time slot proposal (counter-offer)
CREATE OR REPLACE FUNCTION public.create_time_slot_proposal(
  p_interview_request_id uuid,
  p_proposed_at timestamptz,
  p_candidate_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal_id uuid;
  v_request RECORD;
  v_company_name text;
BEGIN
  -- Get request details
  SELECT ir.*, c.name AS company_name
  INTO v_request
  FROM public.interview_requests ir
  LEFT JOIN public.companies c ON c.id = ir.company_id
  WHERE ir.id = p_interview_request_id AND ir.candidate_id = auth.uid();

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Interview request not found or unauthorized';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Can only propose alternative time for pending requests';
  END IF;

  -- Create proposal
  INSERT INTO public.interview_time_slot_proposals (
    interview_request_id,
    proposed_at,
    candidate_message,
    status
  ) VALUES (
    p_interview_request_id,
    p_proposed_at,
    p_candidate_message,
    'pending'
  )
  RETURNING id INTO v_proposal_id;

  -- Create notification for company
  PERFORM create_notification(
    p_recipient_type := 'company',
    p_recipient_id := v_request.company_id,
    p_type := 'interview_request_received', -- Reuse type
    p_title := 'Alternativer Terminvorschlag',
    p_body := 'Der Kandidat hat einen alternativen Termin vorgeschlagen.',
    p_actor_type := 'profile',
    p_actor_id := v_request.candidate_id,
    p_payload := jsonb_build_object(
      'interview_request_id', p_interview_request_id,
      'proposal_id', v_proposal_id,
      'proposed_at', p_proposed_at,
      'candidate_message', p_candidate_message
    ),
    p_group_key := 'interview_prop_' || v_request.company_id::text || '_' || v_request.candidate_id::text,
    p_priority := 8,
    p_channels := ARRAY['in_app'::notif_channel, 'email'::notif_channel]
  );

  RETURN v_proposal_id;
END;
$$;

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.company_calendar_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.interview_time_slot_proposals TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_time_slot_proposal TO authenticated;

-- 8. Add comment for documentation
COMMENT ON TABLE public.company_calendar_integrations IS 'Stores OAuth tokens and settings for calendar integrations (Google, Outlook, Teams, etc.)';
COMMENT ON COLUMN public.interview_requests.time_slots IS 'Array of time slots: [{"start": "2024-01-01T10:00:00Z", "end": "2024-01-01T11:00:00Z", "status": "pending", "index": 0}, ...]';
COMMENT ON COLUMN public.interview_requests.selected_slot_index IS 'Index of the time slot that was selected by the candidate (0-2)';

