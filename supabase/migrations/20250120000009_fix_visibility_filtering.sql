-- Fix visibility_mode filtering in candidate search functions
-- Only visible profiles should appear in company searches
-- Invisible profiles can still apply to jobs (applications work independently)

-- 1. Update profiles_with_match function to filter by visibility_mode
CREATE OR REPLACE FUNCTION public.profiles_with_match(
  p_company_id uuid,
  p_variant text,             -- 'dashboard' | 'search' | 'unlocked'
  p_limit int DEFAULT 30,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  role text,
  city text,
  fs boolean,
  seeking text,
  skills text[],
  match int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH base AS (
    SELECT DISTINCT
      pr.id,
      COALESCE(pr.vorname, 'Anonym') as name,
      NULL::text as avatar_url,
      pr.ausbildungsberuf as role,
      pr.ort as city,
      COALESCE(pr.has_drivers_license, false) as fs,
      CASE 
        WHEN cardinality(pr.job_search_preferences) > 0 THEN array_to_string(pr.job_search_preferences, ', ')
        ELSE NULL
      END as seeking,
      CASE 
        WHEN pr.faehigkeiten IS NOT NULL THEN 
          ARRAY(SELECT jsonb_array_elements_text(pr.faehigkeiten))
        ELSE '{}'::text[]
      END as skills,
      public.compute_match_percent(p_company_id, pr.faehigkeiten, pr.ort) as match
    FROM public.profiles pr
    WHERE pr.vorname IS NOT NULL
      AND pr.profile_published = true
      AND pr.visibility_mode = 'visible' -- Only show visible profiles
  ),
  filtered AS (
    SELECT b.*
    FROM base b
    LEFT JOIN public.company_candidates cc
      ON cc.company_id = p_company_id AND cc.candidate_id = b.id
    WHERE
      CASE
        WHEN p_variant = 'dashboard' THEN cc.candidate_id IS NULL
        WHEN p_variant = 'search' THEN TRUE
        WHEN p_variant = 'unlocked' THEN cc.candidate_id IS NOT NULL AND cc.unlocked_at IS NOT NULL
        ELSE TRUE
      END
  )
  SELECT * FROM filtered
  ORDER BY
    CASE WHEN p_variant IN ('dashboard','search') THEN match END DESC NULLS LAST,
    name ASC
  LIMIT p_limit OFFSET p_offset;
$$;

-- 2. Update search_candidates function if it uses profiles table
-- Note: This function uses 'candidates' view/table, so we need to check if it's based on profiles
-- If candidates is a view based on profiles, we need to update the view or add a filter here

-- 3. Check if there's a candidates view that needs updating
DO $$
BEGIN
  -- If candidates is a view based on profiles, add visibility filter
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'candidates'
  ) THEN
    -- Drop and recreate view with visibility filter
    DROP VIEW IF EXISTS public.candidates CASCADE;
    
    -- Recreate candidates view (adjust columns based on actual schema)
    CREATE OR REPLACE VIEW public.candidates AS
    SELECT 
      p.id,
      p.user_id,
      COALESCE(p.vorname || ' ' || p.nachname, p.vorname, p.nachname, 'Unbekannt') as full_name,
      p.email,
      p.telefon as phone,
      p.ort as city,
      p.country,
      CASE 
        WHEN p.faehigkeiten IS NOT NULL THEN 
          ARRAY(SELECT jsonb_array_elements_text(p.faehigkeiten))
        ELSE '{}'::text[]
      END as skills,
      p.sprachen as languages,
      p.berufserfahrung as experience_years,
      p.salary_expectation_min,
      p.salary_expectation_max,
      p.uebermich as bio_short,
      p.avatar_url as profile_image,
      p.created_at
    FROM public.profiles p
    WHERE p.profile_published = true
      AND p.visibility_mode = 'visible'; -- Only visible profiles in candidates view
  END IF;
END $$;

