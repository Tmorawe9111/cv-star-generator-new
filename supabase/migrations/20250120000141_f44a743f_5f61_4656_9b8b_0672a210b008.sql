-- Korrigierte Version mit gültiger UUID
-- Erweiterte RLS Policies die für jetzt alles erlauben
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Allow all company operations" ON public.companies FOR ALL USING (true) WITH CHECK (true);

-- Temporäres Unternehmen mit gültiger UUID erstellen
INSERT INTO public.companies (
  id,
  name, 
  description,
  industry,
  plan_type,
  active_tokens,
  seats,
  subscription_status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo Unternehmen',
  'Beispiel-Unternehmen für Tests',
  'Handwerk',
  'premium',
  1000,
  5,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active_tokens = EXCLUDED.active_tokens;

-- User als Admin des Unternehmens hinzufügen
INSERT INTO public.company_users (
  user_id,
  company_id,
  role,
  accepted_at
) VALUES (
  'c6b5b010-af27-44ce-ba9d-449a61b42202',
  '11111111-1111-1111-1111-111111111111',
  'admin',
  now()
) ON CONFLICT DO NOTHING;

-- Profile policies erweitern damit Companies alle Profile sehen können
DROP POLICY IF EXISTS "Company users can view all profiles" ON public.profiles;
CREATE POLICY "Company users can view all profiles" ON public.profiles 
FOR SELECT 
USING (
  profile_published = true OR 
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.company_users 
    WHERE user_id = auth.uid()
  )
);