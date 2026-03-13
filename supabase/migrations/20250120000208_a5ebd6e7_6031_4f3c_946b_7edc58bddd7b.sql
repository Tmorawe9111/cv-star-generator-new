-- Enable RLS on all new tables
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_follow_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_request_counters ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has company access
CREATE OR REPLACE FUNCTION has_company_access(check_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM company_users cu
    WHERE cu.user_id = auth.uid()
    AND cu.company_id = check_company_id
    AND cu.role IN ('admin', 'editor')
  );
$$;

-- RLS Policies for follows table
-- Participants can view their follows
CREATE POLICY "follows_participants_can_select"
ON follows FOR SELECT
USING (
  (follower_type = 'profile' AND follower_id = auth.uid()) OR
  (followee_type = 'profile' AND followee_id = auth.uid()) OR
  (follower_type = 'company' AND has_company_access(follower_id)) OR
  (followee_type = 'company' AND has_company_access(followee_id))
);

-- Only follower can create follow relationships
CREATE POLICY "follows_follower_can_insert"
ON follows FOR INSERT
WITH CHECK (
  (follower_type = 'profile' AND follower_id = auth.uid()) OR
  (follower_type = 'company' AND has_company_access(follower_id))
);

-- Participants can update follow status (accept/reject)
CREATE POLICY "follows_participants_can_update"
ON follows FOR UPDATE
USING (
  (follower_type = 'profile' AND follower_id = auth.uid()) OR
  (followee_type = 'profile' AND followee_id = auth.uid()) OR
  (follower_type = 'company' AND has_company_access(follower_id)) OR
  (followee_type = 'company' AND has_company_access(followee_id))
);

-- Follower can delete (unfollow)
CREATE POLICY "follows_follower_can_delete"
ON follows FOR DELETE
USING (
  (follower_type = 'profile' AND follower_id = auth.uid()) OR
  (follower_type = 'company' AND has_company_access(follower_id))
);

-- RLS Policies for company_follow_prefs table
-- Only profile owner can manage their notification preferences
CREATE POLICY "company_follow_prefs_owner_select"
ON company_follow_prefs FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "company_follow_prefs_owner_insert"
ON company_follow_prefs FOR INSERT
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "company_follow_prefs_owner_update"
ON company_follow_prefs FOR UPDATE
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "company_follow_prefs_owner_delete"
ON company_follow_prefs FOR DELETE
USING (profile_id = auth.uid());

-- RLS Policies for follow_request_counters (service only)
-- This table should only be accessible by Edge Functions with service role
CREATE POLICY "follow_request_counters_service_only"
ON follow_request_counters FOR ALL
USING (false)
WITH CHECK (false);