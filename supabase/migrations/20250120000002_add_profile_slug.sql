-- ============================================
-- ADD: Profile Slug (Vorname + 3-digit number)
-- ============================================
-- This migration adds a profile_slug field to profiles table
-- Format: vorname + 3-digit random number (e.g., "max123", "sarah456")

-- Step 1: Add profile_slug column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_slug TEXT UNIQUE;

-- Step 2: Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_slug ON public.profiles(profile_slug);

-- Step 3: Create function to generate unique profile slug
CREATE OR REPLACE FUNCTION public.generate_profile_slug(p_vorname TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_slug TEXT;
  v_slug TEXT;
  v_counter INTEGER;
  v_exists BOOLEAN;
BEGIN
  -- Sanitize vorname: lowercase, remove special chars, replace spaces with hyphens
  v_base_slug := LOWER(REGEXP_REPLACE(TRIM(p_vorname), '[^a-z0-9äöüß]', '', 'g'));
  
  -- If vorname is empty or null, use 'user' as base
  IF v_base_slug IS NULL OR v_base_slug = '' THEN
    v_base_slug := 'user';
  END IF;
  
  -- Try to find a unique slug by appending random 3-digit numbers
  v_counter := 0;
  LOOP
    -- Generate random 3-digit number (100-999)
    v_slug := v_base_slug || (100 + FLOOR(RANDOM() * 900)::INTEGER)::TEXT;
    
    -- Check if slug already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE profile_slug = v_slug) INTO v_exists;
    
    -- If unique, return it
    IF NOT v_exists THEN
      RETURN v_slug;
    END IF;
    
    -- Prevent infinite loop (max 100 attempts)
    v_counter := v_counter + 1;
    IF v_counter > 100 THEN
      -- Fallback: use timestamp-based slug
      v_slug := v_base_slug || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
      RETURN v_slug;
    END IF;
  END LOOP;
END;
$$;

-- Step 4: Create function to auto-generate slug on profile insert/update
CREATE OR REPLACE FUNCTION public.ensure_profile_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate slug if:
  -- 1. profile_slug is NULL or empty
  -- 2. vorname exists and is not empty
  IF (NEW.profile_slug IS NULL OR NEW.profile_slug = '') 
     AND NEW.vorname IS NOT NULL 
     AND TRIM(NEW.vorname) != '' THEN
    NEW.profile_slug := public.generate_profile_slug(NEW.vorname);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger to auto-generate slug
DROP TRIGGER IF EXISTS ensure_profile_slug_trigger ON public.profiles;
CREATE TRIGGER ensure_profile_slug_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_profile_slug();

-- Step 6: Generate slugs for existing profiles
DO $$
DECLARE
  profile_record RECORD;
  new_slug TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id, vorname, profile_slug 
    FROM public.profiles 
    WHERE (profile_slug IS NULL OR profile_slug = '') 
      AND vorname IS NOT NULL 
      AND TRIM(vorname) != ''
  LOOP
    -- Generate unique slug
    new_slug := public.generate_profile_slug(profile_record.vorname);
    
    -- Update profile with new slug
    UPDATE public.profiles
    SET profile_slug = new_slug
    WHERE id = profile_record.id;
    
    RAISE NOTICE 'Generated slug % for profile %', new_slug, profile_record.id;
  END LOOP;
END $$;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_profile_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_slug() TO authenticated;

