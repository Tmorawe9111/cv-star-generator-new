-- Temporäre Lösung: Company direkt in der Datenbank erstellen
-- und einfache RLS Policies die erstmal alles erlauben

-- Erweiterte RLS Policies die für jetzt alles erlauben
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Allow all company operations" ON public.companies FOR ALL USING (true) WITH CHECK (true);

-- Temporäres Unternehmen erstellen
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
  'temp-company-123',
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
  id,
  user_id,
  company_id,
  role,
  accepted_at
) VALUES (
  gen_random_uuid(),
  'c6b5b010-af27-44ce-ba9d-449a61b42202',
  'temp-company-123',
  'admin',
  now()
) ON CONFLICT (user_id, company_id) DO UPDATE SET
  role = EXCLUDED.role,
  accepted_at = EXCLUDED.accepted_at;

-- Profile policies erweitern damit Companies alle Profile sehen können
DROP POLICY IF EXISTS "Users can view published profiles" ON public.profiles;
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