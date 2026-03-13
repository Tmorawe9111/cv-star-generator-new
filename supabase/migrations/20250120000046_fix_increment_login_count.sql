-- Fix increment_login_count to handle missing profiles gracefully
-- Company users don't have profiles, so this function should not throw an error

CREATE OR REPLACE FUNCTION public.increment_login_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
  profile_exists boolean;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
  
  -- If no profile exists (e.g., company user), return 0 silently
  IF NOT profile_exists THEN
    RETURN 0;
  END IF;
  
  -- Update and return new login count
  UPDATE public.profiles 
  SET login_count = login_count + 1,
      updated_at = now()
  WHERE id = user_id
  RETURNING login_count INTO new_count;
  
  -- Return the new count (should always be set if we got here)
  RETURN COALESCE(new_count, 0);
END;
$$;

