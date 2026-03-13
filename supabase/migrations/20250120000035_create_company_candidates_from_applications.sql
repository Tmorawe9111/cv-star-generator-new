-- Create company_candidates records automatically when new applications are submitted
-- This ensures new applications appear in the dashboard under "Neue Bewerbungen"

CREATE OR REPLACE FUNCTION create_company_candidate_from_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_profile_id UUID;
  v_existing_record RECORD;
BEGIN
  -- Only process new applications (status = 'new' and source = 'applied')
  IF NEW.status != 'new'::application_status OR NEW.source != 'applied'::application_source THEN
    RETURN NEW;
  END IF;

  -- Get the profile_id from candidate_id
  -- applications.candidate_id can reference either candidates.id or profiles.id directly
  -- Try candidates table first (most common case)
  SELECT c.user_id INTO v_profile_id
  FROM candidates c
  WHERE c.id = NEW.candidate_id;
  
  -- If not found in candidates, check if candidate_id is already a profile_id
  IF v_profile_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.candidate_id) THEN
      v_profile_id := NEW.candidate_id;
    ELSE
      -- Skip if we can't find the profile
      RETURN NEW;
    END IF;
  END IF;

  -- Check if company_candidates record already exists
  SELECT * INTO v_existing_record
  FROM company_candidates
  WHERE company_id = NEW.company_id
    AND candidate_id = v_profile_id;

  IF FOUND THEN
    -- Update existing record to ensure it has the correct status for new applications
    UPDATE company_candidates
    SET 
      linked_job_ids = CASE 
        WHEN NEW.job_id IS NOT NULL AND (linked_job_ids IS NULL OR linked_job_ids = '[]'::jsonb OR NOT (linked_job_ids @> jsonb_build_array(NEW.job_id::text)))
        THEN COALESCE(linked_job_ids, '[]'::jsonb) || jsonb_build_array(NEW.job_id::text)
        ELSE linked_job_ids
      END,
      source = COALESCE(source, 'bewerbung'),
      updated_at = now(),
      stage = CASE
        WHEN stage IS NULL OR stage NOT IN ('freigeschaltet', 'interview_planned', 'interview_durchgefuehrt', 'angebot_gesendet', 'eingestellt', 'abgelehnt')
        THEN 'new'
        ELSE stage
      END
    WHERE company_id = NEW.company_id
      AND candidate_id = v_profile_id;
  ELSE
    -- Insert new company_candidates record for the new application
    INSERT INTO company_candidates (
      company_id,
      candidate_id,
      source,
      unlock_type,
      stage,
      status,
      linked_job_ids,
      created_at,
      updated_at
    ) VALUES (
      NEW.company_id,
      v_profile_id,
      'bewerbung',
      NULL,
      'new',
      'FREIGESCHALTET'::candidate_status,
      CASE WHEN NEW.job_id IS NOT NULL THEN jsonb_build_array(NEW.job_id::text) ELSE '[]'::jsonb END,
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_company_candidate_from_application ON applications;

-- Create trigger that fires after a new application is inserted
CREATE TRIGGER trigger_create_company_candidate_from_application
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION create_company_candidate_from_application();
