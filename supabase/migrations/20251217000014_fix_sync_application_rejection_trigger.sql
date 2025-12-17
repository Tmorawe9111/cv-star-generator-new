-- Fix legacy sync_application_rejection trigger that referenced removed columns (viewed_by_company / rejection_reason).
-- New canonical schema: applications has (status, reason_short, reason_custom, unlocked_at, updated_at).

DROP TRIGGER IF EXISTS application_rejection_sync ON public.applications;

CREATE OR REPLACE FUNCTION public.sync_application_rejection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason text;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  v_reason := NULLIF(COALESCE(NEW.reason_custom, NEW.reason_short, ''), '');

  -- Candidate/company ended the process -> reflect in company_candidates
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('rejected', 'archived') THEN
    UPDATE public.company_candidates
    SET
      stage = 'archived',
      status = CASE
        WHEN NEW.status = 'archived' THEN 'ABGESAGT'::candidate_status
        ELSE 'ABGELEHNT'::candidate_status
      END,
      notes = COALESCE(notes || E'\n\n', '') ||
        CASE
          WHEN NEW.status = 'archived' THEN 'Bewerbung vom Kandidaten abgesagt'
          ELSE 'Bewerbung abgelehnt'
        END ||
        CASE WHEN v_reason IS NOT NULL THEN ': ' || v_reason ELSE '' END,
      updated_at = now(),
      last_touched_at = now()
    WHERE company_id = NEW.company_id
      AND candidate_id = NEW.candidate_id;
  END IF;

  -- Unlock should also keep the company_candidates stage/status coherent
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'unlocked' THEN
    UPDATE public.company_candidates
    SET
      stage = COALESCE(stage, 'unlocked'),
      status = COALESCE(status, 'FREIGESCHALTET'::candidate_status),
      unlocked_at = COALESCE(unlocked_at, NEW.unlocked_at, now()),
      updated_at = now(),
      last_touched_at = now()
    WHERE company_id = NEW.company_id
      AND candidate_id = NEW.candidate_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER application_rejection_sync
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.sync_application_rejection();


