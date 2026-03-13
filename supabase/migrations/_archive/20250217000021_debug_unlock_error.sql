-- Debug script to check unlock system issues

-- 1. Check if user has company access
SELECT 
  'company_users' as table_name,
  cu.id,
  cu.company_id,
  cu.user_id,
  cu.role,
  cu.accepted_at,
  u.email
FROM public.company_users cu
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 2. Check if company has token wallet
SELECT 
  'company_token_wallets' as table_name,
  ctw.company_id,
  ctw.balance,
  c.name as company_name
FROM public.company_token_wallets ctw
JOIN public.companies c ON ctw.company_id = c.id
JOIN public.company_users cu ON ctw.company_id = cu.company_id
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de';

-- 3. Check rpc_get_company_id function
SELECT public.rpc_get_company_id() as company_id;

-- 4. Check if profile_unlocks table exists and has data
SELECT 
  'profile_unlocks' as table_name,
  pu.*,
  p.vorname,
  p.nachname
FROM public.profile_unlocks pu
JOIN public.profiles p ON pu.profile_id = p.id
JOIN public.company_users cu ON pu.company_id = cu.company_id
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de'
LIMIT 5;

-- 5. Test unlock function with a sample profile
-- (Replace 'PROFILE_ID_HERE' with actual profile ID)
-- SELECT public.rpc_unlock_basic(
--   'PROFILE_ID_HERE'::uuid,
--   'test-idempotency-key-' || extract(epoch from now())::text,
--   null,
--   true
-- );
