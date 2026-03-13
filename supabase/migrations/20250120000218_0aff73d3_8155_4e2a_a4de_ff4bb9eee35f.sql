-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_skills_gin ON profiles USING gin (skills);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- Simple match function (skills + location boost)
CREATE OR REPLACE FUNCTION public.compute_match_percent(
  company_id uuid,
  candidate_skills text[],
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
        WHEN cardinality(candidate_skills) = 0 THEN 0
        WHEN prefs.about_text = '' THEN 50 -- default score when no preferences
        ELSE GREATEST(20, LEAST(80, 
          20 + (cardinality(candidate_skills) * 10) -- basic skill bonus
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

-- RPC: list profiles with match (filter by variant)
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
      pr.full_name as name,
      pr.avatar_url,
      pr.role,
      pr.city,
      pr.fs,
      pr.seeking,
      COALESCE(pr.skills, '{}'::text[]) as skills,
      compute_match_percent(p_company_id, pr.skills, pr.city) as match
    FROM profiles pr
    WHERE pr.full_name IS NOT NULL
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