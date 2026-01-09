-- ============================================
-- BRANCH-BASED TAGGING SYSTEM
-- ============================================
-- This migration implements branch-based filtering for:
-- - Feed posts (only same branch OR same school)
-- - People recommendations (only same branch OR same school)
-- - Job posts (only same branch)
-- - Search remains unfiltered (users can actively search across branches)

-- Step 1: Update posts_with_engagement view to include branch information
-- Note: We use the existing posts view (which is based on community_posts) and add branch filtering
-- This maintains consistency with the previous migration (20250120000001_filter_deleted_users_from_feed.sql)
DROP VIEW IF EXISTS posts_with_engagement CASCADE;

CREATE VIEW posts_with_engagement AS
SELECT 
  -- Explicitly list all columns from posts view to avoid ambiguity
  p.id,
  p.author_id,
  p.author_type,
  p.user_id,
  p.company_id,
  p.content,
  p.body_md,
  p.media,
  p.image_url,
  p.post_type,
  p.status,
  p.visibility,
  p.scheduled_at,
  p.published_at,
  p.job_id,
  p.applies_enabled,
  p.cta_label,
  p.cta_url,
  p.promotion_theme,
  p.created_at,
  p.updated_at,
  -- Author profile information for filtering
  pr.branche as author_branche,
  pr.schule as author_schule,
  pr.status as author_status,
  -- Engagement metrics (calculated from post_likes and post_comments tables)
  COALESCE(likes.count, 0)::integer as like_count,
  COALESCE(comments.count, 0)::integer as comment_count,
  (COALESCE(likes.count, 0) * 2 + COALESCE(comments.count, 0) * 3)::integer as engagement_score
FROM posts p
-- Only show posts from users who have a profile (user posts)
-- This ensures deleted users' posts are automatically filtered out
INNER JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_likes 
  GROUP BY post_id
) likes ON p.id = likes.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_comments 
  GROUP BY post_id
) comments ON p.id = comments.post_id
WHERE p.status = 'published'
  AND p.user_id IS NOT NULL;

-- Grant permissions on the view
GRANT SELECT ON posts_with_engagement TO authenticated, anon;

