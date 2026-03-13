-- Phase 1: Backend-Fundament (Retry after deadlock)

-- Drop constraints
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_stage_check;
ALTER TABLE public.company_candidates DROP CONSTRAINT IF EXISTS company_candidates_stage_check;

-- Migrate data
UPDATE public.applications SET stage = CASE
  WHEN stage IN ('new') THEN 'neu'
  WHEN stage IN ('unlocked') THEN 'freigeschaltet'
  WHEN stage IN ('interview', 'contacted', 'in_contact') THEN 'gespräch'
  WHEN stage IN ('archived', 'rejected') THEN 'archiv'
  ELSE stage END;

UPDATE public.company_candidates SET stage = CASE
  WHEN stage IN ('new', 'available') THEN 'neu'
  WHEN stage IN ('unlocked') THEN 'freigeschaltet'
  WHEN stage IN ('interview', 'contacted', 'in_contact') THEN 'gespräch'
  WHEN stage IN ('archived', 'rejected') THEN 'archiv'
  ELSE stage END;

-- RPCs
CREATE OR REPLACE FUNCTION public.unlock_candidate(p_company_id uuid, p_job_id uuid, p_candidate_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_application_id uuid; v_token_balance int; v_already_unlocked boolean := false;
  v_cc_exists boolean := false; v_token_cost int := 1; v_result jsonb;
BEGIN
  SELECT id INTO v_application_id FROM public.applications WHERE job_id = p_job_id AND candidate_id = p_candidate_id LIMIT 1;
  IF v_application_id IS NULL THEN RAISE EXCEPTION 'application_not_found'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.company_candidates WHERE company_id = p_company_id AND candidate_id = p_candidate_id AND unlocked_at IS NOT NULL) INTO v_already_unlocked;
  SELECT EXISTS (SELECT 1 FROM public.company_candidates WHERE company_id = p_company_id AND candidate_id = p_candidate_id) INTO v_cc_exists;
  IF NOT v_already_unlocked THEN
    SELECT token_balance INTO v_token_balance FROM public.companies WHERE id = p_company_id FOR UPDATE;
    IF v_token_balance IS NULL OR v_token_balance < v_token_cost THEN RAISE EXCEPTION 'insufficient_tokens'; END IF;
    UPDATE public.companies SET token_balance = token_balance - v_token_cost, active_tokens = active_tokens - v_token_cost, updated_at = now() WHERE id = p_company_id;
    IF v_cc_exists THEN
      UPDATE public.company_candidates SET unlocked_at = now(), unlock_type = 'manual', updated_at = now() WHERE company_id = p_company_id AND candidate_id = p_candidate_id;
    ELSE
      INSERT INTO public.company_candidates (company_id, candidate_id, stage, unlocked_at, unlock_type, source)
      VALUES (p_company_id, p_candidate_id, 'freigeschaltet', now(), 'manual', 'job_application');
    END IF;
  END IF;
  UPDATE public.applications SET unlocked_at = COALESCE(unlocked_at, now()), stage = CASE WHEN stage = 'neu' THEN 'freigeschaltet' ELSE stage END,
      unlock_type = COALESCE(unlock_type, 'manual'), viewed_by_company = true, updated_at = now() WHERE id = v_application_id;
  SELECT jsonb_build_object('candidate_id', c.id, 'email', c.email, 'phone', c.phone, 'cv_url', c.cv_url, 'linkedin_url', c.linkedin_url,
    'already_unlocked', v_already_unlocked, 'token_charged', NOT v_already_unlocked, 'tokens_spent', CASE WHEN v_already_unlocked THEN 0 ELSE v_token_cost END
  ) INTO v_result FROM public.candidates c WHERE c.id = p_candidate_id;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_candidates_for_job(p_job_id uuid, p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE (application_id uuid, candidate_id uuid, stage text, unlocked boolean, name text, city text, preference text,
  match_score int, skills text[], languages text[], experience_years int, bio_short text, cv_url text, email text, phone text, created_at timestamptz, unlocked_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH base AS (
    SELECT a.id as application_id, c.id as candidate_id, a.stage, (a.unlocked_at IS NOT NULL) as unlocked,
      COALESCE(c.full_name, c.vorname || ' ' || c.nachname) as name, c.city, COALESCE(c.availability_status, 'available') as preference,
      COALESCE(a.match_score, 0) as match_score, c.skills, c.languages, c.experience_years, c.bio_short, c.cv_url,
      CASE WHEN a.unlocked_at IS NOT NULL THEN c.email ELSE NULL END as email,
      CASE WHEN a.unlocked_at IS NOT NULL THEN c.phone ELSE NULL END as phone, a.created_at, a.unlocked_at
    FROM public.applications a JOIN public.candidates c ON c.id = a.candidate_id WHERE a.job_id = p_job_id
  )
  SELECT * FROM base
  WHERE (COALESCE(p_filters->>'city', '') = '' OR city ILIKE '%' || (p_filters->>'city') || '%')
    AND (COALESCE(p_filters->>'preference', '') = '' OR preference = (p_filters->>'preference'))
    AND (COALESCE(p_filters->>'unlocked', '') = '' OR unlocked = (p_filters->>'unlocked')::boolean)
    AND (COALESCE(p_filters->>'search', '') = '' OR name ILIKE '%' || (p_filters->>'search') || '%' OR bio_short ILIKE '%' || (p_filters->>'search') || '%')
    AND (COALESCE(p_filters->>'stage', '') = '' OR stage = (p_filters->>'stage'))
  ORDER BY CASE COALESCE(p_filters->>'sort', 'relevanz') WHEN 'match' THEN match_score WHEN 'neu' THEN EXTRACT(EPOCH FROM created_at)::int
      ELSE match_score END DESC NULLS LAST, created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.move_application_stage(p_application_id uuid, p_new_stage text, p_archived_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_new_stage NOT IN ('neu', 'freigeschaltet', 'gespräch', 'archiv') THEN RAISE EXCEPTION 'invalid_stage'; END IF;
  UPDATE public.applications SET stage = p_new_stage,
      archived_reason = CASE WHEN p_new_stage = 'archiv' THEN p_archived_reason ELSE archived_reason END,
      archived_at = CASE WHEN p_new_stage = 'archiv' THEN now() ELSE NULL END, updated_at = now() WHERE id = p_application_id;
  UPDATE public.company_candidates cc SET stage = p_new_stage, updated_at = now() FROM public.applications a
  WHERE cc.candidate_id = a.candidate_id AND cc.company_id = a.company_id AND a.id = p_application_id;
END; $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_stage ON public.applications(job_id, stage);
CREATE INDEX IF NOT EXISTS idx_company_candidates_company_unlocked ON public.company_candidates(company_id, candidate_id, unlocked_at);