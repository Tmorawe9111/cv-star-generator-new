-- Fix team@ausbildungsbasis.de to be a proper company account
-- This ensures the account has full company access

-- 1. Remove any existing profile (company users shouldn't have profiles)
DELETE FROM public.profiles 
WHERE id IN (
  SELECT u.id 
  FROM auth.users u 
  WHERE u.email = 'team@ausbildungsbasis.de'
);

-- 2. Ensure user has user_type set to 'company'
INSERT INTO public.user_types (user_id, user_type)
SELECT 
  u.id,
  'company'
FROM auth.users u
WHERE u.email = 'team@ausbildungsbasis.de'
ON CONFLICT (user_id) DO UPDATE SET
  user_type = 'company';

-- 3. Create or update company for Ausbildungsbasis
INSERT INTO public.companies (
  id,
  name,
  description,
  industry,
  main_location,
  size_range,
  plan_type,
  active_tokens,
  seats,
  subscription_status,
  website_url
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Ausbildungsbasis',
  'Plattform für Ausbildungsplätze und Azubi-Matching',
  'Bildung',
  'Deutschland',
  '11-25',
  'premium',
  1000,
  10,
  'active',
  'https://ausbildungsbasis.de'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  main_location = EXCLUDED.main_location,
  size_range = EXCLUDED.size_range,
  plan_type = EXCLUDED.plan_type,
  active_tokens = EXCLUDED.active_tokens,
  seats = EXCLUDED.seats,
  subscription_status = EXCLUDED.subscription_status,
  website_url = EXCLUDED.website_url;

-- 4. Link team@ausbildungsbasis.de to the company as admin
INSERT INTO public.company_users (
  id,
  user_id,
  company_id,
  role,
  invited_at,
  accepted_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'admin',
  now(),
  now()
FROM auth.users u
WHERE u.email = 'team@ausbildungsbasis.de'
ON CONFLICT (user_id, company_id) DO UPDATE SET
  role = 'admin',
  accepted_at = now();

-- 5. Create company settings
INSERT INTO public.company_settings (
  id,
  company_id,
  target_status,
  target_industries,
  target_locations
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111'::uuid,
  '["schueler", "azubi", "ausgelernt"]'::jsonb,
  '["it", "handwerk", "kaufmaennisch", "gesundheit", "gastronomie"]'::jsonb,
  '["Deutschland"]'::jsonb
) ON CONFLICT DO NOTHING;

-- 6. Update auth.users metadata to indicate company role
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "company"}'::jsonb
WHERE email = 'team@ausbildungsbasis.de';

-- 7. Verify the setup
SELECT 
  'User Check' as check_type,
  u.email,
  u.raw_user_meta_data->>'role' as auth_role
FROM auth.users u
WHERE u.email = 'team@ausbildungsbasis.de'

UNION ALL

SELECT 
  'User Type Check' as check_type,
  u.email,
  ut.user_type
FROM auth.users u
JOIN public.user_types ut ON u.id = ut.user_id
WHERE u.email = 'team@ausbildungsbasis.de'

UNION ALL

SELECT 
  'Company User Check' as check_type,
  u.email,
  cu.role || ' at ' || c.name
FROM auth.users u
JOIN public.company_users cu ON u.id = cu.user_id
JOIN public.companies c ON cu.company_id = c.id
WHERE u.email = 'team@ausbildungsbasis.de'

UNION ALL

SELECT 
  'Profile Check' as check_type,
  u.email,
  CASE WHEN p.id IS NULL THEN 'No profile (correct for company)' ELSE 'Has profile (should be removed)' END
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'team@ausbildungsbasis.de';
