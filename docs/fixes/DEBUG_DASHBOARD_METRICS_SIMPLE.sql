-- Alternative Debug Queries - ohne auth.uid()
-- Führe diese Queries aus, um deine Company-ID zu finden

-- Step 1a: Finde alle Companies (ohne User-Filter)
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.selected_plan_id,
  COUNT(cu.id) as user_count
FROM companies c
LEFT JOIN company_users cu ON cu.company_id = c.id
GROUP BY c.id, c.name, c.selected_plan_id
ORDER BY c.created_at DESC
LIMIT 10;

-- Step 1b: Finde deine Company über deine E-Mail (ersetze DEINE_EMAIL)
-- SELECT 
--   cu.company_id,
--   c.name as company_name,
--   cu.user_id,
--   u.email
-- FROM company_users cu
-- JOIN companies c ON c.id = cu.company_id
-- JOIN auth.users u ON u.id = cu.user_id
-- WHERE u.email = 'DEINE_EMAIL_HIER'
-- LIMIT 1;

-- Step 2: Wenn du deine company_id hast, teste diese Query
-- (Ersetze 'DEINE_COMPANY_ID' mit der ID aus Step 1a)
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
WHERE cc.company_id = 'DEINE_COMPANY_ID'  -- <-- HIER die company_id eintragen!
ORDER BY cc.updated_at DESC
LIMIT 20;

-- Step 3: Status-Verteilung (ersetze DEINE_COMPANY_ID)
SELECT 
  status,
  COUNT(*) as count
FROM company_candidates
WHERE company_id = 'DEINE_COMPANY_ID'  -- <-- HIER die company_id eintragen!
GROUP BY status
ORDER BY count DESC;

-- Step 4: Test unlocked_profiles Logik (ersetze DEINE_COMPANY_ID)
SELECT 
  COUNT(*)::integer as count,
  'Total rows' as description
FROM company_candidates
WHERE company_id = 'DEINE_COMPANY_ID'  -- <-- HIER die company_id eintragen!
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With status FREIGESCHALTET'
FROM company_candidates
WHERE company_id = 'DEINE_COMPANY_ID'
  AND status = 'FREIGESCHALTET'
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With unlocked_at'
FROM company_candidates
WHERE company_id = 'DEINE_COMPANY_ID'
  AND unlocked_at IS NOT NULL
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With status OR unlocked_at (function logic)'
FROM company_candidates
WHERE company_id = 'DEINE_COMPANY_ID'
  AND (
    status IN ('FREIGESCHALTET', 'INTERVIEW_GEPLANT', 'INTERVIEW_DURCHGEFÜHRT', 'ANGEBOT_GESENDET', 'EINGESTELLT')
    OR unlocked_at IS NOT NULL
  );

-- Step 5: Test die RPC-Funktion direkt (ersetze DEINE_COMPANY_ID)
SELECT get_company_dashboard_metrics('DEINE_COMPANY_ID'::uuid) as metrics;

