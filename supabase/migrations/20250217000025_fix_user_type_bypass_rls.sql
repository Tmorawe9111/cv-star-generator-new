-- Fix user_type for team@ausbildungsbasis.de by bypassing RLS
-- Run this in Supabase SQL Editor as a superuser

-- 1. Temporarily disable RLS on user_types table
ALTER TABLE public.user_types DISABLE ROW LEVEL SECURITY;

-- 2. Set user_type to 'company' for team@ausbildungsbasis.de
INSERT INTO public.user_types (user_id, user_type)
SELECT 
  u.id,
  'company'
FROM auth.users u
WHERE u.email = 'team@ausbildungsbasis.de'
ON CONFLICT (user_id) DO UPDATE SET
  user_type = 'company';

-- 3. Re-enable RLS on user_types table
ALTER TABLE public.user_types ENABLE ROW LEVEL SECURITY;

-- 4. Also ensure accepted_at is set in company_users (bypass trigger)
-- Temporarily disable the trigger
DROP TRIGGER IF EXISTS trg_enforce_company_user_update ON public.company_users;

-- Update accepted_at
UPDATE public.company_users 
SET accepted_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'team@ausbildungsbasis.de'
);

-- Re-enable the trigger
CREATE TRIGGER trg_enforce_company_user_update
BEFORE UPDATE ON public.company_users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_company_user_update();

-- 5. Verify the fix
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
