-- Update the handle_new_user trigger to only create profiles for applicants
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only create a profile if this user is NOT associated with a company
  -- AND if they signed up as an applicant (check user metadata)
  IF NOT EXISTS (
    SELECT 1 FROM public.company_users 
    WHERE user_id = NEW.id
  ) AND (
    NEW.raw_user_meta_data ->> 'role' = 'applicant' OR 
    NEW.raw_user_meta_data ->> 'role' IS NULL  -- fallback for existing users
  ) THEN
    -- This is a job seeker, create a profile
    INSERT INTO public.profiles (id, email, account_created)
    VALUES (
      NEW.id, 
      NEW.email,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Optional: Clean up existing company profiles (profiles that shouldn't exist)
-- This removes profiles for users who are in company_users table
DELETE FROM public.profiles 
WHERE id IN (
  SELECT DISTINCT cu.user_id 
  FROM public.company_users cu
  WHERE cu.user_id IS NOT NULL
);