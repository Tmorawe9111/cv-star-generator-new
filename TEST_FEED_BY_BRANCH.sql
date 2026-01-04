-- ============================================
-- TEST SCRIPT: get_feed_by_branch Funktion
-- ============================================
-- Dieses Script testet die get_feed_by_branch Funktion
-- und zeigt, welche Posts für einen bestimmten User zurückgegeben werden

-- Schritt 1: Zeige alle verfügbaren Posts mit Branche-Informationen
SELECT 
  '=== ALLE POSTS MIT BRANCHE-INFO ===' as test_section;

SELECT 
  p.id as post_id,
  p.user_id,
  pr.vorname || ' ' || pr.nachname as author_name,
  pr.branche as author_branche,
  pr.schule as author_schule,
  p.content,
  p.created_at,
  p.status
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'published'
  AND p.user_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 20;

-- Schritt 2: Zeige Viewer-Profile-Informationen
SELECT 
  '=== VIEWER PROFILE INFO ===' as test_section;

SELECT 
  id,
  vorname || ' ' || nachname as name,
  branche,
  schule,
  status
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- Schritt 3: Teste get_feed_by_branch für einen spezifischen User
-- Ersetze 'USER_ID_HIER' mit einer echten User-ID aus deiner Datenbank
SELECT 
  '=== TEST: get_feed_by_branch für User ===' as test_section;

-- Beispiel: Teste für den ersten User mit Branche 'gesundheit'
DO $$
DECLARE
  test_user_id UUID;
  test_branche TEXT;
BEGIN
  -- Finde einen User mit Branche 'gesundheit'
  SELECT id, branche INTO test_user_id, test_branche
  FROM profiles
  WHERE branche = 'gesundheit'
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Kein User mit Branche "gesundheit" gefunden. Teste mit erstem verfügbaren User.';
    SELECT id, branche INTO test_user_id, test_branche
    FROM profiles
    WHERE branche IS NOT NULL
    LIMIT 1;
  END IF;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Kein User mit Branche gefunden. Bitte manuell eine User-ID angeben.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Teste mit User ID: %, Branche: %', test_user_id, test_branche;
  
  -- Zeige die Ergebnisse
  RAISE NOTICE '=== ERGEBNISSE VON get_feed_by_branch ===';
END $$;

-- Schritt 4: Manueller Test - Ersetze 'YOUR_USER_ID' mit deiner User-ID
SELECT 
  '=== MANUELLER TEST: Ersetze YOUR_USER_ID ===' as test_section;

-- Führe diese Query aus und ersetze 'YOUR_USER_ID' mit deiner tatsächlichen User-ID
/*
SELECT 
  pwe.id,
  pwe.content,
  pwe.user_id,
  pwe.author_branche,
  pwe.author_schule,
  pwe.created_at,
  pwe.like_count,
  pwe.comment_count
FROM posts_with_engagement pwe
WHERE 
  (pwe.author_type = 'user' AND pwe.user_id = 'YOUR_USER_ID')
  OR
  (
    pwe.author_type = 'user' 
    AND pwe.user_id != 'YOUR_USER_ID'
    AND (
      (pwe.author_branche = (SELECT branche FROM profiles WHERE id = 'YOUR_USER_ID'))
      OR
      EXISTS (
        SELECT 1 FROM connections conn
        WHERE conn.status = 'accepted'
          AND (
            (conn.requester_id = 'YOUR_USER_ID' AND conn.addressee_id = pwe.user_id) OR
            (conn.addressee_id = 'YOUR_USER_ID' AND conn.requester_id = pwe.user_id)
          )
      )
    )
  )
ORDER BY pwe.created_at DESC
LIMIT 20;
*/

-- Schritt 5: Teste die RPC-Funktion direkt
SELECT 
  '=== TEST: RPC-Funktion get_feed_by_branch ===' as test_section;

-- Ersetze 'YOUR_USER_ID' mit deiner User-ID
/*
SELECT * FROM get_feed_by_branch(
  'YOUR_USER_ID'::uuid,
  20,  -- limit
  NULL,  -- after_published
  NULL,  -- after_id
  'relevant'  -- sort_by
);
*/

-- Schritt 6: Debug-Query: Zeige alle Posts mit Branche-Matching
SELECT 
  '=== DEBUG: Posts mit Branche-Matching ===' as test_section;

-- Diese Query zeigt, welche Posts für einen User mit Branche 'gesundheit' angezeigt werden sollten
WITH viewer_profile AS (
  SELECT 
    id as viewer_id,
    branche as viewer_branche,
    schule as viewer_schule
  FROM profiles
  WHERE branche = 'gesundheit'
  LIMIT 1
)
SELECT 
  pwe.id as post_id,
  pwe.user_id,
  pwe.author_branche,
  pwe.author_schule,
  vp.viewer_branche,
  vp.viewer_schule,
  CASE 
    WHEN pwe.user_id = vp.viewer_id THEN 'EIGENER POST'
    WHEN pwe.author_branche = vp.viewer_branche THEN 'GLEICHE BRANCHE'
    WHEN pwe.author_schule = vp.viewer_schule AND pwe.author_schule IS NOT NULL THEN 'GLEICHE SCHULE'
    WHEN EXISTS (
      SELECT 1 FROM connections conn
      WHERE conn.status = 'accepted'
        AND (
          (conn.requester_id = vp.viewer_id AND conn.addressee_id = pwe.user_id) OR
          (conn.addressee_id = vp.viewer_id AND conn.requester_id = pwe.user_id)
        )
    ) THEN 'CONNECTION'
    ELSE 'NICHT MATCH'
  END as match_reason,
  pwe.content,
  pwe.created_at
FROM posts_with_engagement pwe
CROSS JOIN viewer_profile vp
WHERE pwe.author_type = 'user'
ORDER BY 
  CASE 
    WHEN pwe.user_id = vp.viewer_id THEN 1
    WHEN pwe.author_branche = vp.viewer_branche THEN 2
    WHEN pwe.author_schule = vp.viewer_schule AND pwe.author_schule IS NOT NULL THEN 3
    WHEN EXISTS (
      SELECT 1 FROM connections conn
      WHERE conn.status = 'accepted'
        AND (
          (conn.requester_id = vp.viewer_id AND conn.addressee_id = pwe.user_id) OR
          (conn.addressee_id = vp.viewer_id AND conn.requester_id = pwe.user_id)
        )
    ) THEN 4
    ELSE 5
  END,
  pwe.created_at DESC
LIMIT 30;

-- Schritt 7: Zeige Branche-Statistiken
SELECT 
  '=== BRANCHE-STATISTIKEN ===' as test_section;

SELECT 
  branche,
  COUNT(*) as user_count,
  COUNT(DISTINCT p.id) as post_count
FROM profiles pr
LEFT JOIN posts p ON p.user_id = pr.id AND p.status = 'published'
WHERE branche IS NOT NULL
GROUP BY branche
ORDER BY user_count DESC;

-- Schritt 8: Zeige Posts pro Branche
SELECT 
  '=== POSTS PRO BRANCHE ===' as test_section;

SELECT 
  pr.branche,
  COUNT(p.id) as post_count,
  MIN(p.created_at) as earliest_post,
  MAX(p.created_at) as latest_post
FROM profiles pr
INNER JOIN posts p ON p.user_id = pr.id
WHERE p.status = 'published'
  AND pr.branche IS NOT NULL
GROUP BY pr.branche
ORDER BY post_count DESC;

