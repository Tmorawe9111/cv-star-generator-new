-- Fix unlock_candidate_profile function to use lowercase 'new' stage value
DROP FUNCTION IF EXISTS public.unlock_candidate_profile(uuid, uuid, text, text, text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.unlock_candidate_profile(uuid, uuid, text, text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.unlock_candidate_profile(uuid, uuid);

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
  SELECT * INTO v_existing_record
  FROM company_candidates
  WHERE company_id = p_company_id 
    AND candidate_id = p_candidate_id;

  IF FOUND THEN
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
      'new',
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