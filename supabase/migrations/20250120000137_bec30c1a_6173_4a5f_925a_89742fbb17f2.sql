-- Update the existing company user to use the new email
UPDATE public.company_users 
SET user_id = (
  -- We'll handle this in the application code since we need to create the auth user first
  SELECT id FROM auth.users WHERE email = 'test@muller-handwerk.de' LIMIT 1
)
WHERE company_id = (SELECT id FROM public.companies WHERE name = 'Müller Handwerk GmbH' LIMIT 1)
AND user_id = (SELECT id FROM auth.users WHERE email = 'tom@ausbildungsbasis.de' LIMIT 1);

-- Note: The auth user will be created by the application when they sign up