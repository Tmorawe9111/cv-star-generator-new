-- Test Query: Prüfe ob die neuen Profile in Supabase gefunden werden können
-- Führe diesen Query im Supabase SQL Editor aus

-- 1. Suche nach den spezifischen Namen
SELECT 
  id,
  vorname,
  nachname,
  email,
  profile_complete,
  profile_published,
  visibility_mode,
  branche,
  status,
  ort,
  plz,
  created_at,
  updated_at
FROM profiles
WHERE 
  vorname ILIKE '%fabio%' 
  OR vorname ILIKE '%julia%' 
  OR vorname ILIKE '%martina%'
  OR nachname ILIKE '%fabio%'
  OR nachname ILIKE '%julia%'
  OR nachname ILIKE '%martina%'
ORDER BY created_at DESC;

-- 2. Prüfe alle Profile, die in den letzten 7 Tagen erstellt wurden
SELECT 
  id,
  vorname,
  nachname,
  email,
  profile_complete,
  profile_published,
  visibility_mode,
  branche,
  status,
  created_at
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Prüfe, wie viele Profile vollständig sind
SELECT 
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE profile_complete = true) as complete_profiles,
  COUNT(*) FILTER (WHERE profile_complete = false) as incomplete_profiles,
  COUNT(*) FILTER (WHERE profile_published = true) as published_profiles,
  COUNT(*) FILTER (WHERE profile_published = false) as unpublished_profiles
FROM profiles;

-- 4. Teste die suggest_people Funktion (ersetze 'YOUR_USER_ID' mit einer echten User-ID)
-- SELECT * FROM suggest_people('YOUR_USER_ID'::uuid, 10);

-- 5. Prüfe, ob es RLS Policies gibt, die den Zugriff blockieren könnten
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

