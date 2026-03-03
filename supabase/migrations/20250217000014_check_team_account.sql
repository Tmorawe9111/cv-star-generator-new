-- Check current status of team@ausbildungsbasis.de account
-- Run this in Supabase SQL Editor to see current state

-- 1. Check if user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'team@ausbildungsbasis.de';

-- 2. Check if user has a profile (should NOT have one for company users)
SELECT 
  p.id,
  p.email,
  p.vorname,
  p.nachname,
  p.profile_complete
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 3. Check if user is linked to a company
SELECT 
  cu.id,
  cu.user_id,
  cu.company_id,
  cu.role,
  cu.accepted_at,
  c.name as company_name,
  c.email as company_email
FROM public.company_users cu
JOIN auth.users u ON cu.user_id = u.id
LEFT JOIN public.companies c ON cu.company_id = c.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 4. Check if user has user_type entry
SELECT 
  ut.id,
  ut.user_id,
  ut.user_type,
  ut.created_at
FROM public.user_types ut
JOIN auth.users u ON ut.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 5. Check company details
SELECT 
  c.id,
  c.name,
  c.email,
  c.description,
  c.industry,
  c.main_location,
  c.size_range,
  c.plan_type,
  c.active_tokens,
  c.seats,
  c.subscription_status
FROM public.companies c
JOIN public.company_users cu ON c.id = cu.company_id
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';
