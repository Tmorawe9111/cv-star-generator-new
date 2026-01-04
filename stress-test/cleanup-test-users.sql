-- Cleanup Script für Test-User nach Stress Test
-- ⚠️ WARNUNG: Löscht alle Test-User mit Email-Pattern "test-*@stress-test.com"

-- 1. Lösche Profile von Test-Usern
DELETE FROM profiles
WHERE email LIKE 'test-%@stress-test.com';

-- 2. Lösche Auth-User (muss in Supabase Dashboard gemacht werden oder via API)
-- Oder manuell in Supabase Dashboard: Auth > Users > Filter nach Email "stress-test.com"

-- 3. Prüfe verbleibende Test-User
SELECT COUNT(*) as remaining_test_profiles
FROM profiles
WHERE email LIKE 'test-%@stress-test.com';

-- 4. Prüfe verbleibende Test-Posts (falls vorhanden)
SELECT COUNT(*) as test_posts
FROM posts
WHERE profile_id IN (
  SELECT id FROM profiles WHERE email LIKE 'test-%@stress-test.com'
);

-- Optional: Lösche auch Test-Posts
-- DELETE FROM posts
-- WHERE profile_id IN (
--   SELECT id FROM profiles WHERE email LIKE 'test-%@stress-test.com'
-- );

