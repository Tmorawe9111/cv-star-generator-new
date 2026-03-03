-- Fix team@ausbildungsbasis.de accepted_at status
-- This ensures the user is properly accepted as a company member

-- 1. Update accepted_at for team@ausbildungsbasis.de
UPDATE public.company_users 
SET accepted_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'team@ausbildungsbasis.de'
);

-- 2. Verify the update
SELECT 
  'company_users' as table_name,
  cu.id,
  cu.user_id,
  cu.company_id,
  cu.role,
  cu.invited_at,
  cu.accepted_at,
  CASE 
    WHEN cu.accepted_at IS NOT NULL THEN 'ACCEPTED ✅'
    ELSE 'NOT ACCEPTED ❌'
  END as status
FROM public.company_users cu
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 3. Also ensure user_type is set correctly
INSERT INTO public.user_types (user_id, user_type)
SELECT 
  u.id,
  'company'
FROM auth.users u
WHERE u.email = 'team@ausbildungsbasis.de'
ON CONFLICT (user_id) DO UPDATE SET
  user_type = 'company';

-- 4. Verify user_type
SELECT 
  'user_types' as table_name,
  ut.id,
  ut.user_id,
  ut.user_type,
  ut.created_at
FROM public.user_types ut
JOIN auth.users u ON ut.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 5. Final verification - this should show ACCEPTED status
SELECT 
  'FINAL CHECK' as check_type,
  u.email,
  CASE 
    WHEN cu.accepted_at IS NOT NULL THEN '✅ ACCEPTED COMPANY USER'
    ELSE '❌ NOT ACCEPTED'
  END as company_status,
  ut.user_type,
  c.name as company_name
FROM auth.users u
LEFT JOIN public.company_users cu ON u.id = cu.user_id
LEFT JOIN public.user_types ut ON u.id = ut.user_id
LEFT JOIN public.companies c ON cu.company_id = c.id
WHERE u.email = 'team@ausbildungsbasis.de';
