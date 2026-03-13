-- Add freeze tracking and auto-freeze trigger for companies

-- Add frozen_at and frozen_reason columns to companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS frozen_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS frozen_reason text;

-- Function to auto-freeze companies after 24h if not verified
CREATE OR REPLACE FUNCTION auto_freeze_unverified_companies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE companies
  SET 
    account_status = 'frozen',
    frozen_at = now(),
    frozen_reason = 'Not verified within 24 hours of registration'
  WHERE 
    account_status = 'pending'
    AND created_at < (now() - interval '24 hours')
    AND frozen_at IS NULL;
END;
$$;

-- Create view for company unlock statistics
CREATE OR REPLACE VIEW company_unlock_stats AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(DISTINCT cc.candidate_id) FILTER (WHERE cc.unlocked_at IS NOT NULL) as unlocked_count,
  COUNT(DISTINCT cc.candidate_id) as total_candidates,
  COUNT(DISTINCT a.id) as total_applications,
  COALESCE(SUM(CASE WHEN cc.unlocked_at IS NOT NULL THEN 1 ELSE 0 END), 0) as profiles_unlocked,
  c.active_tokens,
  c.token_balance
FROM companies c
LEFT JOIN company_candidates cc ON cc.company_id = c.id
LEFT JOIN applications a ON a.company_id = c.id
GROUP BY c.id, c.name, c.active_tokens, c.token_balance;

-- Grant access to authenticated users
GRANT SELECT ON company_unlock_stats TO authenticated;