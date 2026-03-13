-- Step 1: Delete orphaned entries in company_candidates that reference non-existent profiles
DELETE FROM public.company_candidates
WHERE candidate_id NOT IN (SELECT id FROM public.profiles);

-- Step 2: Drop the old constraint
ALTER TABLE public.company_candidates 
DROP CONSTRAINT IF EXISTS fk_company_candidates_candidate;

-- Step 3: Add new constraint referencing profiles instead of candidates
ALTER TABLE public.company_candidates 
ADD CONSTRAINT fk_company_candidates_profile 
FOREIGN KEY (candidate_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Step 4: Create RPC function for unlocking profiles with proper permissions
CREATE OR REPLACE FUNCTION public.unlock_candidate_profile(
  p_company_id uuid,
  p_candidate_id uuid,
  p_source text,
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
  v_result jsonb;
BEGIN
  -- Upsert company_candidates entry
  INSERT INTO public.company_candidates (
    company_id,
    candidate_id,
    source,
    notes,
    unlocked_at,
    unlocked_by_user_id,
    stage,
    last_touched_at,
    linked_job_ids
  )
  VALUES (
    p_company_id,
    p_candidate_id,
    p_source,
    p_notes,
    now(),
    p_unlocked_by_user_id,
    'new',
    now(),
    p_linked_job_ids
  )
  ON CONFLICT (company_id, candidate_id)
  DO UPDATE SET
    source = COALESCE(EXCLUDED.source, company_candidates.source),
    notes = COALESCE(EXCLUDED.notes, company_candidates.notes),
    unlocked_at = COALESCE(company_candidates.unlocked_at, now()),
    linked_job_ids = EXCLUDED.linked_job_ids,
    last_touched_at = now()
  RETURNING jsonb_build_object(
    'success', true,
    'id', id,
    'candidate_id', candidate_id
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;