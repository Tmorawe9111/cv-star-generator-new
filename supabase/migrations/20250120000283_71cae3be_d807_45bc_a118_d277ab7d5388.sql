-- Add archiving fields to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_applications_archived 
ON applications(archived_at) WHERE archived_at IS NOT NULL;

-- Comment columns
COMMENT ON COLUMN applications.archived_at IS 'Zeitstempel wann Bewerbung archiviert wurde';
COMMENT ON COLUMN applications.archived_by IS 'User der die Bewerbung archiviert hat';
COMMENT ON COLUMN applications.rejection_reason IS 'Grund für Ablehnung/Archivierung';

-- RPC: Archive application
CREATE OR REPLACE FUNCTION archive_application(
  p_application_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user has access to this application's company
  SELECT a.company_id INTO v_company_id
  FROM applications a
  WHERE a.id = p_application_id;

  IF NOT EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.user_id = v_user_id 
    AND cu.company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Archive the application
  UPDATE applications
  SET 
    archived_at = NOW(),
    archived_by = v_user_id,
    rejection_reason = p_rejection_reason,
    status = 'rejected'
  WHERE id = p_application_id;
END;
$$;