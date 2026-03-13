-- Fix sync_application_rejection trigger to use correct stage value
DROP TRIGGER IF EXISTS application_rejection_sync ON applications;
DROP FUNCTION IF EXISTS sync_application_rejection();

CREATE OR REPLACE FUNCTION sync_application_rejection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When application is rejected, update company_candidates
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    UPDATE company_candidates
    SET 
      stage = 'archived',  -- Fixed: lowercase 'archived' to match check constraint
      notes = COALESCE(notes || E'\n\n', '') || 
              'Bewerbung abgelehnt' ||
              CASE 
                WHEN NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason != '' 
                THEN ': ' || NEW.rejection_reason 
                ELSE '' 
              END,
      updated_at = now()
    WHERE company_id = NEW.company_id 
      AND candidate_id = NEW.candidate_id;
  END IF;
  
  -- When application is unlocked/viewed, set unlocked_at
  IF NEW.viewed_by_company = true AND (OLD.viewed_by_company IS NULL OR OLD.viewed_by_company = false) THEN
    NEW.unlocked_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER application_rejection_sync
AFTER UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION sync_application_rejection();