-- ============================================
-- DIAGNOSE PROFILE ISSUES
-- ============================================
-- Run these queries in Supabase SQL Editor to diagnose profile problems

-- 1. Find all profiles with email mismatches
SELECT 
  p.id,
  p.email as profile_email,
  p.vorname,
  p.nachname,
  u.email as auth_email,
  CASE 
    WHEN p.email IS DISTINCT FROM LOWER(TRIM(u.email)) THEN '❌ MISMATCH'
    ELSE '✅ OK'
  END as status,
  p.created_at as profile_created,
  p.updated_at as profile_updated,
  u.created_at as auth_created,
  u.updated_at as auth_updated
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email IS DISTINCT FROM LOWER(TRIM(u.email))
ORDER BY p.updated_at DESC;

-- 2. Find profiles that were recently updated (potential overwrites)
SELECT 
  p.id,
  p.email,
  p.vorname,
  p.nachname,
  u.email as auth_email,
  p.updated_at,
  p.created_at,
  EXTRACT(EPOCH FROM (p.updated_at - p.created_at)) / 3600 as hours_between_create_update
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.updated_at > NOW() - INTERVAL '7 days'
ORDER BY p.updated_at DESC
LIMIT 50;

-- 3. Find duplicate emails in profiles table (should not exist!)
SELECT 
  email,
  COUNT(*) as count,
  array_agg(id) as user_ids,
  array_agg(vorname || ' ' || nachname) as names
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 4. Find profiles where email exists in auth.users but not in profiles
SELECT 
  u.id,
  u.email as auth_email,
  p.email as profile_email,
  p.vorname,
  p.nachname,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    WHEN p.email IS NULL THEN '⚠️ PROFILE EXISTS BUT NO EMAIL'
    ELSE '✅ OK'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%@%'  -- Only check users with valid emails
ORDER BY u.created_at DESC
LIMIT 50;

-- 5. Find profiles with suspicious name changes (potential overwrites)
SELECT 
  p.id,
  p.email,
  p.vorname,
  p.nachname,
  u.email as auth_email,
  p.updated_at,
  p.created_at,
  CASE 
    WHEN p.updated_at > p.created_at + INTERVAL '1 hour' 
      AND p.vorname IS NOT NULL 
      AND p.nachname IS NOT NULL
    THEN '⚠️ SUSPICIOUS'
    ELSE '✅ OK'
  END as status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.updated_at > NOW() - INTERVAL '30 days'
ORDER BY p.updated_at DESC;

-- 6. Check for Alina/Susanne specific issue
SELECT 
  p.id,
  p.email,
  p.vorname,
  p.nachname,
  u.email as auth_email,
  p.updated_at,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE 
  (LOWER(p.vorname) LIKE '%alina%' OR LOWER(p.vorname) LIKE '%susanne%')
  OR (LOWER(p.nachname) LIKE '%alina%' OR LOWER(p.nachname) LIKE '%susanne%')
  OR (LOWER(p.email) LIKE '%alina%' OR LOWER(p.email) LIKE '%susanne%')
  OR (LOWER(u.email) LIKE '%alina%' OR LOWER(u.email) LIKE '%susanne%')
ORDER BY p.updated_at DESC;

-- 7. Find profiles with web.de emails (to find Susanne)
SELECT 
  p.id,
  p.email,
  p.vorname,
  p.nachname,
  u.email as auth_email,
  p.updated_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE 
  (p.email LIKE '%@web.de' OR u.email LIKE '%@web.de')
ORDER BY p.updated_at DESC;

-- 8. Count total mismatches
SELECT 
  COUNT(*) as total_mismatches,
  COUNT(DISTINCT p.id) as affected_users
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email IS DISTINCT FROM LOWER(TRIM(u.email));

