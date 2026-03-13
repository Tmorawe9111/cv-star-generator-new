-- Migration 4: RPCs for candidate operations (corrected)

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.search_candidates(uuid, uuid, text, int, int);
DROP FUNCTION IF EXISTS public.unlock_candidate(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.set_application_status(uuid, application_status, text, text);
DROP FUNCTION IF EXISTS public.get_applications_by_status(uuid, application_status, uuid, int, int);

-- ============================================
-- RPC: search_candidates
-- ============================================
CREATE FUNCTION public.search_candidates(
  _company_id uuid,
  _job_id uuid DEFAULT NULL,
  _search_text text DEFAULT NULL,
  _limit int DEFAULT 20,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
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
  -- Check if user has access to this company
  IF NOT EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = _company_id
    AND cu.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to company';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.full_name,
    c.email,
    c.phone,
    c.city,
    c.country,
    c.skills,
    c.languages,
    c.experience_years,
    c.salary_expectation_min,
    c.salary_expectation_max,
    c.bio_short,
    c.profile_image,
    c.created_at,
    (a.id IS NOT NULL AND a.status = 'unlocked') AS is_unlocked,
    a.id AS application_id,
    a.status AS application_status
  FROM candidates c
  LEFT JOIN applications a ON (
    a.candidate_id = c.id 
    AND a.company_id = _company_id
    AND (_job_id IS NULL OR a.job_id = _job_id)
  )
  WHERE 
    (_search_text IS NULL OR (
      c.full_name ILIKE '%' || _search_text || '%'
      OR c.email ILIKE '%' || _search_text || '%'
      OR c.bio_short ILIKE '%' || _search_text || '%'
    ))
  ORDER BY c.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- ============================================
-- RPC: unlock_candidate
-- ============================================
CREATE FUNCTION public.unlock_candidate(
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
  _existing_app applications%ROWTYPE;
BEGIN
  -- Check if user has access to this company
  IF NOT EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = _company_id
    AND cu.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to company';
  END IF;

  -- Check if candidate exists
  IF NOT EXISTS (SELECT 1 FROM candidates WHERE id = _candidate_id) THEN
    RAISE EXCEPTION 'Candidate not found';
  END IF;

  -- Check for existing application
  SELECT * INTO _existing_app
  FROM applications
  WHERE company_id = _company_id
  AND candidate_id = _candidate_id
  AND (_job_id IS NULL OR job_id = _job_id);

  IF _existing_app.id IS NOT NULL THEN
    -- Application exists
    IF _existing_app.status = 'unlocked' THEN
      -- Already unlocked
      RETURN jsonb_build_object(
        'success', true,
        'application_id', _existing_app.id,
        'status', _existing_app.status,
        'message', 'Candidate already unlocked'
      );
    ELSE
      -- Update to unlocked
      UPDATE applications
      SET 
        status = 'unlocked',
        unlocked_at = now(),
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
  ELSE
    -- Create new application with unlocked status
    INSERT INTO applications (
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
  END IF;
END;
$$;

-- ============================================
-- RPC: set_application_status
-- ============================================
CREATE FUNCTION public.set_application_status(
  _application_id uuid,
  _new_status application_status,
  _reason_short text DEFAULT NULL,
  _reason_custom text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _app applications%ROWTYPE;
BEGIN
  -- Get application
  SELECT * INTO _app
  FROM applications
  WHERE id = _application_id;

  IF _app.id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- Check if user has access to this company
  IF NOT EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = _app.company_id
    AND cu.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to company';
  END IF;

  -- Update status
  UPDATE applications
  SET 
    status = _new_status,
    reason_short = COALESCE(_reason_short, reason_short),
    reason_custom = COALESCE(_reason_custom, reason_custom),
    updated_at = now()
  WHERE id = _application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', _application_id,
    'old_status', _app.status,
    'new_status', _new_status,
    'message', 'Status updated successfully'
  );
END;
$$;

-- ============================================
-- RPC: get_applications_by_status
-- ============================================
CREATE FUNCTION public.get_applications_by_status(
  _company_id uuid,
  _status application_status,
  _job_id uuid DEFAULT NULL,
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  application_id uuid,
  candidate_id uuid,
  job_id uuid,
  source application_source,
  status application_status,
  created_at timestamptz,
  updated_at timestamptz,
  unlocked_at timestamptz,
  is_new boolean,
  reason_short text,
  reason_custom text,
  match_score int,
  candidate_full_name text,
  candidate_email text,
  candidate_phone text,
  candidate_profile_image text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has access to this company
  IF NOT EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = _company_id
    AND cu.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to company';
  END IF;

  RETURN QUERY
  SELECT 
    a.id AS application_id,
    a.candidate_id,
    a.job_id,
    a.source,
    a.status,
    a.created_at,
    a.updated_at,
    a.unlocked_at,
    a.is_new,
    a.reason_short,
    a.reason_custom,
    a.match_score,
    c.full_name AS candidate_full_name,
    c.email AS candidate_email,
    c.phone AS candidate_phone,
    c.profile_image AS candidate_profile_image
  FROM applications a
  LEFT JOIN candidates c ON c.id = a.candidate_id
  WHERE a.company_id = _company_id
  AND a.status = _status
  AND (_job_id IS NULL OR a.job_id = _job_id)
  ORDER BY a.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_candidates TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_candidate TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_application_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_applications_by_status TO authenticated;