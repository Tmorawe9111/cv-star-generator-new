-- Align RPCs with canonical model:
-- applications.candidate_id = profiles.id (= auth.uid()).
-- After 20251217000010, the FK is to public.profiles(id).

-- ============================================
-- RPC: search_candidates (return profile ids; join apps by candidate_id = profiles.id)
-- ============================================
CREATE OR REPLACE FUNCTION public.search_candidates(
  _company_id uuid,
  _job_id uuid DEFAULT NULL,
  _search_text text DEFAULT NULL,
  _limit int DEFAULT 20,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,               -- profile id (canonical)
  user_id uuid,          -- kept for backwards compat (same as id)
  full_name text,
  email text,
  phone text,
  city text,
  country text,
  skills text[],
  languages text[],
  experience_years int,
  salary_expectation_min int,
  salary_expectation_max int,
  bio_short text,
  profile_image text,
  created_at timestamptz,
  is_unlocked boolean,
  application_id uuid,
  application_status application_status
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = _company_id
      AND cu.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to company';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS id,
    p.id AS user_id,
    COALESCE(NULLIF(TRIM(COALESCE(p.vorname, '') || ' ' || COALESCE(p.nachname, '')), ''), p.display_name) AS full_name,
    p.email,
    p.telefon AS phone,
    p.ort AS city,
    p.country,
    p.skills,
    p.languages,
    p.experience_years,
    p.salary_expectation_min,
    p.salary_expectation_max,
    p.bio_short,
    p.avatar_url AS profile_image,
    p.created_at,
    (a.application_id IS NOT NULL AND a.application_status = 'unlocked') AS is_unlocked,
    a.application_id,
    a.application_status
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT
      ap.id AS application_id,
      ap.status AS application_status
    FROM public.applications ap
    WHERE ap.company_id = _company_id
      AND ap.candidate_id = p.id
      AND (_job_id IS NULL OR ap.job_id = _job_id)
    ORDER BY ap.updated_at DESC NULLS LAST, ap.created_at DESC NULLS LAST, ap.id DESC
    LIMIT 1
  ) a ON true
  WHERE
    (_search_text IS NULL OR (
      COALESCE(p.vorname, '') ILIKE '%' || _search_text || '%'
      OR COALESCE(p.nachname, '') ILIKE '%' || _search_text || '%'
      OR COALESCE(p.display_name, '') ILIKE '%' || _search_text || '%'
      OR COALESCE(p.bio_short, '') ILIKE '%' || _search_text || '%'
      OR COALESCE(p.email, '') ILIKE '%' || _search_text || '%'
    ))
  ORDER BY p.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- ============================================
-- RPC: unlock_candidate (candidate_id is profile id)
-- ============================================
CREATE OR REPLACE FUNCTION public.unlock_candidate(
  _company_id uuid,
  _candidate_id uuid,
  _job_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _application_id uuid;
  _existing_app public.applications%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = _company_id
      AND cu.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to company';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _candidate_id) THEN
    RAISE EXCEPTION 'Candidate not found';
  END IF;

  SELECT * INTO _existing_app
  FROM public.applications
  WHERE company_id = _company_id
    AND candidate_id = _candidate_id
    AND (_job_id IS NULL OR job_id = _job_id)
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  IF _existing_app.id IS NOT NULL THEN
    IF _existing_app.status = 'unlocked' THEN
      RETURN jsonb_build_object(
        'success', true,
        'application_id', _existing_app.id,
        'status', _existing_app.status,
        'message', 'Candidate already unlocked'
      );
    END IF;

    UPDATE public.applications
    SET
      status = 'unlocked',
      unlocked_at = COALESCE(unlocked_at, now()),
      updated_at = now()
    WHERE id = _existing_app.id
    RETURNING id INTO _application_id;

    RETURN jsonb_build_object(
      'success', true,
      'application_id', _application_id,
      'status', 'unlocked',
      'message', 'Candidate unlocked successfully'
    );
  END IF;

  INSERT INTO public.applications (
    company_id,
    candidate_id,
    job_id,
    source,
    status,
    unlocked_at
  ) VALUES (
    _company_id,
    _candidate_id,
    _job_id,
    'sourced',
    'unlocked',
    now()
  )
  RETURNING id INTO _application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', _application_id,
    'status', 'unlocked',
    'message', 'Candidate unlocked successfully'
  );
END;
$$;


