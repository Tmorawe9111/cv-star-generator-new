-- Fix get_applications_by_status to return candidate details from profiles (auth.uid()).
-- Historically, applications.candidate_id sometimes referenced candidates.id.
-- This function supports both forms by resolving candidate_id -> profile_id.

CREATE OR REPLACE FUNCTION public.get_applications_by_status(
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
  WITH resolved AS (
    SELECT
      a.*,
      COALESCE(p_direct.id, p_from_candidate.id) AS profile_id,
      COALESCE(p_direct.vorname, p_from_candidate.vorname) AS vorname,
      COALESCE(p_direct.nachname, p_from_candidate.nachname) AS nachname,
      COALESCE(p_direct.email, p_from_candidate.email) AS email,
      COALESCE(p_direct.telefon, p_from_candidate.telefon) AS telefon,
      COALESCE(p_direct.avatar_url, p_from_candidate.avatar_url) AS avatar_url
    FROM applications a
    LEFT JOIN candidates c ON c.id = a.candidate_id
    LEFT JOIN profiles p_from_candidate ON p_from_candidate.id = c.user_id
    LEFT JOIN profiles p_direct ON p_direct.id = a.candidate_id
    WHERE a.company_id = _company_id
      AND a.status = _status
      AND (_job_id IS NULL OR a.job_id = _job_id)
  )
  SELECT
    r.id AS application_id,
    COALESCE(r.profile_id, r.candidate_id) AS candidate_id,
    r.job_id,
    r.source,
    r.status,
    r.created_at,
    r.updated_at,
    r.unlocked_at,
    r.is_new,
    r.reason_short,
    r.reason_custom,
    r.match_score,
    NULLIF(TRIM(COALESCE(r.vorname, '') || ' ' || COALESCE(r.nachname, '')), '') AS candidate_full_name,
    r.email AS candidate_email,
    r.telefon AS candidate_phone,
    r.avatar_url AS candidate_profile_image
  FROM resolved r
  ORDER BY r.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;


