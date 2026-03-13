-- Add unlock_type column to company_candidates
ALTER TABLE company_candidates 
ADD COLUMN IF NOT EXISTS unlock_type TEXT;

-- Migrate existing data from source to unlock_type
UPDATE company_candidates 
SET unlock_type = CASE 
  WHEN source = 'bewerbung' THEN 'bewerbung'
  WHEN source = 'initiativ' THEN 'initiativ'
  WHEN source = 'match' THEN 'match'
  WHEN source = 'community' THEN 'community'
  WHEN source = 'search' THEN 'search'
  ELSE 'initiativ'
END
WHERE unlock_type IS NULL;

-- Drop old function
DROP FUNCTION IF EXISTS public.unlock_candidate_profile(uuid, uuid, text, text, uuid, jsonb);

-- Create updated unlock_candidate_profile with unlock_type parameter
CREATE OR REPLACE FUNCTION public.unlock_candidate_profile(
  p_company_id uuid,
  p_candidate_id uuid,
  p_source text,
  p_unlock_type text,
  p_notes text,
  p_unlocked_by_user_id uuid,
  p_linked_job_ids jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_record RECORD;
BEGIN
  -- Check if already exists
  SELECT * INTO v_existing_record
  FROM company_candidates
  WHERE company_id = p_company_id 
    AND candidate_id = p_candidate_id;

  IF FOUND THEN
    -- Update existing record
    UPDATE company_candidates
    SET 
      source = COALESCE(p_source, source),
      unlock_type = COALESCE(p_unlock_type, unlock_type),
      notes = COALESCE(p_notes, notes),
      unlocked_by_user_id = COALESCE(p_unlocked_by_user_id, unlocked_by_user_id),
      linked_job_ids = COALESCE(p_linked_job_ids, linked_job_ids),
      updated_at = now()
    WHERE company_id = p_company_id 
      AND candidate_id = p_candidate_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'updated',
      'candidate_id', p_candidate_id
    );
  ELSE
    -- Insert new record
    INSERT INTO company_candidates (
      company_id,
      candidate_id,
      source,
      unlock_type,
      stage,
      notes,
      unlocked_by_user_id,
      linked_job_ids,
      unlocked_at
    ) VALUES (
      p_company_id,
      p_candidate_id,
      p_source,
      p_unlock_type,
      'Neu',
      p_notes,
      p_unlocked_by_user_id,
      p_linked_job_ids,
      now()
    );

    RETURN jsonb_build_object(
      'success', true,
      'action', 'created',
      'candidate_id', p_candidate_id
    );
  END IF;
END;
$$;