-- Add columns needed for entry gates system to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS address_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS visibility_mode text DEFAULT 'invisible',
ADD COLUMN IF NOT EXISTS visibility_prompt_shown boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_dashboard_seen boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_profile_saved boolean DEFAULT false;

-- Add check constraints for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT check_visibility_mode 
CHECK (visibility_mode IN ('visible', 'invisible'));

-- Create index for better performance on login_count queries
CREATE INDEX IF NOT EXISTS idx_profiles_login_count ON public.profiles(login_count);

-- Create index for visibility_mode queries
CREATE INDEX IF NOT EXISTS idx_profiles_visibility_mode ON public.profiles(visibility_mode);

-- Create function to increment login count (called from application)
CREATE OR REPLACE FUNCTION public.increment_login_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  -- Update and return new login count
  UPDATE public.profiles 
  SET login_count = login_count + 1,
      updated_at = now()
  WHERE id = user_id
  RETURNING login_count INTO new_count;
  
  -- If no rows were updated, the user doesn't exist
  IF new_count IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  RETURN new_count;
END;
$$;