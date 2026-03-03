-- Debug Query: Check if dashboard metrics are working
-- Run these queries ONE BY ONE in Supabase SQL Editor

-- Step 0: Get your company ID (run this first)
SELECT 
  cu.company_id,
  c.name as company_name
FROM company_users cu
JOIN companies c ON c.id = cu.company_id
WHERE cu.user_id = auth.uid()
LIMIT 1;

-- Step 1: Check ALL company_candidates (no filters)
SELECT 
  cc.id,
  cc.candidate_id,
  cc.status,
  cc.stage,
  cc.unlocked_at,
  cc.company_id,
  p.vorname,
  p.nachname
FROM company_candidates cc
LEFT JOIN profiles p ON p.id = cc.candidate_id
WHERE cc.company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
ORDER BY cc.updated_at DESC
LIMIT 20;

-- Step 2: Check what status values exist
SELECT 
  status,
  COUNT(*) as count
FROM company_candidates
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
GROUP BY status
ORDER BY count DESC;

-- Step 3: Check unlocked_at values
SELECT 
  CASE 
    WHEN unlocked_at IS NOT NULL THEN 'Has unlocked_at'
    ELSE 'No unlocked_at'
  END as unlock_status,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'FREIGESCHALTET' THEN 1 END) as with_status_freigeschaltet,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as with_status_null
FROM company_candidates
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
GROUP BY unlock_status;

-- Step 4: Test the unlocked_profiles function manually
SELECT 
  COUNT(*)::integer as count,
  'Total rows' as description
FROM company_candidates
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With status FREIGESCHALTET'
FROM company_candidates
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
  AND status = 'FREIGESCHALTET'
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With unlocked_at'
FROM company_candidates
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
  AND unlocked_at IS NOT NULL
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With status IN list'
FROM company_candidates
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
  AND status IN ('FREIGESCHALTET', 'INTERVIEW_GEPLANT', 'INTERVIEW_DURCHGEFÜHRT', 'ANGEBOT_GESENDET', 'EINGESTELLT')
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With status OR unlocked_at (function logic)'
FROM company_candidates
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
  AND (
    status IN ('FREIGESCHALTET', 'INTERVIEW_GEPLANT', 'INTERVIEW_DURCHGEFÜHRT', 'ANGEBOT_GESENDET', 'EINGESTELLT')
    OR unlocked_at IS NOT NULL
  );

-- Step 5: Check job_posts
SELECT 
  id,
  title,
  status,
  is_active,
  company_id
FROM job_posts
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
ORDER BY created_at DESC
LIMIT 10;

-- Step 6: Check applications
SELECT 
  COUNT(*) as total_applications
FROM applications
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1);

-- Step 7: Check company_users (seats)
SELECT 
  COUNT(*) as seats_used
FROM company_users
WHERE company_id = (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1)
  AND accepted_at IS NOT NULL;
