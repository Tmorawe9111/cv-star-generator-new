-- ============================================
-- FIX PROFILE EMAIL MISMATCHES
-- ============================================
-- Run this script to fix all email mismatches
-- WARNING: This will update all profiles to match auth.users emails

-- Step 1: Show what will be changed (DRY RUN)
SELECT 
  p.id,
  p.email as current_profile_email,
  LOWER(TRIM(u.email)) as correct_auth_email,
  p.vorname,
  p.nachname,
  'WILL BE UPDATED' as action
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email IS DISTINCT FROM LOWER(TRIM(u.email))
ORDER BY p.updated_at DESC;

-- Step 2: Actually fix the emails (UNCOMMENT TO RUN)
/*
UPDATE profiles p
SET 
  email = LOWER(TRIM(u.email)),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS DISTINCT FROM LOWER(TRIM(u.email));

-- Show results
SELECT 
  COUNT(*) as fixed_profiles
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = LOWER(TRIM(u.email));
*/

-- Step 3: Fix specific user (replace USER_ID with actual UUID)
/*
SELECT public.fix_profile_email('USER_ID_HERE');
*/

-- Step 4: Verify all emails are now synced
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN p.email = LOWER(TRIM(u.email)) THEN 1 END) as synced_profiles,
  COUNT(CASE WHEN p.email IS DISTINCT FROM LOWER(TRIM(u.email)) THEN 1 END) as mismatched_profiles
FROM profiles p
JOIN auth.users u ON p.id = u.id;

