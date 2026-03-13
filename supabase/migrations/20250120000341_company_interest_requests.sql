-- Migration: Company Interest Requests System
-- Purpose: Allow companies to express interest in candidates who work for them
-- Flow: Company expresses interest → Candidate confirms → 3 Tokens charged → Profile unlocked

-- ============================================
-- 1. Table: company_interest_requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.company_interest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token_cost int NOT NULL DEFAULT 3, -- Fixed cost: 3 tokens
  tokens_charged boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '30 days'), -- Request expires after 30 days
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, candidate_id) -- One active request per company-candidate pair
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_interest_requests_company_id ON public.company_interest_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_company_interest_requests_candidate_id ON public.company_interest_requests(candidate_id);
CREATE INDEX IF NOT EXISTS idx_company_interest_requests_status ON public.company_interest_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_interest_requests_expires_at ON public.company_interest_requests(expires_at);

-- RLS Policies
ALTER TABLE public.company_interest_requests ENABLE ROW LEVEL SECURITY;

-- Company users can view their own interest requests
CREATE POLICY "Company users can view own interest requests"
  ON public.company_interest_requests FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

-- Candidates can view interest requests for their profile
CREATE POLICY "Candidates can view own interest requests"
  ON public.company_interest_requests FOR SELECT
  USING (candidate_id = auth.uid()); -- profiles.id = auth.users.id

-- Company users can create interest requests
CREATE POLICY "Company users can create interest requests"
  ON public.company_interest_requests FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
    AND created_by = auth.uid()
  );

-- Candidates can update status (accept/reject)
CREATE POLICY "Candidates can update own interest requests"
  ON public.company_interest_requests FOR UPDATE
  USING (candidate_id = auth.uid()) -- profiles.id = auth.users.id
  WITH CHECK (candidate_id = auth.uid()); -- profiles.id = auth.users.id

-- ============================================
-- 2. Function: Check if candidate works for company
-- ============================================
CREATE OR REPLACE FUNCTION public.check_candidate_works_for_company(
  p_candidate_id uuid,
  p_company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if candidate has an active employment relationship with the company
  -- This could be via company_employment_requests with status 'accepted'
  -- or via other indicators (e.g., linked_job_ids in applications)
  SELECT EXISTS (
    SELECT 1
    FROM public.company_employment_requests cer
    WHERE cer.user_id = p_candidate_id
      AND cer.company_id = p_company_id
      AND cer.status = 'accepted'
  )
  OR EXISTS (
    SELECT 1
    FROM public.applications a
    INNER JOIN public.job_posts jp ON a.job_id = jp.id
    WHERE a.candidate_id = p_candidate_id
      AND jp.company_id = p_company_id
      AND a.status IN ('hired', 'offer') -- Using application_status enum values
  );
$$;

-- ============================================
-- 3. Function: Create interest request
-- ============================================
CREATE OR REPLACE FUNCTION public.create_company_interest_request(
  p_company_id uuid,
  p_candidate_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_works_for_company boolean;
  v_existing_request uuid;
BEGIN
  -- Check if candidate works for company
  SELECT public.check_candidate_works_for_company(p_candidate_id, p_company_id) INTO v_works_for_company;
  
  IF NOT v_works_for_company THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'candidate_not_employee',
      'message', 'Kandidat arbeitet nicht für dieses Unternehmen'
    );
  END IF;

  -- Check for existing pending request
  SELECT id INTO v_existing_request
  FROM public.company_interest_requests
  WHERE company_id = p_company_id
    AND candidate_id = p_candidate_id
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now());

  IF v_existing_request IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'request_exists',
      'message', 'Es existiert bereits eine ausstehende Interesse-Anfrage',
      'request_id', v_existing_request
    );
  END IF;

  -- Create new request
  INSERT INTO public.company_interest_requests (
    company_id,
    candidate_id,
    created_by,
    status,
    token_cost
  )
  VALUES (
    p_company_id,
    p_candidate_id,
    auth.uid(),
    'pending',
    3
  )
  RETURNING id INTO v_request_id;

  -- Create notification for candidate
  -- Note: profiles.id = auth.users.id, so we use p.id directly
  INSERT INTO public.notifications (
    recipient_type,
    recipient_id,
    type,
    title,
    body,
    actor_type,
    actor_id,
    payload
  )
  SELECT 
    'profile'::public.notif_recipient,
    p.id, -- profiles.id is the same as auth.users.id
    'company_interest_request'::public.notif_type,
    'Neue Interesse-Anfrage',
    'Ein Unternehmen möchte mehr über Sie erfahren. Nach Bestätigung werden 3 Tokens abgebucht und Ihr Profil wird freigeschaltet.',
    'company'::public.notif_recipient,
    p_company_id,
    jsonb_build_object(
      'request_id', v_request_id,
      'company_id', p_company_id,
      'token_cost', 3
    )
  FROM public.profiles p
  WHERE p.id = p_candidate_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'message', 'Interesse-Anfrage wurde gesendet'
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'duplicate_request',
      'message', 'Es existiert bereits eine Anfrage für diesen Kandidaten'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Fehler beim Erstellen der Anfrage'
    );
