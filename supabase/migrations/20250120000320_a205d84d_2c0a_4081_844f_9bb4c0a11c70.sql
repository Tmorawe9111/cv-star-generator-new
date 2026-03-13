-- Create RPC function to move application stage
CREATE OR REPLACE FUNCTION move_application_stage(
  p_application_id UUID,
  p_new_stage TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the stage of the application
  UPDATE applications
  SET 
    stage = p_new_stage,
    updated_at = NOW()
  WHERE id = p_application_id;
END;
$$;