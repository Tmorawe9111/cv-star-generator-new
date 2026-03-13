-- ============================================
-- EINFACHER TEST: get_feed_by_branch
-- ============================================
-- Führe diese Queries in Supabase SQL Editor aus

-- 1. Zeige alle Posts mit Branche-Info
SELECT 
  p.id,
  p.user_id,
  pr.vorname || ' ' || pr.nachname as author,
  pr.branche,
  pr.schule,
  LEFT(p.content, 50) as content_preview,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'published'
ORDER BY p.created_at DESC
LIMIT 20;

-- 2. Finde deine User-ID und Branche
SELECT 
  id,
  vorname || ' ' || nachname as name,
  branche,
  schule
FROM profiles
WHERE branche = 'gesundheit'  -- Oder deine Branche
ORDER BY created_at DESC
LIMIT 5;

-- 3. Teste die Funktion (ersetze 'DEINE_USER_ID' mit deiner ID)
-- Kopiere deine User-ID aus Schritt 2 und füge sie hier ein:
/*
SELECT * FROM get_feed_by_branch(
  'DEINE_USER_ID_HIER'::uuid,  -- <-- HIER DEINE USER-ID EINFÜGEN
  20,
  NULL,
  NULL,
  'relevant'
);
*/

-- 4. Debug: Zeige welche Posts für dich angezeigt werden sollten
-- Ersetze 'DEINE_USER_ID' mit deiner ID
/*
WITH my_profile AS (
  SELECT id, branche, schule 
  FROM profiles 
  WHERE id = 'DEINE_USER_ID_HIER'::uuid  -- <-- HIER DEINE USER-ID
)
SELECT 
  pwe.id,
  pwe.user_id,
  pwe.author_branche,
  pwe.author_schule,
  mp.id as meine_id,
  mp.branche as meine_branche,
  mp.schule as meine_schule,
  CASE 
    WHEN pwe.user_id = mp.id THEN '✅ EIGENER POST'
    WHEN pwe.author_branche = mp.branche AND pwe.author_branche IS NOT NULL THEN '✅ GLEICHE BRANCHE'
    WHEN pwe.author_schule = mp.schule AND pwe.author_schule IS NOT NULL AND mp.schule IS NOT NULL THEN '✅ GLEICHE SCHULE'
    WHEN EXISTS (
      SELECT 1 FROM connections conn
      WHERE conn.status = 'accepted'
        AND (
          (conn.requester_id = mp.id AND conn.addressee_id = pwe.user_id) OR
          (conn.addressee_id = mp.id AND conn.requester_id = pwe.user_id)
        )
    ) THEN '✅ CONNECTION'
    ELSE '❌ NICHT MATCH'
  END as status,
  LEFT(pwe.content, 100) as content,
  pwe.created_at
FROM posts_with_engagement pwe
CROSS JOIN my_profile mp
WHERE pwe.author_type = 'user'
ORDER BY 
  CASE 
    WHEN pwe.user_id = mp.id THEN 1
    WHEN pwe.author_branche = mp.branche THEN 2
    WHEN pwe.author_schule = mp.schule THEN 3
    ELSE 4
  END,
  pwe.created_at DESC;
*/

-- 5. Teste die View direkt - prüfe ob author_branche korrekt ist
SELECT 
  pwe.id,
  pwe.user_id,
  pwe.author_branche,
  pwe.author_schule,
  pr.branche as profile_branche,  -- Direkt aus profiles
  pr.schule as profile_schule,
  LEFT(pwe.content, 50) as content,
  CASE 
    WHEN pwe.author_branche = pr.branche THEN '✅ MATCH'
    WHEN pwe.author_branche IS NULL AND pr.branche IS NOT NULL THEN '❌ NULL in View'
    WHEN pwe.author_branche IS NOT NULL AND pr.branche IS NULL THEN '❌ NULL in Profile'
    ELSE '❌ MISMATCH'
  END as branche_check
FROM posts_with_engagement pwe
LEFT JOIN profiles pr ON pwe.user_id = pr.id
WHERE pwe.author_type = 'user'
ORDER BY pwe.created_at DESC
LIMIT 20;

-- 6. SIMULIERE get_feed_by_branch für einen User mit Branche 'gesundheit'
-- Diese Query zeigt genau, was die Funktion zurückgeben sollte
WITH viewer_profile AS (
  SELECT id, branche, schule
  FROM profiles
  WHERE branche = 'gesundheit'
  LIMIT 1
)
SELECT 
  pwe.id,
  pwe.user_id,
  pwe.author_branche,
  vp.branche as viewer_branche,
  CASE 
    WHEN pwe.user_id = vp.id THEN '✅ EIGENER POST'
    WHEN pwe.author_branche = vp.branche THEN '✅ GLEICHE BRANCHE'
    ELSE '❌ NICHT MATCH'
  END as match_reason,
  LEFT(pwe.content, 100) as content,
  pwe.created_at
FROM posts_with_engagement pwe
CROSS JOIN viewer_profile vp
WHERE 
  (pwe.author_type = 'user' AND pwe.user_id = vp.id)
  OR
  (
    pwe.author_type = 'user' 
    AND pwe.user_id != vp.id
    AND pwe.author_branche = vp.branche
    AND pwe.author_branche IS NOT NULL
    AND vp.branche IS NOT NULL
  )
ORDER BY pwe.created_at DESC
LIMIT 20;