END;
$$;

-- ============================================
-- 4. Function: Confirm interest request (with token charge)
-- ============================================
CREATE OR REPLACE FUNCTION public.confirm_company_interest_request(
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.company_interest_requests%ROWTYPE;
  v_company_token_balance int;
  v_company_active_tokens int;
  v_already_unlocked boolean;
  v_result jsonb;
BEGIN
  -- Fetch request
  SELECT * INTO v_request
  FROM public.company_interest_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'request_not_found',
      'message', 'Anfrage nicht gefunden'
    );
  END IF;

  -- Check if request is still pending
  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'request_not_pending',
      'message', 'Anfrage wurde bereits bearbeitet'
    );
  END IF;

  -- Check if request expired
  IF v_request.expires_at IS NOT NULL AND v_request.expires_at < now() THEN
    UPDATE public.company_interest_requests
    SET status = 'expired', updated_at = now()
    WHERE id = p_request_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'request_expired',
      'message', 'Anfrage ist abgelaufen'
    );
  END IF;

  -- Check if candidate already unlocked
  SELECT EXISTS (
    SELECT 1 FROM public.company_candidates
    WHERE company_id = v_request.company_id
      AND candidate_id = v_request.candidate_id
      AND unlocked_at IS NOT NULL
  ) INTO v_already_unlocked;

  -- Check token balance
  SELECT token_balance, active_tokens
  INTO v_company_token_balance, v_company_active_tokens
  FROM public.companies
  WHERE id = v_request.company_id
  FOR UPDATE; -- Lock row for update

  IF v_company_token_balance IS NULL OR v_company_token_balance < v_request.token_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_tokens',
      'message', 'Unternehmen hat nicht genügend Tokens'
    );
  END IF;

  -- Charge tokens (only if not already unlocked)
  IF NOT v_already_unlocked THEN
    UPDATE public.companies
    SET 
      token_balance = token_balance - v_request.token_cost,
      active_tokens = COALESCE(active_tokens, 0) - v_request.token_cost,
      updated_at = now()
    WHERE id = v_request.company_id;

    -- Record token usage
    INSERT INTO public.tokens_used (
      company_id,
      tokens_used,
      reason,
      metadata
    )
    VALUES (
      v_request.company_id,
      v_request.token_cost,
      'interest_request_confirmed',
      jsonb_build_object(
        'request_id', p_request_id,
        'candidate_id', v_request.candidate_id
      )
    );
  END IF;

  -- Update request status
  UPDATE public.company_interest_requests
  SET 
    status = 'accepted',
    tokens_charged = NOT v_already_unlocked,
    confirmed_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  -- Create/update company_candidates entry
  INSERT INTO public.company_candidates (
    company_id,
    candidate_id,
    unlocked_at,
    unlock_type,
    source,
    stage
  )
  VALUES (
    v_request.company_id,
    v_request.candidate_id,
    now(),
    'interest_request',
    'interest_request',
    'freigeschaltet'
  )
  ON CONFLICT (company_id, candidate_id)
  DO UPDATE SET
    unlocked_at = COALESCE(company_candidates.unlocked_at, now()),
    unlock_type = COALESCE(company_candidates.unlock_type, 'interest_request'),
    source = COALESCE(company_candidates.source, 'interest_request'),
    stage = CASE 
      WHEN company_candidates.stage IS NULL THEN 'freigeschaltet'
      ELSE company_candidates.stage
    END,
    updated_at = now();

  -- Create notification for company (all company users will see it via RLS)
  INSERT INTO public.notifications (
    recipient_type,
    recipient_id,
    type,
    title,
    body,
    actor_type,
    actor_id,
    payload
  )
  VALUES (
    'company'::public.notif_recipient,
    v_request.company_id, -- Use company_id, not user_id
    'interest_request_accepted'::public.notif_type,
    'Interesse-Anfrage bestätigt',
    CASE 
      WHEN v_already_unlocked THEN 'Ein Kandidat hat Ihre Interesse-Anfrage bestätigt. Das Profil war bereits freigeschaltet, daher wurden keine Tokens abgebucht.'
      ELSE format('Ein Kandidat hat Ihre Interesse-Anfrage bestätigt. %s Tokens wurden abgebucht und das Profil wurde freigeschaltet.', v_request.token_cost)
    END,
    'profile'::public.notif_recipient,
    v_request.candidate_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'candidate_id', v_request.candidate_id,
      'tokens_charged', NOT v_already_unlocked,
      'tokens_spent', CASE WHEN v_already_unlocked THEN 0 ELSE v_request.token_cost END
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'tokens_charged', NOT v_already_unlocked,
    'tokens_spent', CASE WHEN v_already_unlocked THEN 0 ELSE v_request.token_cost END,
    'already_unlocked', v_already_unlocked,
    'message', CASE 
      WHEN v_already_unlocked THEN 'Profil war bereits freigeschaltet'
      ELSE 'Interesse-Anfrage wurde bestätigt und Tokens wurden abgebucht'
    END
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Fehler beim Bestätigen der Anfrage'
    );
