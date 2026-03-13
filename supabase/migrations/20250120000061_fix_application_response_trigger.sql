-- Fix trigger to remove 'accepted' status check (doesn't exist in enum)
-- Only check for 'rejected' status

CREATE OR REPLACE FUNCTION update_application_response_at()
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

-- Trigger is already created, function is just updated

