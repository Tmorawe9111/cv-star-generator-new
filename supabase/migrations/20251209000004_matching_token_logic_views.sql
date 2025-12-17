-- Migration: Matching Token Logic + Views + Top Match Count
-- Purpose: Add token cost calculation, locked/unlocked match views, and top match count function

-- ============================================
-- 1. FUNCTION: get_match_token_cost
-- ============================================
-- Calculates token cost for unlocking a candidate based on match score and application status
CREATE OR REPLACE FUNCTION public.get_match_token_cost(
  p_score int,
  p_is_application boolean
)
RETURNS int
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- If it's an application, always cost 1 token regardless of score
  IF p_is_application THEN
    RETURN 1;
  END IF;
  
  -- For non-application unlocks, cost based on score
  IF p_score >= 90 THEN
    RETURN 4;
  ELSIF p_score >= 80 THEN
    RETURN 3;
  ELSE
    RETURN 2; -- Standard cost
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_match_token_cost IS 
  'Calculates token cost for unlocking a candidate. Applications always cost 1 token. Non-applications: 2 tokens (standard), 3 tokens (score >= 80), 4 tokens (score >= 90).';

GRANT EXECUTE ON FUNCTION public.get_match_token_cost(int, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_match_token_cost(int, boolean) TO service_role;

-- ============================================
-- 2. VIEW: v_company_locked_matches
-- ============================================
-- View for matches that are eligible but not yet unlocked
CREATE OR REPLACE VIEW public.v_company_locked_matches AS
SELECT 
  ccm.id,
  ccm.company_id,
  ccm.candidate_id,
  ccm.is_eligible,
  ccm.ineligible_reasons,
  ccm.base_score,
  ccm.values_score,
  ccm.role_score,
  ccm.interview_score,
  ccm.overall_score,
  ccm.score_breakdown,
  ccm.last_calculated_at,
  ccm.created_at,
  ccm.updated_at,
  
  -- Profile data
  p.vorname,
  p.nachname,
  p.email,
  p.telefon,
  p.avatar_url,
  p.ort,
  p.plz,
  p.branche,
  p.status as candidate_status,
  p.headline,
  p.faehigkeiten,
  p.cv_url,
  p.profile_published,
  
  -- Unlock status (from company_candidates)
  cc.id as company_candidate_id,
  cc.unlocked_at,
  cc.stage as pipeline_stage,
  cc.source as unlock_source,
  
  -- Application status
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.company_id = ccm.company_id
        AND a.candidate_id = ccm.candidate_id
        AND a.source = 'applied'
    ) THEN true
    ELSE false
  END as is_application,
  
  -- Token cost calculation
  public.get_match_token_cost(
    ccm.overall_score,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.company_id = ccm.company_id
          AND a.candidate_id = ccm.candidate_id
          AND a.source = 'applied'
      ) THEN true
      ELSE false
    END
  ) as token_cost

FROM public.candidate_company_matches ccm
INNER JOIN public.profiles p ON p.id = ccm.candidate_id
LEFT JOIN public.company_candidates cc ON (
  cc.company_id = ccm.company_id
  AND cc.candidate_id = ccm.candidate_id
)
WHERE 
  ccm.is_eligible = true
  AND (cc.unlocked_at IS NULL OR cc.id IS NULL) -- Not unlocked yet
  AND ccm.overall_score >= 60 -- Minimum score threshold
  AND p.profile_published = true; -- Only published profiles

COMMENT ON VIEW public.v_company_locked_matches IS 
  'View showing eligible matches for a company that are not yet unlocked. Includes profile data, application status, and calculated token cost. Minimum score: 60.';

