-- RPC: Unfollow Company (Profile unfollows Company)
CREATE OR REPLACE FUNCTION unfollow_company(p_profile_id uuid, p_company_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM follows
  WHERE follower_type = 'profile'
    AND follower_id = p_profile_id
    AND followee_type = 'company'
    AND followee_id = p_company_id;
$$;

-- RPC: Suggest Companies for Profile (with reasons)
CREATE OR REPLACE FUNCTION suggest_companies_for_profile(p_profile_id uuid, p_limit int DEFAULT 12)
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
AS $$
BEGIN
  RETURN QUERY
  WITH
  me AS (
    SELECT p.id, p.location_city AS city, 25 AS location_radius_km
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
    SELECT f.followee_id AS company_id, count(*) AS friend_count
    FROM follows f
    JOIN friends fr ON fr.friend_profile_id = f.follower_id
    WHERE f.follower_type='profile' AND f.followee_type='company' AND f.status='accepted'
    GROUP BY f.followee_id
  ),
  base AS (
    SELECT c.id, c.name, c.logo_url, c.industry, c.main_location AS city,
      COALESCE(sc.friend_count, 0) AS friend_count,
      array_remove(array[
        CASE WHEN sc.friend_count > 0 THEN (sc.friend_count::text || ' Freunde folgen') END,
        CASE WHEN c.industry IS NOT NULL THEN ('Branche: '||c.industry) END,
        CASE WHEN c.main_location IS NOT NULL THEN ('Ort: '||c.main_location) END
      ], null) AS reasons
    FROM companies c
    LEFT JOIN social_companies sc ON sc.company_id = c.id
    WHERE c.account_status = 'active'
      AND NOT EXISTS (SELECT 1 FROM my_follows mf WHERE mf.company_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM pending_block pb WHERE pb.company_id = c.id)
    ORDER BY sc.friend_count DESC NULLS LAST, c.created_at DESC
    LIMIT p_limit
  )
  SELECT * FROM base;
END;
$$;