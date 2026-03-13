-- Migration: Implement score_base_candidate_company function
-- Purpose: Calculate base matching score (0-100) between candidate and company
-- V1 Logic:
--   - Industry/Branch matching: max 60 points
--   - Level matching: max 40 points

-- Function: score_base_candidate_company
-- Calculates base matching score based on industry and level compatibility
CREATE OR REPLACE FUNCTION public.score_base_candidate_company(
  p_company_id uuid,
  p_candidate_id uuid
)
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_industry_score int := 0;
  v_level_score int := 0;
  v_total_score int := 0;
  
  -- Profile data
  v_candidate_branche text;
  v_candidate_status text;
  
  -- Company data
  v_company_industry text;
  v_company_target_groups jsonb;
  
  -- Company settings (optional)
  v_target_industries jsonb;
  v_target_status jsonb;
BEGIN
  -- Load candidate profile data
  SELECT 
    branche,
    status
  INTO 
    v_candidate_branche,
    v_candidate_status
  FROM public.profiles
  WHERE id = p_candidate_id;
  
  -- If candidate not found, return 0
  IF v_candidate_branche IS NULL AND v_candidate_status IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Load company data
  SELECT 
    c.industry,
    c.target_groups
  INTO 
    v_company_industry,
    v_company_target_groups
  FROM public.companies c
  WHERE c.id = p_company_id;
  
  -- If company not found, return 0
  IF v_company_industry IS NULL AND v_company_target_groups IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Try to load company_settings (optional, may not exist)
  BEGIN
    SELECT 
      target_industries,
      target_status
    INTO 
      v_target_industries,
      v_target_status
    FROM public.company_settings
    WHERE company_id = p_company_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- company_settings may not exist, continue with company-level data
      v_target_industries := NULL;
      v_target_status := NULL;
  END;
  
  -- ============================================
  -- 1. INDUSTRY/BRANCH MATCHING (max 60 points)
  -- ============================================
  
  -- Priority: company_settings.target_industries > companies.industry
  
  IF v_target_industries IS NOT NULL AND jsonb_array_length(v_target_industries) > 0 THEN
    -- Check if candidate branche matches any target industry
    IF v_candidate_branche IS NOT NULL AND 
       v_target_industries ? v_candidate_branche THEN
      v_industry_score := 60; -- Exact match in target industries
    ELSIF v_candidate_branche IS NOT NULL THEN
      -- TODO: Could implement fuzzy matching here (e.g., 'it' matches 'informationstechnologie')
      -- For now, partial match = 0 if not in list
      v_industry_score := 0;
    END IF;
  ELSIF v_company_industry IS NOT NULL THEN
    -- Use company.industry as fallback
    IF v_candidate_branche IS NOT NULL THEN
      IF LOWER(TRIM(v_candidate_branche)) = LOWER(TRIM(v_company_industry)) THEN
        v_industry_score := 60; -- Exact match
      ELSIF v_candidate_branche ILIKE '%' || v_company_industry || '%' OR
            v_company_industry ILIKE '%' || v_candidate_branche || '%' THEN
        v_industry_score := 40; -- Partial match (contains)
      ELSE
        -- TODO: Could add more sophisticated matching here
        -- For now, no match = 0
        v_industry_score := 0;
      END IF;
    END IF;
  ELSE
    -- No industry data available, give partial score if candidate has branche
    -- This is a fallback to avoid penalizing candidates when company hasn't set industry
    IF v_candidate_branche IS NOT NULL THEN
      v_industry_score := 20; -- Neutral score when company data missing
    END IF;
  END IF;
  
  -- ============================================
  -- 2. LEVEL/STATUS MATCHING (max 40 points)
  -- ============================================
  
  -- Priority: company_settings.target_status > companies.target_groups > companies.target_groups (fallback)
  
  IF v_target_status IS NOT NULL AND jsonb_array_length(v_target_status) > 0 THEN
    -- Check if candidate status matches any target status
    IF v_candidate_status IS NOT NULL AND 
       v_target_status ? v_candidate_status THEN
      v_level_score := 40; -- Exact match
    ELSE
      v_level_score := 0;
    END IF;
  ELSIF v_company_target_groups IS NOT NULL AND jsonb_array_length(v_company_target_groups) > 0 THEN
    -- Use company.target_groups as fallback
    IF v_candidate_status IS NOT NULL AND 
       v_company_target_groups ? v_candidate_status THEN
      v_level_score := 40; -- Exact match
    ELSE
      v_level_score := 0;
    END IF;
  ELSE
    -- No target groups/status data available
    -- Give partial score if candidate has status (neutral fallback)
    IF v_candidate_status IS NOT NULL THEN
      v_level_score := 15; -- Neutral score when company data missing
    END IF;
  END IF;
  
  -- ============================================
  -- 3. CALCULATE TOTAL SCORE
  -- ============================================
  
  v_total_score := v_industry_score + v_level_score;
  
  -- Ensure score is between 0 and 100
  RETURN LEAST(100, GREATEST(0, v_total_score));
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return 0 on any exception
    RAISE WARNING 'Error in score_base_candidate_company: %', SQLERRM;
    RETURN 0;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.score_base_candidate_company(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.score_base_candidate_company(uuid, uuid) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.score_base_candidate_company IS 
  'Calculates base matching score (0-100) between candidate and company. V1: Industry matching (max 60 points) + Level matching (max 40 points). Returns 0 if candidate or company not found.';

-- ============================================
-- TEST QUERIES
-- ============================================

-- Example 1: Test with existing company and candidate
-- Replace UUIDs with actual IDs from your database
/*
SELECT 
  p.id as candidate_id,
  p.vorname || ' ' || p.nachname as candidate_name,
  p.branche as candidate_branche,
  p.status as candidate_status,
  c.id as company_id,
  c.name as company_name,
  c.industry as company_industry,
  c.target_groups as company_target_groups,
  public.score_base_candidate_company(c.id, p.id) as base_score
FROM public.profiles p
CROSS JOIN public.companies c
WHERE p.profile_published = true
LIMIT 10;
*/

-- Example 2: Test for specific company
/*
SELECT 
  p.id as candidate_id,
  p.vorname || ' ' || p.nachname as candidate_name,
  p.branche,
  p.status,
  public.score_base_candidate_company('YOUR_COMPANY_ID_HERE'::uuid, p.id) as base_score
FROM public.profiles p
WHERE p.profile_published = true
ORDER BY base_score DESC
LIMIT 20;
*/

-- Example 3: Test for specific candidate
/*
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.industry,
  c.target_groups,
  public.score_base_candidate_company(c.id, 'YOUR_CANDIDATE_ID_HERE'::uuid) as base_score
FROM public.companies c
ORDER BY base_score DESC
LIMIT 20;
*/

-- Example 4: Test edge cases
/*
-- Test with NULL values
SELECT 
  public.score_base_candidate_company('00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000000'::uuid) as score_null_ids;

-- Test with non-existent IDs
SELECT 
  public.score_base_candidate_company(gen_random_uuid(), gen_random_uuid()) as score_random_ids;
*/

