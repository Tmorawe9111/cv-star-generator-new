-- ============================================
-- FIX PLAN: Complete Company User Separation
-- Handling FK constraints properly
-- ============================================

-- Drop broken company signup trigger
DROP TRIGGER IF EXISTS on_company_created ON public.companies;
DROP FUNCTION IF EXISTS public.handle_company_signup();

-- 1. Fix trigger to NOT create profiles for company users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate trigger function with company check
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Only create profile for NON-company users
  IF NEW.raw_user_meta_data->>'is_company' IS NULL 
     OR NEW.raw_user_meta_data->>'is_company' = 'false' THEN
    INSERT INTO public.profiles (
      id, 
      first_name, 
      last_name, 
      email,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id, 
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.email,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Fix hand@ausbildungsbasis.de user
-- Delete incorrect profile if exists (only if not referenced)
DELETE FROM public.profiles 
WHERE id IN (
  SELECT p.id FROM public.profiles p
  INNER JOIN auth.users u ON p.id = u.id
  WHERE u.email = 'hand@ausbildungsbasis.de'
    AND NOT EXISTS (
      SELECT 1 FROM public.company_employment_requests cer
      WHERE cer.confirmed_by = p.id
    )
);

-- 3. Ensure company exists for hand@ausbildungsbasis.de
INSERT INTO public.companies (
  id, 
  name, 
  primary_email, 
  main_location, 
  country,
  size_range, 
  contact_person, 
  phone,
  plan_type, 
  subscription_status, 
  active_tokens, 
  seats, 
  account_status,
  onboarding_step, 
  onboarding_completed
)
SELECT
  gen_random_uuid(), 
  'Ausbildungsbasis Test Unternehmen', 
  'hand@ausbildungsbasis.de',
  'Berlin', 
  'Deutschland',
  '1-10', 
  'Hand User', 
  '+49 123 456789',
  'basic', 
  'inactive', 
  0, 
  1, 
  'active',
  0, 
  false
FROM auth.users u
WHERE u.email = 'hand@ausbildungsbasis.de'
  AND NOT EXISTS (
    SELECT 1 FROM public.company_users cu 
    WHERE cu.user_id = u.id
  );

-- 4. Link hand@ausbildungsbasis.de as company admin
INSERT INTO public.company_users (user_id, company_id, role, accepted_at)
SELECT 
  u.id,
  c.id,
  'admin',
  NOW()
FROM auth.users u
CROSS JOIN public.companies c
WHERE u.email = 'hand@ausbildungsbasis.de'
  AND c.primary_email = 'hand@ausbildungsbasis.de'
  AND NOT EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.user_id = u.id AND cu.company_id = c.id
  );

-- 5. Update user metadata for company users to ensure is_company flag
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_company}',
  'true'::jsonb
)
WHERE id IN (
  SELECT DISTINCT user_id FROM public.company_users
)
AND (raw_user_meta_data->>'is_company' IS NULL 
     OR raw_user_meta_data->>'is_company' != 'true');

-- 6. Cleanup: Set confirmed_by to NULL for company users (to allow profile deletion later)
UPDATE public.company_employment_requests
SET confirmed_by = NULL
WHERE confirmed_by IN (
  SELECT DISTINCT cu.user_id 
  FROM public.company_users cu
);

-- 7. Now delete profiles for company users (safe after FK cleanup)
DELETE FROM public.profiles 
WHERE id IN (
  SELECT DISTINCT cu.user_id 
  FROM public.company_users cu
);