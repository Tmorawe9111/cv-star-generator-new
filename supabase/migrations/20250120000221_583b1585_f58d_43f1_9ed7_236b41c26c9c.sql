-- Update RPC function to return only first names (anonymous)
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
      COALESCE(pr.vorname, 'Anonym') as name, -- Only first name, no last name for anonymity
      NULL::text as avatar_url, -- No avatar for anonymity
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