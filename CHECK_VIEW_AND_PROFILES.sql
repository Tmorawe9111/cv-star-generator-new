-- ============================================
-- CHECK: posts_with_engagement View und Profile
-- ============================================
-- Prüfe, ob die View korrekt funktioniert und ob Profile existieren

-- 1. Prüfe, ob die View Posts ohne Profile zeigt (sollte nicht passieren)
SELECT 
  pwe.id,
  pwe.user_id,
  pwe.author_branche,
  pwe.author_schule,
  LEFT(pwe.content, 50) as content_preview,
  CASE WHEN pr.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM posts_with_engagement pwe
LEFT JOIN profiles pr ON pwe.user_id = pr.id
WHERE pwe.user_id = '60c459f8-212a-4595-b7d0-3fe0e39f8e4a'
LIMIT 5;

-- 2. Prüfe, ob das Profil direkt existiert
SELECT 
  id,
  vorname,
  nachname,
  email,
  branche,
  profile_published,
  created_at
FROM profiles
WHERE id = '60c459f8-212a-4595-b7d0-3fe0e39f8e4a';

-- 3. Prüfe, ob es Posts von diesem User gibt
SELECT 
  p.id,
  p.user_id,
  p.status,
  p.created_at,
  LEFT(p.content, 50) as content_preview
FROM posts p
WHERE p.user_id = '60c459f8-212a-4595-b7d0-3fe0e39f8e4a'
ORDER BY p.created_at DESC
LIMIT 5;

-- 4. Prüfe, ob der Post in der View erscheint (sollte nur wenn Profil existiert)
SELECT 
  pwe.id,
  pwe.user_id,
  pwe.author_branche,
  pwe.author_schule
FROM posts_with_engagement pwe
WHERE pwe.user_id = '60c459f8-212a-4595-b7d0-3fe0e39f8e4a'
LIMIT 5;

-- 5. Prüfe alle Posts in der View, die möglicherweise keine Profile haben
-- (sollte 0 Ergebnisse geben, wenn die View korrekt ist)
SELECT 
  pwe.id,
  pwe.user_id,
  pwe.author_branche,
  CASE WHEN pr.id IS NULL THEN 'NO PROFILE IN VIEW' ELSE 'HAS PROFILE' END as profile_check
FROM posts_with_engagement pwe
LEFT JOIN profiles pr ON pwe.user_id = pr.id
WHERE pr.id IS NULL
LIMIT 10;

-- 6. Prüfe RLS Policies auf profiles Tabelle
-- (Führe dies als Superuser aus)
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
*/

