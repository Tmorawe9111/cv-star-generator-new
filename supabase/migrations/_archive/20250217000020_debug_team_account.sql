-- Debug script to check team@ausbildungsbasis.de account status
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check auth.users entry
SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'team@ausbildungsbasis.de';

-- 2. Check if user has a profile (should NOT have one for company users)
SELECT 
  'profiles' as table_name,
  p.id,
  p.email,
  p.vorname,
  p.nachname,
  p.profile_complete,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 3. Check company_users table
SELECT 
  'company_users' as table_name,
  cu.id,
  cu.user_id,
  cu.company_id,
  cu.role,
  cu.invited_at,
  cu.accepted_at,
  CASE 
    WHEN cu.accepted_at IS NOT NULL THEN 'ACCEPTED'
    ELSE 'NOT ACCEPTED'
  END as status
FROM public.company_users cu
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 4. Check user_types table
SELECT 
  'user_types' as table_name,
  ut.id,
  ut.user_id,
  ut.user_type,
  ut.created_at
FROM public.user_types ut
JOIN auth.users u ON ut.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 5. Check companies table
SELECT 
  'companies' as table_name,
  c.id,
  c.name,
  c.description,
  c.industry,
  c.main_location,
  c.size_range,
  c.plan_type,
  c.active_tokens,
  c.seats,
  c.subscription_status,
  c.created_at
FROM public.companies c
JOIN public.company_users cu ON c.id = cu.company_id
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 6. Check company_settings
SELECT 
  'company_settings' as table_name,
  cs.id,
  cs.company_id,
  cs.target_status,
  cs.target_industries,
  cs.target_locations,
  cs.created_at
FROM public.company_settings cs
JOIN public.companies c ON cs.company_id = c.id
JOIN public.company_users cu ON c.id = cu.company_id
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 7. Summary check
SELECT 
  'SUMMARY' as check_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'team@ausbildungsbasis.de') THEN '✅ User exists in auth.users'
    ELSE '❌ User NOT found in auth.users'
  END as auth_users_check,
  CASE 
    WHEN EXISTS(SELECT 1 FROM public.profiles p JOIN auth.users u ON p.id = u.id WHERE u.email = 'team@ausbildungsbasis.de') THEN '❌ User has profile (should NOT have one)'
    ELSE '✅ User has NO profile (correct for company)'
  END as profiles_check,
  CASE 
    WHEN EXISTS(SELECT 1 FROM public.company_users cu JOIN auth.users u ON cu.user_id = u.id WHERE u.email = 'team@ausbildungsbasis.de' AND cu.accepted_at IS NOT NULL) THEN '✅ User is accepted company member'
    WHEN EXISTS(SELECT 1 FROM public.company_users cu JOIN auth.users u ON cu.user_id = u.id WHERE u.email = 'team@ausbildungsbasis.de') THEN '⚠️ User is company member but NOT accepted'
    ELSE '❌ User is NOT a company member'
  END as company_users_check,
  CASE 
    WHEN EXISTS(SELECT 1 FROM public.user_types ut JOIN auth.users u ON ut.user_id = u.id WHERE u.email = 'team@ausbildungsbasis.de' AND ut.user_type = 'company') THEN '✅ User type is company'
    WHEN EXISTS(SELECT 1 FROM public.user_types ut JOIN auth.users u ON ut.user_id = u.id WHERE u.email = 'team@ausbildungsbasis.de') THEN '⚠️ User type exists but not company'
    ELSE '❌ No user type set'
  END as user_types_check;
