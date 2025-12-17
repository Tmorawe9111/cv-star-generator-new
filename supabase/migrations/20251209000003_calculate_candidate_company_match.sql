-- Migration: Implement calculate_candidate_company_match orchestrator function
-- Purpose: Main function to calculate and store Candidate ↔ Company matching scores
-- This function orchestrates eligibility check, score calculation, and storage

-- NOTE: This function requires check_candidate_company_eligibility to exist.
-- If it doesn't exist, a fallback is implemented that assumes eligible=true.
-- For production, ensure check_candidate_company_eligibility is properly implemented.

-- Function: calculate_candidate_company_match
-- Orchestrates the complete matching process: eligibility → scoring → storage
CREATE OR REPLACE FUNCTION public.calculate_candidate_company_match(
  p_company_id uuid,
  p_candidate_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_eligible boolean;
  v_ineligible_reasons jsonb;
  v_base_score int;
  v_overall_score int;
  v_score_breakdown jsonb;
  v_result jsonb;
  
  -- Eligibility check result (assuming function returns record with is_eligible and reasons)
  v_eligibility_result record;
BEGIN
  -- ============================================
  -- 1. CHECK ELIGIBILITY
  -- ============================================
  
  -- Call eligibility function
  -- NOTE: Assuming check_candidate_company_eligibility returns a record with:
  --   is_eligible boolean
  --   reasons jsonb
  -- If the function signature differs, adjust this call accordingly
  
  BEGIN
    SELECT * INTO v_eligibility_result
    FROM public.check_candidate_company_eligibility(p_company_id, p_candidate_id);
    
    v_is_eligible := v_eligibility_result.is_eligible;
    v_ineligible_reasons := COALESCE(v_eligibility_result.reasons, '[]'::jsonb);
  EXCEPTION
    WHEN OTHERS THEN
      -- If eligibility function doesn't exist or fails, assume eligible for now
      -- TODO: Remove this fallback once eligibility function is properly implemented
      RAISE WARNING 'Eligibility check failed or function not found: %. Assuming eligible.', SQLERRM;
      v_is_eligible := true;
      v_ineligible_reasons := '[]'::jsonb;
  END;
  
  -- ============================================
  -- 2. HANDLE NOT ELIGIBLE CASE
  -- ============================================
  
  IF NOT v_is_eligible THEN
    -- Upsert with overall_score = 0, is_eligible = false
    INSERT INTO public.candidate_company_matches (
      company_id,
      candidate_id,
      is_eligible,
      ineligible_reasons,
      base_score,
      values_score,
      role_score,
      interview_score,
      overall_score,
      score_breakdown,
      last_calculated_at,
      updated_at
    )
    VALUES (
      p_company_id,
      p_candidate_id,
      false,
      v_ineligible_reasons,
      NULL,
      NULL,
      NULL,
      NULL,
      0,
      jsonb_build_object(
        'eligibility', jsonb_build_object(
          'is_eligible', false,
          'reasons', v_ineligible_reasons
        )
      ),
      now(),
      now()
    )
    ON CONFLICT (company_id, candidate_id)
    DO UPDATE SET
      is_eligible = false,
      ineligible_reasons = EXCLUDED.ineligible_reasons,
      base_score = NULL,
      values_score = NULL,
      role_score = NULL,
      interview_score = NULL,
      overall_score = 0,
      score_breakdown = EXCLUDED.score_breakdown,
      last_calculated_at = now(),
      updated_at = now();
    
    -- Return result
    RETURN jsonb_build_object(
      'success', true,
      'is_eligible', false,
      'overall_score', 0,
      'ineligible_reasons', v_ineligible_reasons,
      'message', 'Candidate is not eligible for this company'
    );
  END IF;
  
  -- ============================================
  -- 3. CALCULATE SCORES (ELIGIBLE CASE)
  -- ============================================
  
  -- Calculate base score
  v_base_score := public.score_base_candidate_company(p_company_id, p_candidate_id);
  
  -- V1: overall_score = base_score (no weighting yet)
  v_overall_score := v_base_score;
  
  -- Build score breakdown JSON
  v_score_breakdown := jsonb_build_object(
    'base', jsonb_build_object(
      'score', v_base_score,
      'components', jsonb_build_object(
        'industry_score', NULL, -- TODO: Add detailed breakdown from score_base function
        'level_score', NULL      -- TODO: Add detailed breakdown from score_base function
      )
    ),
    'values', jsonb_build_object(
      'score', NULL,
      'status', 'not_calculated'
    ),
    'role', jsonb_build_object(
      'score', NULL,
      'status', 'not_calculated'
    ),
    'interview', jsonb_build_object(
      'score', NULL,
      'status', 'not_calculated'
    ),
    'overall', jsonb_build_object(
      'score', v_overall_score,
      'calculation_method', 'v1_base_only',
      'weights', jsonb_build_object(
        'base', 1.0,
        'values', 0.0,
        'role', 0.0,
        'interview', 0.0
      )
    ),
    'calculated_at', now()
  );
  
  -- ============================================
  -- 4. UPSERT INTO candidate_company_matches
  -- ============================================
  
  INSERT INTO public.candidate_company_matches (
    company_id,
    candidate_id,
    is_eligible,
    ineligible_reasons,
    base_score,
    values_score,
    role_score,
    interview_score,
    overall_score,
    score_breakdown,
    last_calculated_at,
    updated_at
  )
  VALUES (
    p_company_id,
    p_candidate_id,
    true,
    '[]'::jsonb,
    v_base_score,
    NULL, -- TODO: values_score for later
    NULL, -- TODO: role_score for later
    NULL, -- interview_score not implemented yet
    v_overall_score,
    v_score_breakdown,
    now(),
    now()
  )
  ON CONFLICT (company_id, candidate_id)
  DO UPDATE SET
    is_eligible = true,
    ineligible_reasons = '[]'::jsonb,
    base_score = EXCLUDED.base_score,
    values_score = EXCLUDED.values_score,
    role_score = EXCLUDED.role_score,
    interview_score = EXCLUDED.interview_score,
    overall_score = EXCLUDED.overall_score,
    score_breakdown = EXCLUDED.score_breakdown,
    last_calculated_at = now(),
    updated_at = now();
  
  -- ============================================
  -- 5. RETURN RESULT
  -- ============================================
  
  RETURN jsonb_build_object(
    'success', true,
    'is_eligible', true,
    'base_score', v_base_score,
    'overall_score', v_overall_score,
    'score_breakdown', v_score_breakdown,
    'message', 'Match calculated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return error result
    RAISE WARNING 'Error in calculate_candidate_company_match: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to calculate match'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_candidate_company_match(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_candidate_company_match(uuid, uuid) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.calculate_candidate_company_match IS 
  'Orchestrates the complete Candidate ↔ Company matching process: checks eligibility, calculates base score, stores results in candidate_company_matches. V1: Uses base_score only for overall_score. Returns JSONB with success status and calculated scores.';

-- ============================================
-- TEST QUERIES
-- ============================================

-- Example 1: Calculate match for specific company and candidate
-- Replace UUIDs with actual IDs from your database
/*
SELECT 
  public.calculate_candidate_company_match(
    'YOUR_COMPANY_ID_HERE'::uuid,
    'YOUR_CANDIDATE_ID_HERE'::uuid
  ) as match_result;
*/

-- Example 2: Calculate matches for all candidates for a specific company
-- (Use with caution - may take time for large datasets)
/*
SELECT 
  p.id as candidate_id,
  p.vorname || ' ' || p.nachname as candidate_name,
  p.branche,
  p.status,
  public.calculate_candidate_company_match('YOUR_COMPANY_ID_HERE'::uuid, p.id) as match_result
FROM public.profiles p
WHERE p.profile_published = true
LIMIT 10;
*/

-- Example 3: View stored match results after calculation
/*
SELECT 
  ccm.*,
  c.name as company_name,
  p.vorname || ' ' || p.nachname as candidate_name
FROM public.candidate_company_matches ccm
JOIN public.companies c ON c.id = ccm.company_id
JOIN public.profiles p ON p.id = ccm.candidate_id
WHERE ccm.company_id = 'YOUR_COMPANY_ID_HERE'::uuid
ORDER BY ccm.overall_score DESC, ccm.last_calculated_at DESC
LIMIT 20;
*/

-- Example 4: Recalculate matches for a specific company (refresh scores)
/*
-- First, get all candidates for the company
WITH company_candidates AS (
  SELECT DISTINCT candidate_id
  FROM public.candidate_company_matches
  WHERE company_id = 'YOUR_COMPANY_ID_HERE'::uuid
)
SELECT 
  candidate_id,
  public.calculate_candidate_company_match('YOUR_COMPANY_ID_HERE'::uuid, candidate_id) as recalculated_match
FROM company_candidates
LIMIT 10;
*/

-- Example 5: Check eligibility and scores separately
/*
-- Check eligibility only
SELECT 
  public.check_candidate_company_eligibility(
    'YOUR_COMPANY_ID_HERE'::uuid,
    'YOUR_CANDIDATE_ID_HERE'::uuid
  ) as eligibility_check;

-- Check base score only
SELECT 
  public.score_base_candidate_company(
    'YOUR_COMPANY_ID_HERE'::uuid,
    'YOUR_CANDIDATE_ID_HERE'::uuid
  ) as base_score_only;
*/

