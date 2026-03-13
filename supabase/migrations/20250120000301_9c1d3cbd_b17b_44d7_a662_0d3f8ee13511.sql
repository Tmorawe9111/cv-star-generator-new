-- 1. Extend unlock_candidate_profile to resolve candidates.id → profiles.id
CREATE OR REPLACE FUNCTION public.unlock_candidate_profile(
  p_company_id uuid,
  p_candidate_id uuid,
  p_source text,
  p_unlock_type text,
  p_linked_job_ids jsonb,
  p_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Try to resolve candidates.id → profiles.id
  SELECT user_id INTO v_profile_id 
  FROM candidates 
  WHERE id = p_candidate_id;
  
  -- If not found, assume p_candidate_id is already profiles.id
  IF v_profile_id IS NULL THEN
    v_profile_id := p_candidate_id;
  END IF;
  
  -- Insert or update company_candidates with resolved profile_id
  INSERT INTO company_candidates (
    company_id,
    candidate_id,
    source,
    unlock_type,
    linked_job_ids,
    notes,
    unlocked_at,
    unlocked_by_user_id
  )
  VALUES (
    p_company_id,
    v_profile_id,
    p_source,
    p_unlock_type,
    p_linked_job_ids,
    p_notes,
    now(),
    auth.uid()
  )
  ON CONFLICT (company_id, candidate_id) 
  DO UPDATE SET
    linked_job_ids = EXCLUDED.linked_job_ids,
    notes = EXCLUDED.notes,
    updated_at = now();
END;
$$;

-- 2. Create function to update job assignment for already unlocked candidates
CREATE OR REPLACE FUNCTION public.update_candidate_job_assignment(
  p_company_id uuid,
  p_candidate_id uuid,
  p_linked_job_ids jsonb,
  p_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Try to resolve candidates.id → profiles.id
  SELECT user_id INTO v_profile_id 
  FROM candidates 
  WHERE id = p_candidate_id;
  
  -- If not found, assume p_candidate_id is already profiles.id
  IF v_profile_id IS NULL THEN
    v_profile_id := p_candidate_id;
  END IF;
  
  -- Update existing company_candidates record
  UPDATE company_candidates
  SET 
    linked_job_ids = p_linked_job_ids,
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE 
    company_id = p_company_id 
    AND candidate_id = v_profile_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kandidat ist noch nicht freigeschaltet';
  END IF;
END;
$$;