-- Migration to prevent incomplete profiles from being created
-- This ensures that profiles can only be created with all required fields

-- Add check constraint to prevent incomplete profiles
-- A profile is considered complete if it has all required fields

-- First, let's add a function to validate profile completeness
CREATE OR REPLACE FUNCTION validate_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a new profile (INSERT) or update
  -- For new profiles, we require all mandatory fields
  IF TG_OP = 'INSERT' THEN
    -- Check required fields for new profiles
    IF NEW.vorname IS NULL OR NEW.vorname = '' THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: Vorname fehlt';
    END IF;
    
    IF NEW.nachname IS NULL OR NEW.nachname = '' THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: Nachname fehlt';
    END IF;
    
    IF NEW.email IS NULL OR NEW.email = '' THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: E-Mail fehlt';
    END IF;
    
    IF NEW.status IS NULL OR NEW.status = '' THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: Status fehlt';
    END IF;
    
    IF NEW.branche IS NULL OR NEW.branche = '' THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: Branche fehlt';
    END IF;
    
    IF NEW.ort IS NULL OR NEW.ort = '' THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: Ort fehlt';
    END IF;
    
    -- Check status-specific requirements
    IF NEW.status IN ('schueler', 'azubi') THEN
      IF NEW.schulbildung IS NULL OR jsonb_array_length(NEW.schulbildung::jsonb) = 0 THEN
        RAISE EXCEPTION 'Profil kann nicht erstellt werden: Schulbildung fehlt (erforderlich für %', NEW.status;
      END IF;
    END IF;
    
    -- Check that at least 1 language is provided
    IF NEW.sprachen IS NULL OR jsonb_array_length(NEW.sprachen::jsonb) = 0 THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: Mindestens 1 Sprache erforderlich';
    END IF;
    
    -- Check that at least 1 language is Muttersprache
    IF NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(NEW.sprachen::jsonb) AS lang
      WHERE lang->>'niveau' = 'Muttersprache'
    ) THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: Mindestens 1 Muttersprache erforderlich';
    END IF;
    
    -- Check that at least 3 skills are provided
    IF NEW.faehigkeiten IS NULL OR array_length(NEW.faehigkeiten, 1) < 3 THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: Mindestens 3 Fähigkeiten erforderlich';
    END IF;
    
    -- Check that ueber_mich (about me) is provided
    IF NEW.ueber_mich IS NULL OR NEW.ueber_mich = '' THEN
      RAISE EXCEPTION 'Profil kann nicht erstellt werden: "Über mich" Text fehlt';
    END IF;
    
    -- Mark profile as complete if all checks pass
    NEW.profile_complete = true;
  END IF;
  
  -- For updates, allow partial updates but prevent setting profile_complete to true if incomplete
  IF TG_OP = 'UPDATE' THEN
    -- Only validate completeness if profile_complete is being set to true
    IF NEW.profile_complete = true AND (OLD.profile_complete IS NULL OR OLD.profile_complete = false) THEN
      -- Re-run the same checks
      IF NEW.vorname IS NULL OR NEW.vorname = '' THEN
        RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: Vorname fehlt';
      END IF;
      
      IF NEW.nachname IS NULL OR NEW.nachname = '' THEN
        RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: Nachname fehlt';
      END IF;
      
      IF NEW.email IS NULL OR NEW.email = '' THEN
        RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: E-Mail fehlt';
      END IF;
      
      IF NEW.status IS NULL OR NEW.status = '' THEN
        RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: Status fehlt';
      END IF;
      
      IF NEW.branche IS NULL OR NEW.branche = '' THEN
        RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: Branche fehlt';
      END IF;
      
      IF NEW.ort IS NULL OR NEW.ort = '' THEN
        RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: Ort fehlt';
      END IF;
      
      IF NEW.status IN ('schueler', 'azubi') THEN
        IF NEW.schulbildung IS NULL OR jsonb_array_length(NEW.schulbildung::jsonb) = 0 THEN
          RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: Schulbildung fehlt';
        END IF;
      END IF;
      
      IF NEW.sprachen IS NULL OR jsonb_array_length(NEW.sprachen::jsonb) = 0 THEN
        RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: Mindestens 1 Sprache erforderlich';
      END IF;
      
      -- Check for Muttersprache in update case
      DECLARE
        has_muttersprache BOOLEAN := false;
        lang_item JSONB;
      BEGIN
        IF NEW.sprachen IS NOT NULL AND jsonb_typeof(NEW.sprachen::jsonb) = 'array' THEN
          FOR lang_item IN SELECT * FROM jsonb_array_elements(NEW.sprachen::jsonb)
          LOOP
            IF lang_item->>'niveau' = 'Muttersprache' THEN
              has_muttersprache := true;
              EXIT;
            END IF;
          END LOOP;
        END IF;
        
        IF NOT has_muttersprache THEN
          RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: Mindestens 1 Muttersprache erforderlich';
        END IF;
      END;
      
      IF NEW.faehigkeiten IS NULL OR array_length(NEW.faehigkeiten, 1) < 3 THEN
        RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: Mindestens 3 Fähigkeiten erforderlich';
      END IF;
      
      IF NEW.ueber_mich IS NULL OR NEW.ueber_mich = '' THEN
        RAISE EXCEPTION 'Profil kann nicht als vollständig markiert werden: "Über mich" Text fehlt';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate profile completeness before insert/update
DROP TRIGGER IF EXISTS validate_profile_completeness_trigger ON public.profiles;
CREATE TRIGGER validate_profile_completeness_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_completeness();

-- Add comment explaining the constraint
COMMENT ON FUNCTION validate_profile_completeness() IS 
'Validates that profiles have all required fields before being created or marked as complete. Prevents "Unbekanntes Profil" errors.';

-- Also add a check constraint for profile_complete flag
-- This ensures profile_complete can only be true if all required fields are present
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profile_complete_check;

-- Note: The trigger handles the validation, but we can also add a check constraint
-- However, check constraints can't easily validate JSON arrays, so the trigger is better

