-- Fix get_candidates_for_job RPC: Remove non-existent plz column
DROP FUNCTION IF EXISTS get_candidates_for_job(uuid, jsonb);

CREATE OR REPLACE FUNCTION get_candidates_for_job(
  p_job_id UUID,
  p_filters JSONB DEFAULT NULL
)
RETURNS TABLE (
  application_id UUID,
  candidate_id UUID,
  stage TEXT,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  match_score NUMERIC,
  full_name TEXT,
  vorname TEXT,
  nachname TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  skills TEXT[],
  headline TEXT,
  bio_short TEXT,
  cv_url TEXT,
  license BOOLEAN,
  job_search_preferences TEXT[],
  linked_job_titles JSONB,
  industry TEXT,
  status TEXT,
  experience_years INTEGER,
  languages JSONB,
  availability TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS application_id,
    c.id AS candidate_id,
    COALESCE(a.stage, 'neu')::TEXT AS stage,
    u.unlocked_at,
    a.created_at,
    COALESCE(a.match_score, 0)::NUMERIC AS match_score,
    COALESCE(c.vorname || ' ' || c.nachname, 'Unbekannt')::TEXT AS full_name,
    c.vorname,
    c.nachname,
    c.avatar_url,
    CASE WHEN u.unlocked_at IS NOT NULL THEN c.email ELSE NULL END AS email,
    CASE WHEN u.unlocked_at IS NOT NULL THEN c.telefon ELSE NULL END AS phone,
    c.ort AS city,
    c.faehigkeiten AS skills,
    c.headline,
    c.bio_short,
    c.cv_url,
    c.fuehrerschein AS license,
    c.job_search_preferences,
    c.linked_job_titles,
    c.branche AS industry,
    c.status,
    c.experience_years,
    c.languages,
    c.availability
  FROM applications a
  INNER JOIN candidates c ON c.id = a.candidate_id
  LEFT JOIN unlocked_candidates u ON u.candidate_id = c.id 
    AND u.job_id = a.job_id
  WHERE a.job_id = p_job_id
    AND (p_filters IS NULL OR (
      (p_filters->>'city' IS NULL OR c.ort ILIKE '%' || (p_filters->>'city') || '%')
      AND (p_filters->>'skills' IS NULL OR c.faehigkeiten && ARRAY(SELECT jsonb_array_elements_text(p_filters->'skills')))
      AND (p_filters->>'search_text' IS NULL OR 
           c.vorname ILIKE '%' || (p_filters->>'search_text') || '%' OR
           c.nachname ILIKE '%' || (p_filters->>'search_text') || '%' OR
           c.email ILIKE '%' || (p_filters->>'search_text') || '%')
      AND (p_filters->>'experience_min' IS NULL OR c.experience_years >= (p_filters->>'experience_min')::INTEGER)
      AND (p_filters->>'experience_max' IS NULL OR c.experience_years <= (p_filters->>'experience_max')::INTEGER)
      AND (p_filters->>'languages' IS NULL OR c.languages ?| ARRAY(SELECT jsonb_array_elements_text(p_filters->'languages')))
      AND (p_filters->>'availability' IS NULL OR c.availability = (p_filters->>'availability'))
    ))
  ORDER BY 
    CASE WHEN u.unlocked_at IS NOT NULL THEN 0 ELSE 1 END,
    a.match_score DESC NULLS LAST,
    a.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_candidates_for_job(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidates_for_job(UUID, JSONB) TO anon;