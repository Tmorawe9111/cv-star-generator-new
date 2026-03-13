-- Create indexes for better performance with actual schema
CREATE INDEX IF NOT EXISTS idx_profiles_faehigkeiten_gin ON profiles USING gin (faehigkeiten);
CREATE INDEX IF NOT EXISTS idx_profiles_ort ON profiles(ort);

-- Simple match function adapted to actual schema
CREATE OR REPLACE FUNCTION public.compute_match_percent(
  company_id uuid,
  candidate_skills jsonb,
  candidate_city text
) RETURNS int
LANGUAGE sql
STABLE
AS $$
  WITH prefs AS (
    SELECT
      COALESCE(c.matching_about, '') as about_text,
      CASE 
        WHEN c.main_location IS NOT NULL THEN ARRAY[c.main_location]
        ELSE '{}'::text[]
      END as preferred_locations
    FROM companies c
    WHERE c.id = company_id
  ),
  skill_match AS (
    SELECT
      CASE
        WHEN candidate_skills IS NULL OR jsonb_array_length(candidate_skills) = 0 THEN 30
        WHEN prefs.about_text = '' THEN 60 -- default score when no preferences
        ELSE GREATEST(30, LEAST(85, 
          30 + (jsonb_array_length(candidate_skills) * 8) -- basic skill bonus
        ))
      END as skills_score,
      CASE
        WHEN cardinality(preferred_locations) > 0 AND candidate_city IS NOT NULL 
             AND candidate_city = ANY(preferred_locations) THEN 15
        ELSE 0
      END as location_bonus
    FROM prefs
  )
  SELECT LEAST(100, GREATEST(0, (SELECT skills_score + location_bonus FROM skill_match)));
$$;

-- RPC: list profiles with match adapted to actual schema
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
AS $$
  WITH base AS (
    SELECT DISTINCT
      pr.id,
      COALESCE(pr.vorname || ' ' || pr.nachname, pr.vorname, pr.nachname, 'Unbekannt') as name,
      pr.avatar_url,
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
      compute_match_percent(p_company_id, pr.faehigkeiten, pr.ort) as match
    FROM profiles pr
    WHERE (pr.vorname IS NOT NULL OR pr.nachname IS NOT NULL)
      AND pr.profile_published = true
  ),
  filtered AS (
    SELECT b.*
    FROM base b
    LEFT JOIN company_candidates cc
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

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION public.profiles_with_match(uuid,text,int,int) FROM public;
GRANT EXECUTE ON FUNCTION public.profiles_with_match(uuid,text,int,int) TO authenticated;