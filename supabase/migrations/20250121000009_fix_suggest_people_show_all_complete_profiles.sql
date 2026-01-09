-- Fix suggest_people function to show all complete profiles to regular users
-- Previously, it only showed profiles with profile_published = true
-- Now it shows all profiles with profile_complete = true
-- This allows regular users to see and connect with all complete profiles,
-- not just those published for companies

CREATE OR REPLACE FUNCTION public.suggest_people(
  p_viewer UUID,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT,
  branche TEXT,
  ort TEXT,
  score NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH
  blocked AS (
    SELECT addressee_id as id FROM connections WHERE requester_id = p_viewer
    UNION
    SELECT requester_id FROM connections WHERE addressee_id = p_viewer
    UNION
    SELECT target_id FROM suggestions_history
     WHERE profile_id = p_viewer AND target_type = 'profile'
       AND last_seen_at > NOW() - INTERVAL '24 hours'
    UNION
    SELECT p_viewer
  ),
  viewer_profile AS (
    SELECT 
      COALESCE(branche, '') as u_branche,
      COALESCE(ausbildungsberuf, '') as u_track,
      COALESCE(status, '') as u_status,
      COALESCE(ort, '') as u_ort,
      COALESCE(schule, '') as u_schule
    FROM profiles WHERE profiles.id = p_viewer
  ),
  base AS (
    SELECT 
      p.id,
      NULLIF(TRIM(COALESCE(p.vorname, '') || ' ' || COALESCE(p.nachname, '')), '') as display_name,
      p.avatar_url,
      p.status,
      p.branche,
      p.ort,
      (
        -- Branch match: 50 points
        CASE WHEN p.branche = vp.u_branche THEN 50 ELSE 0 END
        +
        -- Same school: 30 points (exception rule)
        CASE WHEN p.schule IS NOT NULL 
             AND vp.u_schule IS NOT NULL 
             AND p.schule = vp.u_schule 
             AND p.schule != ''
             THEN 30 ELSE 0 END
        +
        -- Status match: 25 points
        CASE WHEN p.status = vp.u_status THEN 25 ELSE 0 END
        +
        -- Mutual connections: max 15 points
        LEAST(15, COALESCE((
          SELECT 3 * COUNT(*) 
          FROM connections c1
          WHERE c1.status = 'accepted' AND (
            (c1.requester_id = p_viewer AND c1.addressee_id IN (
              SELECT CASE WHEN c2.requester_id = p.id THEN c2.addressee_id ELSE c2.requester_id END
              FROM connections c2
              WHERE (c2.requester_id = p.id OR c2.addressee_id = p.id) AND c2.status = 'accepted'
            ))
            OR
            (c1.addressee_id = p_viewer AND c1.requester_id IN (
              SELECT CASE WHEN c2.requester_id = p.id THEN c2.addressee_id ELSE c2.requester_id END
              FROM connections c2
              WHERE (c2.requester_id = p.id OR c2.addressee_id = p.id) AND c2.status = 'accepted'
            ))
          )
        ), 0))
        +
        -- Location match: 10 points
        CASE WHEN COALESCE(p.ort, '') = vp.u_ort THEN 10 ELSE 0 END
      ) as score
    FROM profiles p
    CROSS JOIN viewer_profile vp
    WHERE p.id NOT IN (SELECT blocked.id FROM blocked)
      AND p.profile_complete = true  -- Changed: Show all complete profiles (not just published ones)
      -- IMPORTANT: Only suggest profiles from same branch OR same school
      AND (
        p.branche = vp.u_branche
        OR
        (
          p.schule IS NOT NULL 
          AND vp.u_schule IS NOT NULL 
          AND p.schule = vp.u_schule
          AND p.schule != ''
        )
      )
  )
  SELECT * FROM base
  ORDER BY score DESC, RANDOM()
  LIMIT GREATEST(1, p_limit);
$$;

-- Update comment
COMMENT ON FUNCTION public.suggest_people IS 'Returns people suggestions filtered by branch (same branch OR same school). Shows all complete profiles to regular users, not just published ones.';

