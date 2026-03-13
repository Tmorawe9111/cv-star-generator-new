-- =====================================================
-- Phase 3: Erweiterte Filter & Match-Logik (Fixed)
-- =====================================================

-- Drop old function first
DROP FUNCTION IF EXISTS get_candidates_for_job(UUID, JSONB);

-- Erweitere get_candidates_for_job RPC um bessere Filter-Unterstützung
CREATE FUNCTION get_candidates_for_job(
  p_job_id UUID,
  p_filters JSONB DEFAULT NULL
)
RETURNS TABLE (
  application_id TEXT,
  candidate_id UUID,
  full_name TEXT,
  vorname TEXT,
  nachname TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  headline TEXT,
  city TEXT,
  plz TEXT,
  industry TEXT,
  status TEXT,
  skills TEXT[],
  bio_short TEXT,
  cv_url TEXT,
  license BOOLEAN,
  job_search_preferences TEXT[],
  experience_years INTEGER,
  languages TEXT[],
  availability_status TEXT,
  match_score INTEGER,
  stage TEXT,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  linked_job_titles JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_filter_city TEXT;
  v_filter_skills TEXT[];
  v_filter_search TEXT;
  v_filter_experience_min INTEGER;
  v_filter_experience_max INTEGER;
  v_filter_languages TEXT[];
  v_filter_availability TEXT;
BEGIN
  -- Get company_id from job
  SELECT company_id INTO v_company_id
  FROM job_posts
  WHERE id = p_job_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- Extract filters from JSONB
  v_filter_city := p_filters->>'city';
  v_filter_skills := CASE 
    WHEN p_filters->'skills' IS NOT NULL 
    THEN ARRAY(SELECT jsonb_array_elements_text(p_filters->'skills'))
    ELSE NULL 
  END;
  v_filter_search := p_filters->>'search_text';
  v_filter_experience_min := (p_filters->>'experience_min')::INTEGER;
  v_filter_experience_max := (p_filters->>'experience_max')::INTEGER;
  v_filter_languages := CASE 
    WHEN p_filters->'languages' IS NOT NULL 
    THEN ARRAY(SELECT jsonb_array_elements_text(p_filters->'languages'))
    ELSE NULL 
  END;
  v_filter_availability := p_filters->>'availability';

  -- Return candidates from applications
  RETURN QUERY
  SELECT 
    a.id::TEXT as application_id,
    c.id as candidate_id,
    c.full_name,
    c.vorname,
    c.nachname,
    c.email,
    c.phone,
    c.profile_image as avatar_url,
    c.title as headline,
    c.city,
    c.plz,
    c.industry,
    c.status,
    c.skills,
    c.bio_short,
    c.cv_url,
    c.license,
    c.job_search_preferences,
    c.experience_years,
    c.languages,
    c.availability_status,
    COALESCE(a.match_score, 0)::INTEGER as match_score,
    COALESCE(cc.stage, a.stage, 'neu')::TEXT as stage,
    cc.unlocked_at,
    a.created_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', jp.id, 'title', jp.title))
       FROM unnest(COALESCE(cc.linked_job_ids::UUID[], ARRAY[]::UUID[])) AS ljid
       JOIN job_posts jp ON jp.id = ljid
      ),
      '[]'::JSONB
    ) as linked_job_titles
  FROM applications a
  JOIN candidates c ON c.id = a.candidate_id
  LEFT JOIN company_candidates cc ON cc.candidate_id = c.user_id AND cc.company_id = v_company_id
  WHERE a.job_post_id = p_job_id
    AND a.archived_at IS NULL
    -- City filter
    AND (v_filter_city IS NULL OR c.city ILIKE '%' || v_filter_city || '%')
    -- Skills filter (candidate must have at least one of the requested skills)
    AND (v_filter_skills IS NULL OR c.skills && v_filter_skills)
    -- Search filter (name or email)
    AND (v_filter_search IS NULL OR 
         c.full_name ILIKE '%' || v_filter_search || '%' OR
         c.email ILIKE '%' || v_filter_search || '%')
    -- Experience filter
    AND (v_filter_experience_min IS NULL OR c.experience_years >= v_filter_experience_min)
    AND (v_filter_experience_max IS NULL OR c.experience_years <= v_filter_experience_max)
    -- Languages filter (candidate must have at least one of the requested languages)
    AND (v_filter_languages IS NULL OR c.languages && v_filter_languages)
    -- Availability filter
    AND (v_filter_availability IS NULL OR c.availability_status = v_filter_availability)
  ORDER BY 
    -- Prioritize unlocked candidates
    CASE WHEN cc.unlocked_at IS NOT NULL THEN 0 ELSE 1 END,
    -- Then by match score
    COALESCE(a.match_score, 0) DESC,
    -- Then by application date
    a.created_at DESC;
END;
$$;

-- Add indexes for better performance on candidates table
CREATE INDEX IF NOT EXISTS idx_candidates_city ON candidates(city);
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_candidates_languages ON candidates USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_candidates_experience ON candidates(experience_years);
CREATE INDEX IF NOT EXISTS idx_candidates_availability ON candidates(availability_status);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_candidates_for_job(UUID, JSONB) TO authenticated;
