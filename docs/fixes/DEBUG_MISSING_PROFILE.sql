-- ============================================
-- DEBUG: Missing Profile Check
-- ============================================
-- Prüfe, ob ein Profil für eine bestimmte user_id existiert

-- 1. Prüfe, ob das Profil existiert
SELECT 
  id,
  vorname,
  nachname,
  email,
  branche,
  created_at,
  updated_at
FROM profiles
WHERE id = '60c459f8-212a-4595-b7d0-3fe0e39f8e4a';

-- 2. Prüfe, ob es Posts von diesem User gibt
SELECT 
  p.id as post_id,
  p.user_id,
  p.content,
  p.created_at,
  p.status
FROM posts p
WHERE p.user_id = '60c459f8-212a-4595-b7d0-3fe0e39f8e4a'
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. Prüfe, ob der Post in posts_with_engagement erscheint
SELECT 
  pwe.id,
  pwe.user_id,
  pwe.author_branche,
  pwe.author_schule,
  LEFT(pwe.content, 50) as content_preview
FROM posts_with_engagement pwe
WHERE pwe.user_id = '60c459f8-212a-4595-b7d0-3fe0e39f8e4a'
LIMIT 5;

-- 4. Prüfe, ob der Post von get_feed_by_branch zurückgegeben wird
-- (Ersetze 'DEINE_USER_ID' mit der ID des Viewers)
/*
SELECT * FROM get_feed_by_branch(
  'DEINE_USER_ID_HIER'::uuid,
  20,
  NULL,
  NULL,
  'relevant'
)
WHERE user_id = '60c459f8-212a-4595-b7d0-3fe0e39f8e4a';
*/

-- 5. Prüfe alle Profile, die Posts haben, aber möglicherweise nicht in der View erscheinen
SELECT 
  p.user_id,
  COUNT(*) as post_count,
  CASE WHEN pr.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'published'
  AND p.user_id IS NOT NULL
GROUP BY p.user_id, pr.id
HAVING pr.id IS NULL
ORDER BY post_count DESC
LIMIT 10;

