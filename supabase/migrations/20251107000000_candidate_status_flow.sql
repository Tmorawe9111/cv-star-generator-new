-- Candidate status workflow migration

DO $$
BEGIN
  CREATE TYPE candidate_status AS ENUM (
    'FREIGESCHALTET',
    'INTERVIEW_GEPLANT',
    'INTERVIEW_DURCHGEFÜHRT',
    'ABGESAGT',
    'ANGEBOT_GESENDET',
    'EINGESTELLT',
    'ABGELEHNT',
    'ON_HOLD'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.candidate_status_rank (
  status candidate_status PRIMARY KEY,
  rank   integer NOT NULL
);

INSERT INTO public.candidate_status_rank (status, rank)
VALUES
  ('FREIGESCHALTET', 10),
  ('INTERVIEW_GEPLANT', 20),
  ('INTERVIEW_DURCHGEFÜHRT', 30),
  ('ABGESAGT', 30),
  ('ANGEBOT_GESENDET', 40),
  ('EINGESTELLT', 50),
  ('ABGELEHNT', 50),
  ('ON_HOLD', 999)
ON CONFLICT (status) DO NOTHING;

ALTER TABLE public.company_candidates
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS interview_date timestamptz,
  ADD COLUMN IF NOT EXISTS last_active_status candidate_status,
  ADD COLUMN IF NOT EXISTS status candidate_status;

-- migrate existing stage/text values into enum column
UPDATE public.company_candidates
SET status = CASE lower(stage)
  WHEN 'new' THEN 'FREIGESCHALTET'
  WHEN 'unlocked' THEN 'FREIGESCHALTET'
  WHEN 'contacted' THEN 'INTERVIEW_GEPLANT'
  WHEN 'interview' THEN 'INTERVIEW_GEPLANT'
  WHEN 'interview_planned' THEN 'INTERVIEW_GEPLANT'
  WHEN 'interview_done' THEN 'INTERVIEW_DURCHGEFÜHRT'
  WHEN 'interview_completed' THEN 'INTERVIEW_DURCHGEFÜHRT'
  WHEN 'offer' THEN 'ANGEBOT_GESENDET'
  WHEN 'hired' THEN 'EINGESTELLT'
  WHEN 'rejected' THEN 'ABGELEHNT'
  WHEN 'archived' THEN 'ABGELEHNT'
  WHEN 'on_hold' THEN 'ON_HOLD'
  ELSE COALESCE(status, 'FREIGESCHALTET')
END
WHERE status IS NULL;

ALTER TABLE public.company_candidates
  ALTER COLUMN status SET DEFAULT 'FREIGESCHALTET',
  ALTER COLUMN status SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.candidate_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_candidate_id uuid NOT NULL REFERENCES public.company_candidates(id) ON DELETE CASCADE,
  from_status candidate_status,
  to_status candidate_status NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_candidate_status_history_candidate_id
  ON public.candidate_status_history(company_candidate_id);

CREATE OR REPLACE FUNCTION public.validate_candidate_status_transition(
  prev candidate_status,
  nxt candidate_status,
  meta jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  r_prev integer;
  r_next integer;
BEGIN
  IF prev = nxt THEN
    RETURN;
  END IF;

  -- allow parked status to resume
  IF prev = 'ON_HOLD' AND nxt <> 'ON_HOLD' THEN
    RETURN;
  END IF;

  SELECT rank INTO r_prev FROM public.candidate_status_rank WHERE status = prev;
  SELECT rank INTO r_next FROM public.candidate_status_rank WHERE status = nxt;

  IF r_prev IS NULL OR r_next IS NULL THEN
    RAISE EXCEPTION 'Unbekannter Status (prev %, next %)', prev, nxt;
  END IF;

  IF nxt <> 'ON_HOLD' AND r_next < r_prev THEN
    RAISE EXCEPTION 'Zurückspringen in Status % ist nicht erlaubt.', nxt;
  END IF;

  IF nxt = 'INTERVIEW_DURCHGEFÜHRT' THEN
    IF COALESCE((meta ->> 'interview_date')::timestamptz, NULL) IS NULL THEN
      RAISE EXCEPTION 'Für INTERVIEW_DURCHGEFÜHRT wird ein interview_date benötigt.';
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_candidate_status(
  p_company_candidate_id uuid,
  p_next_status candidate_status,
  p_meta jsonb DEFAULT '{}'::jsonb,
  p_silent boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev candidate_status;
  v_company_id uuid;
  v_last_active candidate_status;
  v_user uuid := auth.uid();
  v_meta jsonb := COALESCE(p_meta, '{}'::jsonb);
  v_target candidate_status := p_next_status;
  v_interview_date timestamptz;
BEGIN
  SELECT status, company_id, last_active_status
  INTO v_prev, v_company_id, v_last_active
  FROM public.company_candidates
  WHERE id = p_company_candidate_id
  FOR UPDATE;

  IF v_prev IS NULL THEN
    RAISE EXCEPTION 'company_candidate % nicht gefunden', p_company_candidate_id;
  END IF;

  IF v_user IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.company_users cu
      WHERE cu.company_id = v_company_id
        AND cu.user_id = v_user
    ) THEN
      RAISE EXCEPTION 'Keine Berechtigung für diesen Kandidaten.';
    END IF;
  END IF;

  PERFORM public.validate_candidate_status_transition(v_prev, v_target, v_meta);

  IF v_target = 'ON_HOLD' THEN
    IF v_prev <> 'ON_HOLD' THEN
      UPDATE public.company_candidates
      SET last_active_status = v_prev,
          status = 'ON_HOLD',
          stage = lower('ON_HOLD'),
          updated_at = timezone('utc', now()),
          last_touched_at = timezone('utc', now())
      WHERE id = p_company_candidate_id;
    END IF;
  ELSIF v_prev = 'ON_HOLD' AND v_target <> 'ON_HOLD' THEN
    IF v_last_active IS NULL THEN
      v_last_active := 'FREIGESCHALTET';
    END IF;
    PERFORM public.validate_candidate_status_transition(v_last_active, v_target, v_meta);

    UPDATE public.company_candidates
    SET status = v_target,
        stage = lower(v_target::text),
        last_active_status = NULL,
        updated_at = timezone('utc', now()),
        last_touched_at = timezone('utc', now())
    WHERE id = p_company_candidate_id;
  ELSE
    IF v_target = 'INTERVIEW_DURCHGEFÜHRT' THEN
      v_interview_date := (v_meta ->> 'interview_date')::timestamptz;
    ELSIF v_target = 'INTERVIEW_GEPLANT' THEN
      v_interview_date := (v_meta ->> 'planned_at')::timestamptz;
    END IF;

    UPDATE public.company_candidates
    SET status = v_target,
        stage = lower(v_target::text),
        interview_date = COALESCE(v_interview_date, interview_date),
        updated_at = timezone('utc', now()),
        last_touched_at = timezone('utc', now())
    WHERE id = p_company_candidate_id;
  END IF;

  INSERT INTO public.candidate_status_history (
    company_candidate_id,
    from_status,
    to_status,
    changed_by,
    meta
  ) VALUES (
    p_company_candidate_id,
    v_prev,
    v_target,
    COALESCE(v_user, '00000000-0000-0000-0000-000000000000'::uuid),
    v_meta
  );

  IF NOT p_silent THEN
    -- Hook for future notifications.
    PERFORM 1;
  END IF;
END;
$$;

