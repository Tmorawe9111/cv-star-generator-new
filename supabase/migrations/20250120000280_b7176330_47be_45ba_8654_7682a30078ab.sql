-- Erweitere applications Tabelle mit neuen Status-Feldern
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS interview_note text,
ADD COLUMN IF NOT EXISTS contacted_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contacted_confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS unlocked_at timestamptz,
ADD COLUMN IF NOT EXISTS company_response_at timestamptz;

-- Erstelle application_reminders Tabelle für Benachrichtigungs-Tracking
CREATE TABLE IF NOT EXISTS application_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('contact_confirmation', 'interview_scheduled')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id, reminder_type)
);

-- Enable RLS
ALTER TABLE application_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies für application_reminders
CREATE POLICY "Companies can view their reminders"
  ON application_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN company_users cu ON cu.company_id = a.company_id
      WHERE a.id = application_reminders.application_id
      AND cu.user_id = auth.uid()
    )
  );

-- Funktion zum Aktualisieren des unlocked_at Timestamps
CREATE OR REPLACE FUNCTION update_application_unlocked_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.viewed_by_company = true AND OLD.viewed_by_company = false THEN
    NEW.unlocked_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für automatisches Setzen von unlocked_at
DROP TRIGGER IF EXISTS trigger_update_application_unlocked_at ON applications;
CREATE TRIGGER trigger_update_application_unlocked_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_application_unlocked_at();

-- Funktion zum Aktualisieren des company_response_at Timestamps
CREATE OR REPLACE FUNCTION update_application_response_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('accepted', 'rejected') AND OLD.status != NEW.status THEN
    NEW.company_response_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für automatisches Setzen von company_response_at
DROP TRIGGER IF EXISTS trigger_update_application_response_at ON applications;
CREATE TRIGGER trigger_update_application_response_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_application_response_at();