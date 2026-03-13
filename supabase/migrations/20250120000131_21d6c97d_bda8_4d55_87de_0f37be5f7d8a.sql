-- Fix: Prevent automatic profile creation for company users
-- We need to modify the trigger to only create profiles for actual job seekers

-- First, let's check and clean up the wrongly created profile
-- Delete the profile that was created for the company user
DELETE FROM public.profiles 
WHERE email = 'tom@ausbildungsbasis.de' 
AND id = 'b192cd4c-aec5-4d1f-a4a5-61ba18876835';

-- Now update the trigger function to be smarter about when to create profiles
-- We'll only create profiles when explicitly requested, not automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a new, smarter function that doesn't auto-create profiles
-- Profiles will only be created when users actually start the CV/job seeker flow
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only create a profile if this user is NOT associated with a company
  -- We check if they're in company_users table
  IF NOT EXISTS (
    SELECT 1 FROM public.company_users 
    WHERE user_id = NEW.id
  ) THEN
    -- This is likely a job seeker, create a profile
    INSERT INTO public.profiles (id, email, account_created)
    VALUES (
      NEW.id, 
      NEW.email,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();