-- Employment requests table
CREATE TABLE IF NOT EXISTS company_employment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending','accepted','declined')) DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_by uuid REFERENCES profiles(id),
  UNIQUE(user_id, company_id)
);

-- Add current company reference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_company_id uuid REFERENCES companies(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_to_work boolean DEFAULT false;

-- View for company conversion metrics
CREATE OR REPLACE VIEW company_conversion AS
SELECT
  company_id,
  count(*) FILTER (WHERE status='accepted')::int AS total_accepted,
  count(*) FILTER (WHERE status='pending')::int AS total_pending,
  count(*) FILTER (WHERE status='declined')::int AS total_declined,
  count(*)::int AS total_requests,
  CASE WHEN count(*) = 0 THEN 0
       ELSE round((count(*) FILTER (WHERE status='accepted'))::numeric
                 / greatest(count(*),1) * 100, 2) END AS conversion_rate_percent
FROM company_employment_requests
GROUP BY company_id;

-- Enable RLS
ALTER TABLE company_employment_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "req_insert_self" ON company_employment_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own requests
CREATE POLICY "req_select_self" ON company_employment_requests
FOR SELECT USING (auth.uid() = user_id);

-- Company admins can read requests for their company
CREATE POLICY "req_company_admin_read" ON company_employment_requests
FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_users cu
          WHERE cu.company_id = company_employment_requests.company_id
            AND cu.user_id = auth.uid()
            AND cu.role IN ('admin', 'editor'))
);

-- Company admins can update requests for their company
CREATE POLICY "req_company_admin_update" ON company_employment_requests
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM company_users cu
          WHERE cu.company_id = company_employment_requests.company_id
            AND cu.user_id = auth.uid()
            AND cu.role IN ('admin', 'editor'))
);

-- Function to handle employment request acceptance
CREATE OR REPLACE FUNCTION handle_employment_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to accepted, update the user's current company
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE profiles 
    SET current_company_id = NEW.company_id 
    WHERE id = NEW.user_id;
    
    -- Set confirmed_by to the current user
    NEW.confirmed_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for employment acceptance
CREATE TRIGGER on_employment_accepted
  BEFORE UPDATE ON company_employment_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_employment_acceptance();