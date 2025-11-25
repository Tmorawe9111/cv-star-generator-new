-- Fix: Remove any reference to viewed_by_company in all functions and triggers
-- This field was removed in migration 20251106135125 but might still be referenced

-- 1. Drop the problematic trigger that uses viewed_by_company
DROP TRIGGER IF EXISTS trigger_update_application_unlocked_at ON public.applications;

-- 2. Drop or recreate the function without viewed_by_company
DROP FUNCTION IF EXISTS public.update_application_unlocked_at();

-- 3. Recreate set_application_status without viewed_by_company references
-- Also sync company_candidates status when application status changes
CREATE OR REPLACE FUNCTION public.set_application_status(
  _application_id uuid,
  _new_status application_status,
  _reason_short text DEFAULT NULL,
  _reason_custom text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _app applications%ROWTYPE;
  _candidate_status candidate_status;
  _stage text;
BEGIN
  -- Get application
  SELECT * INTO _app
  FROM applications
  WHERE id = _application_id;

  IF _app.id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- Check if user has access to this company
  IF NOT EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = _app.company_id 
    AND cu.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to company';
  END IF;

  -- Map application_status to company_candidates status and stage
  -- Note: For "new" applications, we keep status as NULL or a special value so they appear in "new" list
  -- The pipeline filter checks: STATUS_GROUPS.new.includes(status) OR (stage === 'new' AND source === 'bewerbung')
  _candidate_status := CASE _new_status
    WHEN 'new' THEN NULL::candidate_status  -- Keep NULL so it matches stage='new' filter
    WHEN 'unlocked' THEN 'FREIGESCHALTET'::candidate_status
    WHEN 'interview' THEN 'INTERVIEW_GEPLANT'::candidate_status
    WHEN 'offer' THEN 'ANGEBOT_GESENDET'::candidate_status
    WHEN 'hired' THEN 'EINGESTELLT'::candidate_status
    WHEN 'rejected' THEN 'ABGELEHNT'::candidate_status
    WHEN 'archived' THEN 'ABGELEHNT'::candidate_status
    ELSE 'FREIGESCHALTET'::candidate_status
  END;

  _stage := CASE _new_status
    WHEN 'new' THEN 'new'
    WHEN 'unlocked' THEN 'unlocked'
    WHEN 'interview' THEN 'interview_planned'
    WHEN 'offer' THEN 'offer'
    WHEN 'hired' THEN 'hired'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'archived' THEN 'archived'
    ELSE 'unlocked'
  END;

  -- Update application status (without viewed_by_company - field doesn't exist)
  UPDATE applications
  SET 
    status = _new_status,
    reason_short = COALESCE(_reason_short, reason_short),
    reason_custom = COALESCE(_reason_custom, reason_custom),
    updated_at = now()
  WHERE id = _application_id;

  -- Sync company_candidates status and stage for this application
  -- Only update if status is not NULL (for 'new' we keep existing status)
  IF _candidate_status IS NOT NULL THEN
    UPDATE company_candidates
    SET 
      status = _candidate_status,
      stage = _stage,
      updated_at = now(),
      last_touched_at = now()
    WHERE company_id = _app.company_id
      AND candidate_id = _app.candidate_id
      AND (source = 'bewerbung' OR origin = 'bewerbung');
  ELSE
    -- For 'new' status, only update stage
    UPDATE company_candidates
    SET 
      stage = _stage,
      updated_at = now(),
      last_touched_at = now()
    WHERE company_id = _app.company_id
      AND candidate_id = _app.candidate_id
      AND (source = 'bewerbung' OR origin = 'bewerbung');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', _application_id,
    'old_status', _app.status,
    'new_status', _new_status,
    'message', 'Status updated successfully'
  );
END;
$$;

-- 4. Ensure all triggers on applications don't reference viewed_by_company
-- Drop any remaining triggers that might use the old field
DROP TRIGGER IF EXISTS trigger_update_application_response_at ON public.applications;

-- 5. Recreate update_application_response_at without viewed_by_company (if needed)
-- This trigger was checking for 'accepted' status which doesn't exist, so we simplify it
CREATE OR REPLACE FUNCTION public.update_application_response_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update company_response_at when status changes to 'rejected'
  -- 'accepted' doesn't exist in application_status enum
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    NEW.company_response_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger if it was dropped
DROP TRIGGER IF EXISTS trigger_update_application_response_at ON public.applications;
CREATE TRIGGER trigger_update_application_response_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_response_at();

