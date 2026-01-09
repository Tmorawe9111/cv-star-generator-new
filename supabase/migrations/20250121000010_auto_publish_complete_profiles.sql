-- Auto-publish complete profiles for user-to-user networking
-- This migration ensures that all complete profiles are automatically published
-- so users can find and connect with each other
-- 
-- IMPORTANT: profile_published should only affect company visibility,
-- not user-to-user networking. All complete profiles should be visible to other users.

-- Function to automatically set profile_published = true when profile_complete = true
CREATE OR REPLACE FUNCTION public.auto_publish_complete_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- When a profile is marked as complete, automatically publish it
  -- This ensures users can find and connect with each other
  IF NEW.profile_complete = true AND (OLD.profile_complete IS NULL OR OLD.profile_complete = false) THEN
    NEW.profile_published = true;
  END IF;
  
  -- If profile becomes incomplete, keep published status (user might want to keep it visible)
  -- Only set to false if explicitly requested
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-publish complete profiles
DROP TRIGGER IF EXISTS auto_publish_on_complete ON public.profiles;
CREATE TRIGGER auto_publish_on_complete
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_publish_complete_profiles();

-- Update all existing complete profiles to be published
UPDATE public.profiles
SET profile_published = true
WHERE profile_complete = true
  AND profile_published = false;

-- Add comment for documentation
COMMENT ON FUNCTION public.auto_publish_complete_profiles() IS 'Automatically publishes profiles when they are marked as complete, ensuring user-to-user networking works correctly. profile_published primarily controls company visibility, but complete profiles should be visible to other users.';

COMMENT ON COLUMN public.profiles.profile_published IS 'Controls whether profile is visible to companies. All complete profiles are automatically published for user-to-user networking.';