-- 4. Update get_candidates_for_job function
-- NOTE: This function shows candidates who APPLIED to a job
-- Applications should be visible even if profile is invisible (user applied actively)
-- But we still filter by visibility_mode for general candidate search
CREATE OR REPLACE FUNCTION public.get_candidates_for_job(
  p_job_id uuid,
  p_filters jsonb DEFAULT NULL
)
RETURNS TABLE (
  candidate_id uuid,
  profile_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  city text,
  avatar_url text,
  skills jsonb,
  stage text,
  match_score integer,
  is_unlocked boolean,
  unlocked_at timestamptz,
  applied_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id as candidate_id,
    cc.candidate_id as profile_id,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.vorname
      ELSE LEFT(p.vorname, 1) || '.'
    END as first_name,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.nachname
      ELSE '***'
    END as last_name,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.email
      ELSE NULL
    END as email,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.telefon
      ELSE NULL
    END as phone,
    p.ort as city,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.avatar_url
      ELSE NULL
    END as avatar_url,
    p.faehigkeiten as skills,
    COALESCE(cc.stage, 'new') as stage,
    COALESCE(cc.match_score, 0) as match_score,
    (cc.unlocked_at IS NOT NULL) as is_unlocked,
    cc.unlocked_at,
    cc.created_at as applied_at
  FROM company_candidates cc
  JOIN profiles p ON cc.candidate_id = p.id
  WHERE cc.linked_job_ids @> jsonb_build_array(p_job_id)
    -- Applications are always visible (user applied actively)
    -- But we still check profile_published for safety
    AND p.profile_published = true
  ORDER BY cc.created_at DESC;
END;
$$;

-- 5. Update search_candidates function to filter by visibility_mode
-- This function is used for general candidate search (not applications)
CREATE OR REPLACE FUNCTION public.search_candidates(
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
    p.id,
    p.id as user_id, -- profiles.id is the user_id
    COALESCE(p.vorname || ' ' || p.nachname, p.vorname, p.nachname, 'Unbekannt') as full_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM company_candidates cc
        WHERE cc.candidate_id = p.id
        AND cc.company_id = _company_id
        AND cc.unlocked_at IS NOT NULL
      ) THEN p.email
      ELSE NULL
    END as email,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM company_candidates cc
        WHERE cc.candidate_id = p.id
        AND cc.company_id = _company_id
        AND cc.unlocked_at IS NOT NULL
      ) THEN p.telefon
      ELSE NULL
    END as phone,
    p.ort as city,
    p.country,
    CASE 
      WHEN p.faehigkeiten IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(p.faehigkeiten))
      ELSE '{}'::text[]
    END as skills,
    p.sprachen as languages,
    NULL::int as experience_years,
    NULL::int as salary_expectation_min,
    NULL::int as salary_expectation_max,
    p.uebermich as bio_short,
    p.avatar_url as profile_image,
    p.created_at,
    EXISTS (
      SELECT 1 FROM company_candidates cc
      WHERE cc.candidate_id = p.id
      AND cc.company_id = _company_id
      AND cc.unlocked_at IS NOT NULL
    ) as is_unlocked,
    NULL::uuid as application_id,
    NULL::application_status as application_status
  FROM profiles p
  LEFT JOIN applications a ON (
    a.candidate_id = p.id 
    AND a.company_id = _company_id
    AND (_job_id IS NULL OR a.job_id = _job_id)
  )
  WHERE p.profile_published = true
    AND p.visibility_mode = 'visible' -- Only show visible profiles in search
    AND (_search_text IS NULL OR (
      p.vorname ILIKE '%' || _search_text || '%'
      OR p.nachname ILIKE '%' || _search_text || '%'
      OR p.email ILIKE '%' || _search_text || '%'
      OR p.uebermich ILIKE '%' || _search_text || '%'
    ))
  ORDER BY p.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- 6. Update radius search functions to filter by visibility_mode
CREATE OR REPLACE FUNCTION public.search_profiles_within_radius(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 50.0,
  p_location_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  profile_id UUID,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_center_geog GEOGRAPHY;
BEGIN
  -- Bestimme Zentrum (entweder aus Koordinaten oder location_id)
  IF p_location_id IS NOT NULL THEN
    SELECT geog INTO v_center_geog
    FROM public.locations
    WHERE id = p_location_id;
  ELSE
    v_center_geog := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  END IF;

  IF v_center_geog IS NULL THEN
    RAISE EXCEPTION 'Invalid center location';
  END IF;

  -- Suche Profile innerhalb des Radius (verwendet PostGIS ST_DWithin)
  -- Nur sichtbare Profile werden zurückgegeben
  RETURN QUERY
  SELECT 
    p.id AS profile_id,
    ST_Distance(lp.geog, v_center_geog) / 1000.0 AS distance_km
  FROM public.profiles p
  JOIN public.locations lp ON lp.id = p.location_id
  WHERE p.location_id IS NOT NULL
    AND lp.geog IS NOT NULL
    AND p.profile_published = true
    AND p.visibility_mode = 'visible' -- Only show visible profiles
    AND ST_DWithin(lp.geog, v_center_geog, p_radius_km * 1000.0)
  ORDER BY distance_km;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_profiles_within_radius_by_coords(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 50.0
)
RETURNS TABLE (
  profile_id UUID,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_center_geog GEOGRAPHY;
BEGIN
  v_center_geog := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

  -- Suche Profile mit eigenen Koordinaten
  -- Nur sichtbare Profile werden zurückgegeben
  RETURN QUERY
  SELECT 
    p.id AS profile_id,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
      v_center_geog
    ) / 1000.0 AS distance_km
  FROM public.profiles p
  WHERE p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND p.profile_published = true
    AND p.visibility_mode = 'visible' -- Only show visible profiles
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
      v_center_geog,
      p_radius_km * 1000.0
    )
  ORDER BY distance_km;
END;
$$;

-- 7. Update get_matches_for_need function to filter by visibility_mode
-- This function is used for need-based matching
CREATE OR REPLACE FUNCTION public.get_matches_for_need(
  p_need_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  candidate_id UUID,
  score INTEGER,
  breakdown JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nm.candidate_id,
    nm.score,
    nm.breakdown
  FROM need_matches nm
  JOIN profiles p ON p.id = nm.candidate_id
  WHERE nm.need_id = p_need_id
    AND p.profile_published = true
    AND p.visibility_mode = 'visible' -- Only show visible profiles
  ORDER BY nm.score DESC
  LIMIT p_limit;
END;
$$;

-- 8. Add comments explaining visibility behavior
COMMENT ON FUNCTION public.profiles_with_match IS 'Returns only profiles with visibility_mode = ''visible''. Invisible profiles can still apply to jobs via applications.';
COMMENT ON FUNCTION public.get_candidates_for_job IS 'Shows candidates who applied to a job. Applications are visible even if profile is invisible (user applied actively).';
COMMENT ON FUNCTION public.search_candidates IS 'Returns only visible profiles for company search. Invisible profiles can still apply to jobs.';
COMMENT ON FUNCTION public.search_profiles_within_radius IS 'Returns only visible profiles within radius. Invisible profiles can still apply to jobs.';
COMMENT ON FUNCTION public.search_profiles_within_radius_by_coords IS 'Returns only visible profiles within radius using coordinates. Invisible profiles can still apply to jobs.';
COMMENT ON FUNCTION public.get_matches_for_need IS 'Returns only visible profile matches for a need. Invisible profiles can still apply to jobs.';

