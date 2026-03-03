-- Quick fix for team@ausbildungsbasis.de user_type
-- Run this in Supabase SQL Editor

-- 1. Set user_type to 'company' for team@ausbildungsbasis.de
INSERT INTO public.user_types (user_id, user_type)
SELECT 
  u.id,
  'company'
FROM auth.users u
WHERE u.email = 'team@ausbildungsbasis.de'
ON CONFLICT (user_id) DO UPDATE SET
  user_type = 'company';

-- 2. Verify the fix
SELECT 
  'user_types' as table_name,
  ut.id,
  ut.user_id,
  ut.user_type,
  ut.created_at,
  u.email
FROM public.user_types ut
JOIN auth.users u ON ut.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 3. Also ensure accepted_at is set in company_users
UPDATE public.company_users 
SET accepted_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'team@ausbildungsbasis.de'
);

-- 4. Final verification
SELECT 
  'FINAL CHECK' as check_type,
  u.email,
  CASE 
    WHEN ut.user_type = 'company' THEN '✅ User type is company'
    ELSE '❌ User type is NOT company'
  END as user_type_status,
  CASE 
    WHEN cu.accepted_at IS NOT NULL THEN '✅ ACCEPTED COMPANY USER'
    ELSE '❌ NOT ACCEPTED'
  END as company_status
FROM auth.users u
LEFT JOIN public.user_types ut ON u.id = ut.user_id
LEFT JOIN public.company_users cu ON u.id = cu.user_id
WHERE u.email = 'team@ausbildungsbasis.de';
