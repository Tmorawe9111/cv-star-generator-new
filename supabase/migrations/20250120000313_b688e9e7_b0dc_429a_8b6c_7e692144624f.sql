-- Fix unlock_candidate_profile JSONB handling and update both job_id and job_post_id
-- Root cause: JSON.stringify() creates a string, but we need JSONB array

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
  v_job_ids uuid[];
  v_updated_count int;
BEGIN
  -- Resolve candidate_id to profile_id
  SELECT user_id INTO v_profile_id 
  FROM candidates 
  WHERE id = p_candidate_id;
  
  IF v_profile_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_candidate_id) THEN
      v_profile_id := p_candidate_id;
    ELSE
      RAISE EXCEPTION 'Profile not found for candidate_id: %', p_candidate_id;
    END IF;
  END IF;

  -- Parse JSONB array directly (not as text)
  IF p_linked_job_ids IS NOT NULL AND jsonb_typeof(p_linked_job_ids) = 'array' THEN
    BEGIN
      -- Convert JSONB array to UUID array
      SELECT ARRAY(
        SELECT (value#>>'{}')::uuid 
        FROM jsonb_array_elements(p_linked_job_ids)
      ) INTO v_job_ids;
      
      RAISE NOTICE 'Parsed job IDs: %', v_job_ids;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not parse job IDs: %', SQLERRM;
      v_job_ids := ARRAY[]::uuid[];
    END;
  ELSE
    v_job_ids := ARRAY[]::uuid[];
  END IF;

  -- Upsert company_candidates
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
  )
  ON CONFLICT (company_id, candidate_id) DO UPDATE SET
    source = COALESCE(EXCLUDED.source, company_candidates.source),
    unlock_type = COALESCE(EXCLUDED.unlock_type, company_candidates.unlock_type),
    notes = COALESCE(EXCLUDED.notes, company_candidates.notes),
    unlocked_by_user_id = COALESCE(EXCLUDED.unlocked_by_user_id, company_candidates.unlocked_by_user_id),
    linked_job_ids = COALESCE(EXCLUDED.linked_job_ids, company_candidates.linked_job_ids),
    unlocked_at = COALESCE(company_candidates.unlocked_at, now()),
    updated_at = now();

  -- CRITICAL: Update applications for bewerbung unlocks
  -- Update BOTH job_id and job_post_id (both exist and have same value)
  IF p_unlock_type = 'bewerbung' AND array_length(v_job_ids, 1) > 0 THEN
    -- Update using job_post_id (primary column)
    UPDATE applications
    SET 
      unlocked_at = now(),
      stage = 'unlocked',
      updated_at = now()
    WHERE candidate_id = v_profile_id
      AND company_id = p_company_id
      AND job_post_id = ANY(v_job_ids)
      AND unlocked_at IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % applications for profile % with job_post_ids %', v_updated_count, v_profile_id, v_job_ids;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'job_ids', v_job_ids,
    'applications_updated', COALESCE(v_updated_count, 0)
  );
END;
$function$;