-- Step 2: Create function for feed with branch filtering and follower boost
CREATE OR REPLACE FUNCTION public.get_feed_by_branch(
  p_viewer_id UUID,
  p_limit INT DEFAULT 20,
  p_after_published TIMESTAMPTZ DEFAULT NULL,
  p_after_id UUID DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'relevant'
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  image_url TEXT,
  media JSONB,
  user_id UUID,
  author_type TEXT,
  author_id UUID,
  company_id UUID,
  author_branche TEXT,
  author_schule TEXT,
  created_at TIMESTAMPTZ,
  like_count INTEGER,
  comment_count INTEGER,
  engagement_score INTEGER,
  post_type TEXT,
  job_id UUID,
  applies_enabled BOOLEAN,
  cta_label TEXT,
  cta_url TEXT,
  promotion_theme TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_viewer_branche TEXT;
  v_viewer_schule TEXT;
BEGIN
  -- Get viewer profile information
  SELECT branche, schule INTO v_viewer_branche, v_viewer_schule
  FROM profiles
  WHERE profiles.id = p_viewer_id;
  
  -- If no profile found, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    (pwe.id)::uuid as id,  -- Expliziter Cast und Alias
    pwe.content,
    pwe.image_url,
    pwe.media,
    pwe.user_id,
    pwe.author_type,
    pwe.author_id,
    pwe.company_id,
    pwe.author_branche,
    pwe.author_schule,
    pwe.created_at,
    pwe.like_count,
    pwe.comment_count,
    -- Enhanced engagement score: boost for connections and followed companies
    (
      pwe.engagement_score + 
      CASE 
        -- Boost for user connections
        WHEN EXISTS (
          SELECT 1 FROM connections conn
          WHERE conn.status = 'accepted'
            AND (
              (conn.requester_id = p_viewer_id AND conn.addressee_id = pwe.user_id) OR
              (conn.addressee_id = p_viewer_id AND conn.requester_id = pwe.user_id)
            )
        ) THEN 50
        -- Boost for followed companies
        WHEN pwe.company_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f
          WHERE f.follower_type = 'profile'
            AND f.follower_id = p_viewer_id
            AND f.followee_type = 'company'
            AND f.followee_id = pwe.company_id
            AND f.status = 'accepted'
        ) THEN 50
        ELSE 0
      END
    )::integer as engagement_score,
    pwe.post_type,
    pwe.job_id,
    pwe.applies_enabled,
    pwe.cta_label,
    pwe.cta_url,
    pwe.promotion_theme
  FROM posts_with_engagement pwe
  WHERE 
    -- WICHTIG: Nur Posts zeigen, die eine der folgenden Bedingungen erfüllen:
    (
      -- Bedingung 0: Eigene Posts - IMMER anzeigen
      (pwe.author_type = 'user' AND pwe.user_id = p_viewer_id)
      OR
      -- Bedingung 1: User Posts - nur wenn gleiche Branche ODER gleiche Schule ODER Connection
      (
        pwe.author_type = 'user' 
        AND pwe.user_id IS NOT NULL
        AND pwe.user_id != p_viewer_id  -- Nicht eigene Posts
        AND (
          -- Gleiche Branche (beide müssen gesetzt sein und gleich)
          (
            v_viewer_branche IS NOT NULL 
            AND v_viewer_branche != '' 
            AND pwe.author_branche IS NOT NULL
            AND pwe.author_branche != ''
            AND pwe.author_branche = v_viewer_branche
          )
          OR
          -- Gleiche Schule (Ausnahme: auch bei unterschiedlicher Branche)
          (
            v_viewer_schule IS NOT NULL 
            AND v_viewer_schule != '' 
            AND pwe.author_schule IS NOT NULL 
            AND pwe.author_schule != ''
            AND pwe.author_schule = v_viewer_schule
          )
          OR
          -- Connection (auch bei unterschiedlicher Branche)
          EXISTS (
            SELECT 1 FROM connections conn
            WHERE conn.status = 'accepted'
              AND (
                (conn.requester_id = p_viewer_id AND conn.addressee_id = pwe.user_id) OR
                (conn.addressee_id = p_viewer_id AND conn.requester_id = pwe.user_id)
              )
          )
        )
      )
      OR
      -- Bedingung 2: Company Posts - nur wenn gefolgt ODER gleiche Branche
      (
        pwe.author_type = 'company' 
        AND pwe.company_id IS NOT NULL 
        AND (
          -- Gefolgtes Unternehmen
          EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_type = 'profile'
              AND f.follower_id = p_viewer_id
              AND f.followee_type = 'company'
              AND f.followee_id = pwe.company_id
              AND f.status = 'accepted'
          )
          OR
          -- Gleiche Branche
          (
            v_viewer_branche IS NOT NULL 
            AND v_viewer_branche != '' 
            AND EXISTS (
              SELECT 1 FROM companies c
              WHERE c.id = pwe.company_id
                AND c.industry IS NOT NULL
                AND c.industry != ''
                AND c.industry = v_viewer_branche
            )
          )
        )
      )
    )
    -- Pagination - explizite Qualifizierung
    AND (
      (p_after_published IS NULL AND p_after_id IS NULL)
      OR (pwe.created_at, (pwe.id)::uuid) < (p_after_published, p_after_id::uuid)
    )
  ORDER BY 
    CASE WHEN p_sort_by = 'newest' THEN pwe.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'relevant' THEN (
      pwe.engagement_score + 
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM connections conn2
          WHERE conn2.status = 'accepted'
            AND (
              (conn2.requester_id = p_viewer_id AND conn2.addressee_id = pwe.user_id) OR
              (conn2.addressee_id = p_viewer_id AND conn2.requester_id = pwe.user_id)
            )
        ) THEN 50
        WHEN pwe.company_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f2
          WHERE f2.follower_type = 'profile'
            AND f2.follower_id = p_viewer_id
            AND f2.followee_type = 'company'
            AND f2.followee_id = pwe.company_id
            AND f2.status = 'accepted'
        ) THEN 50
        ELSE 0
      END
    ) END DESC NULLS LAST,
    pwe.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Step 3: Update suggest_people function for branch filtering
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
      AND p.profile_complete = true  -- Changed: Show all complete profiles to regular users (not just published ones)
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

-- Step 4: Create function for jobs filtered by branch
CREATE OR REPLACE FUNCTION public.get_jobs_by_branch(
  p_viewer_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_id UUID,
  company_name TEXT,
  branche TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_viewer_branche TEXT;
BEGIN
  SELECT branche INTO v_viewer_branche
  FROM profiles
  WHERE profiles.id = p_viewer_id;
  
  IF v_viewer_branche IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    jp.id,
    jp.title,
    jp.company_id,
    c.name as company_name,
    jp.branche,
    jp.created_at
  FROM job_posts jp
  LEFT JOIN companies c ON jp.company_id = c.id
  WHERE jp.branche = v_viewer_branche
    AND jp.status = 'published'
  ORDER BY jp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_feed_by_branch(UUID, INT, TIMESTAMPTZ, UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_jobs_by_branch(UUID, INT, INT) TO authenticated, anon;

-- Step 6: Add comment for documentation
COMMENT ON FUNCTION public.get_feed_by_branch IS 'Returns feed posts filtered by branch (same branch OR same school OR connections/followed companies)';
COMMENT ON FUNCTION public.get_jobs_by_branch IS 'Returns job posts filtered by branch';
COMMENT ON FUNCTION public.suggest_people IS 'Returns people suggestions filtered by branch (same branch OR same school)';