END;
$$;

-- ============================================
-- 5. Function: Reject interest request
-- ============================================
CREATE OR REPLACE FUNCTION public.reject_company_interest_request(
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.company_interest_requests%ROWTYPE;
BEGIN
  -- Fetch request
  SELECT * INTO v_request
  FROM public.company_interest_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'request_not_found'
    );
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'request_not_pending'
    );
  END IF;

  -- Update request status
  UPDATE public.company_interest_requests
  SET 
    status = 'rejected',
    rejected_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  -- Create notification for company (all company users will see it via RLS)
  INSERT INTO public.notifications (
    recipient_type,
    recipient_id,
    type,
    title,
    body,
    actor_type,
    actor_id,
    payload
  )
  VALUES (
    'company'::public.notif_recipient,
    v_request.company_id, -- Use company_id, not user_id
    'interest_request_rejected'::public.notif_type,
    'Interesse-Anfrage abgelehnt',
    'Ein Kandidat hat Ihre Interesse-Anfrage abgelehnt.',
    'profile'::public.notif_recipient,
    v_request.candidate_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'candidate_id', v_request.candidate_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Anfrage wurde abgelehnt'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_candidate_works_for_company TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_company_interest_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_company_interest_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_company_interest_request TO authenticated;

-- ============================================
-- 6. Add notification types
-- ============================================
DO $$ 
BEGIN
  -- Add company_interest_request
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'company_interest_request' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notif_type')
  ) THEN
    ALTER TYPE notif_type ADD VALUE 'company_interest_request';
  END IF;

  -- Add interest_request_accepted
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'interest_request_accepted' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notif_type')
  ) THEN
    ALTER TYPE notif_type ADD VALUE 'interest_request_accepted';
  END IF;

  -- Add interest_request_rejected
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'interest_request_rejected' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notif_type')
  ) THEN
    ALTER TYPE notif_type ADD VALUE 'interest_request_rejected';
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.company_interest_requests IS 'Stores interest requests from companies to candidates who work for them. When confirmed, 3 tokens are charged and profile is unlocked.';
COMMENT ON COLUMN public.company_interest_requests.token_cost IS 'Fixed cost: 3 tokens when request is confirmed';
COMMENT ON COLUMN public.company_interest_requests.tokens_charged IS 'True if tokens were actually charged (false if profile was already unlocked)';

