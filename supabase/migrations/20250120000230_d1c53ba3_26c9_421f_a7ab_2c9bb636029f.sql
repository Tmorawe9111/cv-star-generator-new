-- Fix Security Issues - Drop and Recreate Functions
-- ==============================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS suggest_companies_for_profile(uuid, integer);
DROP FUNCTION IF EXISTS suggest_companies(uuid, integer);
DROP FUNCTION IF EXISTS viewer_first_degree(uuid);
DROP FUNCTION IF EXISTS viewer_second_degree(uuid);

-- Fix 1: Convert security definer view to regular view
DROP VIEW IF EXISTS company_need_quota;
CREATE VIEW company_need_quota AS
SELECT 
  c.id AS company_id,
  COALESCE(cp.included_needs, 0) AS included_needs,
  COALESCE(c.need_credits, 0) AS need_credits,
  (SELECT COUNT(*) FROM company_needs n WHERE n.company_id = c.id AND n.visibility = 'active') AS used_needs,
  GREATEST(0, 
    COALESCE(cp.included_needs, 0) + COALESCE(c.need_credits, 0) 
    - (SELECT COUNT(*) FROM company_needs n WHERE n.company_id = c.id AND n.visibility = 'active')
  ) AS remaining_needs
FROM companies c
LEFT JOIN company_packages cp ON cp.id = c.package_id;

-- Enable RLS on the view (create a function to access it with RLS)
CREATE OR REPLACE FUNCTION get_company_need_quota(p_company_id UUID)
RETURNS TABLE (
  company_id UUID,
  included_needs INTEGER,
  need_credits INTEGER,
  used_needs BIGINT,
  remaining_needs INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cnq.company_id,
    cnq.included_needs,
    cnq.need_credits,
    cnq.used_needs,
    cnq.remaining_needs
  FROM company_need_quota cnq
  WHERE cnq.company_id = p_company_id
    AND has_company_access(p_company_id);
$$;

-- Recreate suggest_companies_for_profile with proper search_path
CREATE OR REPLACE FUNCTION suggest_companies_for_profile(p_profile_id uuid, p_limit integer DEFAULT 12)
RETURNS TABLE (
  id uuid,
  name text,
  logo_url text,
  industry text,
  city text,
  friend_count integer,
  reasons text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH
  me AS (
    SELECT p.id, p.ort AS city, 25 AS location_radius_km
    FROM profiles p WHERE p.id = p_profile_id
  ),
  my_follows AS (
    -- Companies I already follow
    SELECT followee_id AS company_id
    FROM follows
    WHERE follower_type='profile' AND follower_id=p_profile_id AND followee_type='company' AND status='accepted'
  ),
  pending_block AS (
    -- Exclude open/rejected requests recently
    SELECT followee_id AS company_id
    FROM follows
    WHERE follower_type='profile' AND follower_id=p_profile_id AND followee_type='company'
      AND status IN ('pending','rejected')
      AND created_at > now() - interval '30 days'
  ),
  friends AS (
    -- Simple "friends": Profiles I follow (Profile->Profile)
    SELECT followee_id AS friend_profile_id
    FROM follows
    WHERE follower_type='profile' AND follower_id=p_profile_id AND followee_type='profile' AND status='accepted'
  ),
  social_companies AS (
    -- Companies my friends follow (Profile->Company)
    SELECT f.followee_id AS company_id, count(*)::int AS friend_count
    FROM follows f
    JOIN friends fr ON fr.friend_profile_id = f.follower_id
    WHERE f.follower_type='profile' AND f.followee_type='company' AND f.status='accepted'
    GROUP BY f.followee_id
  ),
  base AS (
    SELECT 
      c.id,
      c.name,
      c.logo_url,
      c.industry,
      c.main_location AS city,
      COALESCE(sc.friend_count, 0)::int AS friend_count,
      array_remove(array[
        CASE WHEN COALESCE(sc.friend_count, 0) > 0 THEN (COALESCE(sc.friend_count,0)::text || ' Freunde folgen') END,
        CASE WHEN c.industry IS NOT NULL THEN ('Branche: '||c.industry) END,
        CASE WHEN c.main_location IS NOT NULL THEN ('Ort: '||c.main_location) END
      ], null) AS reasons
    FROM companies c
    LEFT JOIN social_companies sc ON sc.company_id = c.id
    WHERE c.account_status = 'active'
      AND NOT EXISTS (SELECT 1 FROM my_follows mf WHERE mf.company_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM pending_block pb WHERE pb.company_id = c.id)
    ORDER BY COALESCE(sc.friend_count, 0) DESC NULLS LAST, c.created_at DESC
    LIMIT p_limit
  )
  SELECT * FROM base;
END;
$$;

-- Recreate suggest_companies with proper search_path
CREATE OR REPLACE FUNCTION suggest_companies(p_profile_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  name text,
  logo_url text,
  industry text,
  city text,
  reasons text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.logo_url,
    c.industry,
    c.main_location AS city,
    ARRAY['Empfohlen für Sie'] AS reasons
  FROM companies c
  WHERE c.account_status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM follows f 
      WHERE f.follower_type = 'profile' 
        AND f.follower_id = p_profile_id 
        AND f.followee_type = 'company' 
        AND f.followee_id = c.id
    )
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Recreate viewer_first_degree with proper search_path
CREATE OR REPLACE FUNCTION viewer_first_degree(user_id uuid)
RETURNS TABLE (profile_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.followee_id AS profile_id
  FROM follows f
  WHERE f.follower_type = 'profile'
    AND f.follower_id = user_id
    AND f.followee_type = 'profile'
    AND f.status = 'accepted';
$$;

-- Recreate viewer_second_degree with proper search_path
CREATE OR REPLACE FUNCTION viewer_second_degree(user_id uuid)
RETURNS TABLE (profile_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT f2.followee_id AS profile_id
  FROM follows f1
  JOIN follows f2 ON f1.followee_id = f2.follower_id
  WHERE f1.follower_type = 'profile'
    AND f1.follower_id = user_id
    AND f1.followee_type = 'profile'
    AND f1.status = 'accepted'
    AND f2.follower_type = 'profile'
    AND f2.followee_type = 'profile'
    AND f2.status = 'accepted'
    AND f2.followee_id != user_id
    AND f2.followee_id NOT IN (
      SELECT f3.followee_id
      FROM follows f3
      WHERE f3.follower_type = 'profile'
        AND f3.follower_id = user_id
        AND f3.followee_type = 'profile'
        AND f3.status = 'accepted'
    );
$$;

-- Ensure RLS is enabled on all our new tables
DO $$
DECLARE
    tbl_name TEXT;
    tbl_names TEXT[] := ARRAY[
        'company_packages', 'company_purchases', 'company_needs', 'need_skills', 
        'need_licenses', 'need_languages', 'need_target_groups', 'candidate_profiles',
        'candidate_skills', 'candidate_licenses', 'candidate_languages', 'need_matches'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY tbl_names
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
    END LOOP;
END
$$;