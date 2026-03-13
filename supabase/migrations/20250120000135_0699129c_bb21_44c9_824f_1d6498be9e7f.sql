-- Create a test company with real data and connections

-- 1. Create a test company
INSERT INTO companies (
  id,
  name,
  size_range,
  website_url,
  industry,
  main_location,
  description,
  active_tokens,
  seats,
  subscription_status,
  plan_type
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Müller Handwerk GmbH',
  '26-50',
  'https://mueller-handwerk.de',
  'handwerk',
  'Frankfurt am Main',
  'Traditionelles Handwerksunternehmen mit Fokus auf Elektrotechnik und allgemeine Handwerksarbeiten. Wir suchen motivierte Auszubildende.',
  75,
  5,
  'active',
  'premium'
);

-- 2. Create a test company user (admin)
-- First, we need to create an auth user (this is a simplified approach)
-- In production, this would be done through the signup process
INSERT INTO company_users (
  id,
  user_id,
  company_id,
  role,
  accepted_at,
  invited_at
) VALUES (
  gen_random_uuid(),
  'b192cd4c-aec5-4d1f-a4a5-61ba18876835'::uuid, -- Using the existing user from logs
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'admin',
  now(),
  now()
);

-- 3. Create company settings
INSERT INTO company_settings (
  id,
  company_id,
  target_status,
  target_industries,
  target_locations
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '["schueler", "azubis"]'::jsonb,
  '["handwerk", "it"]'::jsonb,
  '["Frankfurt", "Rhein-Main"]'::jsonb
);

-- 4. Create some sample matches with existing profiles
INSERT INTO matches (
  id,
  company_id,
  profile_id,
  status,
  matched_at
) VALUES 
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'a7e48f68-678b-41f7-aaa3-a716b3f67860'::uuid, -- Peter Mor from console logs
  'interessiert',
  now() - interval '2 days'
);

-- 5. Create some token usage records
INSERT INTO tokens_used (
  id,
  company_id,
  profile_id,
  used_at
) VALUES 
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'a7e48f68-678b-41f7-aaa3-a716b3f67860'::uuid,
  now() - interval '1 day'
);

-- 6. Update the companies active_tokens after token usage
UPDATE companies 
SET active_tokens = 74 
WHERE id = '550e8400-e29b-41d4-a716-446655440001'::uuid;