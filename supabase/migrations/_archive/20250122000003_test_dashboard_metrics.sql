-- Test query to verify dashboard metrics are working
-- Run this in Supabase SQL Editor to check if data exists

-- Replace 'YOUR_COMPANY_ID' with your actual company ID
-- Example: SELECT * FROM get_company_dashboard_metrics('123e4567-e89b-12d3-a456-426614174000');

-- Check unlocked profiles
SELECT 
  id,
  candidate_id,
  status,
  unlocked_at,
  company_id
FROM company_candidates
WHERE company_id = 'YOUR_COMPANY_ID'
ORDER BY unlocked_at DESC
LIMIT 10;

-- Test the dashboard metrics function
SELECT get_company_dashboard_metrics('YOUR_COMPANY_ID');

