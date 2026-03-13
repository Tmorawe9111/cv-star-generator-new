-- Trigger to automatically sync status when stage is updated
-- This ensures that when stage is updated directly (e.g., in Unlocked page),
-- the status field is also updated to match

CREATE OR REPLACE FUNCTION public.sync_stage_to_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status candidate_status;
BEGIN
  -- Only update if stage changed and status doesn't match
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    -- Map stage to status enum
    v_status := CASE UPPER(COALESCE(NEW.stage, ''))
      WHEN 'FREIGESCHALTET' THEN 'FREIGESCHALTET'::candidate_status
      WHEN 'INTERVIEW_GEPLANT' THEN 'INTERVIEW_GEPLANT'::candidate_status
      WHEN 'INTERVIEW_DURCHGEFÜHRT' THEN 'INTERVIEW_DURCHGEFÜHRT'::candidate_status
      WHEN 'ANGEBOT_GESENDET' THEN 'ANGEBOT_GESENDET'::candidate_status
      WHEN 'EINGESTELLT' THEN 'EINGESTELLT'::candidate_status
      WHEN 'ABGESAGT' THEN 'ABGESAGT'::candidate_status
      WHEN 'ABGELEHNT' THEN 'ABGELEHNT'::candidate_status
      WHEN 'ON_HOLD' THEN 'ON_HOLD'::candidate_status
      WHEN 'NEW' THEN 'FREIGESCHALTET'::candidate_status
      WHEN 'UNLOCKED' THEN 'FREIGESCHALTET'::candidate_status
      WHEN 'KONTAKTIERT' THEN 'INTERVIEW_GEPLANT'::candidate_status
      WHEN 'INTERVIEW' THEN 'INTERVIEW_GEPLANT'::candidate_status
      WHEN 'INTERVIEW_PLANNED' THEN 'INTERVIEW_GEPLANT'::candidate_status
      WHEN 'INTERVIEW_DONE' THEN 'INTERVIEW_DURCHGEFÜHRT'::candidate_status
      WHEN 'INTERVIEW_COMPLETED' THEN 'INTERVIEW_DURCHGEFÜHRT'::candidate_status
      WHEN 'OFFER' THEN 'ANGEBOT_GESENDET'::candidate_status
      WHEN 'HIRED' THEN 'EINGESTELLT'::candidate_status
      WHEN 'REJECTED' THEN 'ABGELEHNT'::candidate_status
      WHEN 'ARCHIVED' THEN 'ABGELEHNT'::candidate_status
      ELSE COALESCE(NEW.status, 'FREIGESCHALTET'::candidate_status)
    END;
    
    -- Update status if it doesn't match
    IF NEW.status IS NULL OR NEW.status != v_status THEN
      NEW.status := v_status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS sync_stage_to_status_trigger ON public.company_candidates;
CREATE TRIGGER sync_stage_to_status_trigger
  BEFORE UPDATE ON public.company_candidates
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION public.sync_stage_to_status();

