-- Drop the old function
DROP FUNCTION IF EXISTS get_candidates_for_job(uuid, jsonb);

-- Create new function to get applications (real applicants) for a job
CREATE OR REPLACE FUNCTION get_candidates_for_job(
  p_job_id UUID,
  p_filters JSONB DEFAULT NULL
)
RETURNS TABLE (
  candidate_id UUID,
  profile_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  skills TEXT[],
  stage TEXT,
  match_score INTEGER,
  is_unlocked BOOLEAN,
  unlocked_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_city TEXT;
  v_skills TEXT[];
  v_search TEXT;
BEGIN
  -- Extract filters
  IF p_filters IS NOT NULL THEN
    v_city := p_filters->>'city';
    v_skills := ARRAY(SELECT jsonb_array_elements_text(p_filters->'skills'));
    v_search := p_filters->>'search_text';
  END IF;

  RETURN QUERY
  SELECT 
    a.id as candidate_id,
    p.id as profile_id,
    CASE 
      WHEN a.unlocked_at IS NOT NULL THEN p.vorname
      ELSE NULL
    END as first_name,
    CASE 
      WHEN a.unlocked_at IS NOT NULL THEN p.nachname
      ELSE NULL
    END as last_name,
    CASE 
      WHEN a.unlocked_at IS NOT NULL THEN p.email
      ELSE NULL
    END as email,
    CASE 
      WHEN a.unlocked_at IS NOT NULL THEN p.telefon
      ELSE NULL
    END as phone,
    p.ort as city,
    CASE 
      WHEN a.unlocked_at IS NOT NULL THEN p.avatar_url
      ELSE NULL
    END as avatar_url,
    p.faehigkeiten as skills,
    a.stage,
    a.match_score,
    (a.unlocked_at IS NOT NULL) as is_unlocked,
    a.unlocked_at,
    a.applied_at
  FROM applications a
  LEFT JOIN profiles p ON a.candidate_id = p.id
  WHERE a.job_id = p_job_id
    AND (v_city IS NULL OR p.ort ILIKE '%' || v_city || '%')
    AND (v_skills IS NULL OR p.faehigkeiten && v_skills)
    AND (v_search IS NULL OR 
         p.vorname ILIKE '%' || v_search || '%' OR 
         p.nachname ILIKE '%' || v_search || '%' OR
         p.ort ILIKE '%' || v_search || '%')
  ORDER BY a.created_at DESC;
END;
$$;