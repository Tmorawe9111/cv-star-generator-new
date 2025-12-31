-- ============================================
-- FIX: Profile Email Synchronisation
-- ============================================
-- This migration fixes email mismatches between auth.users and profiles tables
-- and ensures emails stay synchronized

-- Step 1: Find and report all email mismatches
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.email IS DISTINCT FROM LOWER(TRIM(u.email));
  
  RAISE NOTICE 'Found % profiles with email mismatches', mismatch_count;
END $$;

-- Step 2: Fix email mismatches by syncing from auth.users
UPDATE profiles p
SET 
  email = LOWER(TRIM(u.email)),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS DISTINCT FROM LOWER(TRIM(u.email));

-- Step 3: Create a function to sync email on profile updates
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_email TEXT;
BEGIN
  -- Get email from auth.users
  SELECT LOWER(TRIM(email)) INTO auth_email
  FROM auth.users
  WHERE id = NEW.id;
  
  -- If email exists in auth.users and doesn't match, sync it
  IF auth_email IS NOT NULL AND NEW.email IS DISTINCT FROM auth_email THEN
    NEW.email := auth_email;
    RAISE NOTICE 'Synced email from auth.users: % -> %', OLD.email, NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 4: Create trigger to auto-sync email before profile updates
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON public.profiles;

CREATE TRIGGER sync_profile_email_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

-- Step 5: Create a function to ensure email matches on insert
CREATE OR REPLACE FUNCTION public.ensure_profile_email_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_email TEXT;
BEGIN
  -- Get email from auth.users
  SELECT LOWER(TRIM(email)) INTO auth_email
  FROM auth.users
  WHERE id = NEW.id;
  
  -- Always use email from auth.users if available
  IF auth_email IS NOT NULL THEN
    NEW.email := auth_email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 6: Create trigger to ensure email matches on insert
DROP TRIGGER IF EXISTS ensure_profile_email_on_insert_trigger ON public.profiles;

CREATE TRIGGER ensure_profile_email_on_insert_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_profile_email_on_insert();

-- Step 7: Create a function to sync email when auth.users email changes
CREATE OR REPLACE FUNCTION public.sync_profile_email_on_auth_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile email when auth.users email changes
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET 
      email = LOWER(TRIM(NEW.email)),
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Synced profile email after auth.users change: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 8: Create trigger on auth.users to sync profile email
-- Note: This must be run manually in Supabase SQL Editor with admin privileges
-- because it requires access to the auth schema
-- 
-- To run manually:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Run this command:
/*
CREATE TRIGGER sync_profile_email_on_auth_change_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email_on_auth_change();
*/

-- Step 9: Create a view to monitor email mismatches
CREATE OR REPLACE VIEW public.profile_email_mismatches AS
SELECT 
  p.id,
  p.email as profile_email,
  p.vorname,
  p.nachname,
  u.email as auth_email,
  CASE 
    WHEN p.email IS DISTINCT FROM LOWER(TRIM(u.email)) THEN 'MISMATCH'
    ELSE 'OK'
  END as status,
  p.updated_at,
  u.updated_at as auth_updated_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email IS DISTINCT FROM LOWER(TRIM(u.email))
ORDER BY p.updated_at DESC;

-- Grant access to authenticated users to view their own mismatch status
GRANT SELECT ON public.profile_email_mismatches TO authenticated;

-- Step 10: Create a function to manually fix a specific profile
CREATE OR REPLACE FUNCTION public.fix_profile_email(p_user_id UUID)
RETURNS TABLE(
  old_email TEXT,
  new_email TEXT,
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_email TEXT;
  v_new_email TEXT;
BEGIN
  -- Get current profile email
  SELECT email INTO v_old_email
  FROM profiles
  WHERE id = p_user_id;
  
  -- Get email from auth.users
  SELECT LOWER(TRIM(email)) INTO v_new_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Update profile email
  IF v_new_email IS NOT NULL THEN
    UPDATE profiles
    SET 
      email = v_new_email,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT v_old_email, v_new_email, TRUE;
  ELSE
    RETURN QUERY SELECT v_old_email, NULL::TEXT, FALSE;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.fix_profile_email(UUID) TO authenticated;

-- Step 11: Add comment explaining the fix
COMMENT ON FUNCTION public.sync_profile_email() IS 
  'Automatically syncs email from auth.users to profiles table before updates to prevent mismatches';

COMMENT ON FUNCTION public.ensure_profile_email_on_insert() IS 
  'Ensures profile email matches auth.users email when creating new profiles';

COMMENT ON VIEW public.profile_email_mismatches IS 
  'Shows all profiles where email does not match auth.users email';

