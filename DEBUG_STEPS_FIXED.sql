-- ============================================
-- DEBUG STEPS - FIXED VERSION
-- ============================================
-- WICHTIG: Die UUID muss IMMER in Anführungszeichen stehen!
-- Beispiel: 'a9b285ac-89c6-42ea-bdae-4dd85ab5801a'
-- ============================================

-- Step 1: Company-ID prüfen (falls noch nicht bekannt)
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.selected_plan_id
FROM companies c
ORDER BY c.created_at DESC
LIMIT 5;

-- ============================================
-- Step 2: Company_candidates Einträge prüfen
-- ============================================
-- Ersetze die UUID unten mit deiner Company-ID (mit Anführungszeichen!)
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
WHERE cc.company_id = 'a9b285ac-89c6-42ea-bdae-4dd85ab5801a'  -- <-- Deine Company-ID (mit Anführungszeichen!)
ORDER BY cc.updated_at DESC
LIMIT 20;

-- ============================================
-- Step 3: Status-Verteilung prüfen
-- ============================================
SELECT 
  status,
  COUNT(*) as count
FROM company_candidates
WHERE company_id = 'a9b285ac-89c6-42ea-bdae-4dd85ab5801a'  -- <-- Deine Company-ID (mit Anführungszeichen!)
GROUP BY status
ORDER BY count DESC;

-- ============================================
-- Step 4: Unlocked-Profiles Logik testen
-- ============================================
SELECT 
  COUNT(*)::integer as count,
  'Total rows' as description
FROM company_candidates
WHERE company_id = 'a9b285ac-89c6-42ea-bdae-4dd85ab5801a'  -- <-- Deine Company-ID (mit Anführungszeichen!)
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With status FREIGESCHALTET'
FROM company_candidates
WHERE company_id = 'a9b285ac-89c6-42ea-bdae-4dd85ab5801a'
  AND status = 'FREIGESCHALTET'
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With unlocked_at'
FROM company_candidates
WHERE company_id = 'a9b285ac-89c6-42ea-bdae-4dd85ab5801a'
  AND unlocked_at IS NOT NULL
UNION ALL
SELECT 
  COUNT(*)::integer,
  'With status OR unlocked_at (function logic)'
FROM company_candidates
WHERE company_id = 'a9b285ac-89c6-42ea-bdae-4dd85ab5801a'
  AND (
    status IN ('FREIGESCHALTET', 'INTERVIEW_GEPLANT', 'INTERVIEW_DURCHGEFÜHRT', 'ANGEBOT_GESENDET', 'EINGESTELLT')
    OR unlocked_at IS NOT NULL
  );

-- ============================================
-- Step 5: RPC-Funktion direkt testen
-- ============================================
SELECT get_company_dashboard_metrics('a9b285ac-89c6-42ea-bdae-4dd85ab5801a'::uuid) as metrics;

