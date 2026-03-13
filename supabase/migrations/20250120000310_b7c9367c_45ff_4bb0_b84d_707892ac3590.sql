-- Fix unlock_candidate_profile to resolve candidate ID to profile ID
-- This fixes the FK constraint violation when unlocking applicants

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
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_id uuid;
  v_existing_record RECORD;
BEGIN
  -- CRITICAL: Resolve candidate_id to profile_id
  -- If p_candidate_id is from candidates table, get the user_id (which is profiles.id)
  -- If p_candidate_id is already a profile_id, use it directly
  
  SELECT user_id INTO v_profile_id 
  FROM candidates 
  WHERE id = p_candidate_id;
  
  -- If not found in candidates, assume it's already a profile_id
  IF v_profile_id IS NULL THEN
    -- Check if it exists in profiles
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_candidate_id) THEN
      v_profile_id := p_candidate_id;
    ELSE
      RAISE EXCEPTION 'Profile not found for candidate_id: %', p_candidate_id;
    END IF;
  END IF;

  -- Check if record already exists
  SELECT * INTO v_existing_record
  FROM company_candidates
  WHERE company_id = p_company_id 
    AND candidate_id = v_profile_id;

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
      AND candidate_id = v_profile_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'updated',
      'candidate_id', v_profile_id
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
      v_profile_id,
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
      'candidate_id', v_profile_id
    );
  END IF;
END;
$function$;