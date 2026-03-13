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