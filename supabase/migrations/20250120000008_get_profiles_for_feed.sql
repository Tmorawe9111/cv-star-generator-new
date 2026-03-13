-- ============================================
-- RPC Function: Get Profiles for Feed
-- ============================================
-- Diese Funktion lädt Profile für den Feed und umgeht RLS-Probleme
-- Sie gibt nur Profile zurück, die in posts_with_engagement existieren
-- (also nur Profile von Nutzern, die Posts haben)

CREATE OR REPLACE FUNCTION public.get_profiles_for_feed(
  p_user_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  vorname TEXT,
  nachname TEXT,
  avatar_url TEXT,
  headline TEXT,
  employer_free TEXT,
  aktueller_beruf TEXT,
  ausbildungsberuf TEXT,
  ausbildungsbetrieb TEXT,
  company_name TEXT,
  profile_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Diese Funktion umgeht RLS, da sie SECURITY DEFINER ist
  -- Sie gibt nur Profile zurück, die in posts_with_engagement existieren
  -- (also nur Profile von Nutzern, die veröffentlichte Posts haben)
  RETURN QUERY
  SELECT DISTINCT
    pr.id,
    pr.vorname,
    pr.nachname,
    pr.avatar_url,
    pr.headline,
    pr.employer_free,
    pr.aktueller_beruf,
    pr.ausbildungsberuf,
    pr.ausbildungsbetrieb,
    pr.company_name,
    pr.profile_slug
  FROM profiles pr
  WHERE pr.id = ANY(p_user_ids)
    -- Nur Profile, die in posts_with_engagement existieren (haben veröffentlichte Posts)
    AND EXISTS (
      SELECT 1
      FROM posts_with_engagement pwe
      WHERE pwe.user_id = pr.id
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_profiles_for_feed(UUID[]) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.get_profiles_for_feed IS 'Returns profiles for feed posts, bypassing RLS. Only returns profiles that have published posts.';

