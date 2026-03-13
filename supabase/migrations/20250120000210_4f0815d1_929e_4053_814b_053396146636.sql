-- Enable RLS on new tables (if not already enabled)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_follow_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_request_counters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_follow_prefs table first (simpler)
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
CREATE POLICY "follow_request_counters_service_only"
ON follow_request_counters FOR ALL
USING (false)
WITH CHECK (false);