-- ============================================
-- 3. VIEW: v_company_unlocked_matches
-- ============================================
-- View for matches that are already unlocked
CREATE OR REPLACE VIEW public.v_company_unlocked_matches AS
SELECT 
  ccm.id,
  ccm.company_id,
  ccm.candidate_id,
  ccm.is_eligible,
  ccm.ineligible_reasons,
  ccm.base_score,
  ccm.values_score,
  ccm.role_score,
  ccm.interview_score,
  ccm.overall_score,
  ccm.score_breakdown,
  ccm.last_calculated_at,
  ccm.created_at,
  ccm.updated_at,
  
  -- Profile data
  p.vorname,
  p.nachname,
  p.email,
  p.telefon,
  p.avatar_url,
  p.ort,
  p.plz,
  p.branche,
  p.status as candidate_status,
  p.headline,
  p.faehigkeiten,
  p.cv_url,
  p.profile_published,
  
  -- Unlock status (from company_candidates)
  cc.id as company_candidate_id,
  cc.unlocked_at,
  cc.stage as pipeline_stage,
  cc.source as unlock_source,
  cc.unlocked_by_user_id,
  
  -- Application status
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.company_id = ccm.company_id
        AND a.candidate_id = ccm.candidate_id
        AND a.source = 'applied'
    ) THEN true
    ELSE false
  END as is_application,
  
  -- Token cost calculation (what it would have cost)
  public.get_match_token_cost(
    ccm.overall_score,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.company_id = ccm.company_id
          AND a.candidate_id = ccm.candidate_id
          AND a.source = 'applied'
      ) THEN true
      ELSE false
    END
  ) as token_cost

FROM public.candidate_company_matches ccm
INNER JOIN public.profiles p ON p.id = ccm.candidate_id
INNER JOIN public.company_candidates cc ON (
  cc.company_id = ccm.company_id
  AND cc.candidate_id = ccm.candidate_id
  AND cc.unlocked_at IS NOT NULL -- Must be unlocked
)
WHERE 
  ccm.is_eligible = true;

COMMENT ON VIEW public.v_company_unlocked_matches IS 
  'View showing eligible matches for a company that are already unlocked. Includes profile data, unlock timestamp, application status, and calculated token cost.';

-- ============================================
-- 4. FUNCTION: get_company_top_match_count
-- ============================================
-- Returns count of locked matches with score >= 80 for a company
CREATE OR REPLACE FUNCTION public.get_company_top_match_count(
  p_company_id uuid
)
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.v_company_locked_matches
  WHERE company_id = p_company_id
    AND overall_score >= 80;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.get_company_top_match_count IS 
  'Returns the count of locked (not yet unlocked) matches for a company with overall_score >= 80. Used for displaying "Top Matches" count.';

GRANT EXECUTE ON FUNCTION public.get_company_top_match_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_top_match_count(uuid) TO service_role;

-- ============================================
-- RLS Policies for Views
-- ============================================
-- Views inherit RLS from underlying tables, but we can add explicit policies if needed
-- Note: Views are read-only, so we only need SELECT policies

-- Policy for locked matches view
DROP POLICY IF EXISTS "Company users can view own locked matches" ON public.v_company_locked_matches;
-- Note: Views don't support RLS policies directly in PostgreSQL
-- RLS is enforced through the underlying tables (candidate_company_matches, profiles, company_candidates)

-- ============================================
-- Test Queries
-- ============================================

-- Example 1: Get locked matches for a company
/*
SELECT * 
FROM public.v_company_locked_matches
WHERE company_id = 'YOUR_COMPANY_ID_HERE'::uuid
ORDER BY overall_score DESC
LIMIT 20;
*/

-- Example 2: Get unlocked matches for a company
/*
SELECT * 
FROM public.v_company_unlocked_matches
WHERE company_id = 'YOUR_COMPANY_ID_HERE'::uuid
ORDER BY unlocked_at DESC
LIMIT 20;
*/

-- Example 3: Get top match count
/*
SELECT public.get_company_top_match_count('YOUR_COMPANY_ID_HERE'::uuid) as top_match_count;
*/

-- Example 4: Test token cost function
/*
SELECT 
  overall_score,
  is_application,
  public.get_match_token_cost(overall_score, is_application) as token_cost
FROM public.v_company_locked_matches
WHERE company_id = 'YOUR_COMPANY_ID_HERE'::uuid
LIMIT 10;
*/

-- Example 5: Get matches grouped by token cost
/*
SELECT 
  token_cost,
  COUNT(*) as match_count,
  AVG(overall_score) as avg_score,
  MIN(overall_score) as min_score,
  MAX(overall_score) as max_score
FROM public.v_company_locked_matches
WHERE company_id = 'YOUR_COMPANY_ID_HERE'::uuid
GROUP BY token_cost
ORDER BY token_cost;
*/

