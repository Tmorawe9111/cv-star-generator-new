-- Setup company data for team@ausbildungsbasis.de

-- 1. Ensure company has token wallet
INSERT INTO public.company_token_wallets (company_id, balance)
SELECT 
  cu.company_id,
  100 -- Start with 100 tokens
FROM public.company_users cu
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de'
  AND cu.accepted_at IS NOT NULL
ON CONFLICT (company_id) DO UPDATE SET
  balance = GREATEST(company_token_wallets.balance, 100);

-- 2. Ensure company has default pipeline
INSERT INTO public.company_pipelines (company_id, name)
SELECT 
  cu.company_id,
  'Standard Pipeline'
FROM public.company_users cu
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de'
  AND cu.accepted_at IS NOT NULL
ON CONFLICT (company_id) DO NOTHING;

-- 3. Create default pipeline stages if they don't exist
INSERT INTO public.pipeline_stages (pipeline_id, name, position, color)
SELECT 
  cp.id,
  stage_data.name,
  stage_data.position,
  stage_data.color
FROM public.company_pipelines cp
JOIN public.company_users cu ON cp.company_id = cu.company_id
JOIN auth.users u ON cu.user_id = u.id
CROSS JOIN (
  VALUES 
    ('Neu', 1, '#3B82F6'),
    ('Kontaktiert', 2, '#10B981'),
    ('Interview', 3, '#F59E0B'),
    ('Angebot', 4, '#8B5CF6'),
    ('Abgelehnt', 5, '#EF4444')
) AS stage_data(name, position, color)
WHERE u.email = 'team@ausbildungsbasis.de'
  AND cu.accepted_at IS NOT NULL
ON CONFLICT (pipeline_id, position) DO NOTHING;

-- 4. Verify setup
SELECT 
  'Setup Complete' as status,
  ctw.balance as tokens,
  cp.name as pipeline_name,
  COUNT(ps.id) as stages_count
FROM public.company_token_wallets ctw
JOIN public.company_pipelines cp ON ctw.company_id = cp.company_id
JOIN public.company_users cu ON ctw.company_id = cu.company_id
JOIN auth.users u ON cu.user_id = u.id
LEFT JOIN public.pipeline_stages ps ON cp.id = ps.pipeline_id
WHERE u.email = 'team@ausbildungsbasis.de'
  AND cu.accepted_at IS NOT NULL
GROUP BY ctw.balance, cp.name;
