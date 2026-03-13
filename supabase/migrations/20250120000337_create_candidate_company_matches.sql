-- Migration: Create candidate_company_matches table
-- Purpose: Central table for storing Candidate ↔ Company matching scores
-- This is the foundation for the new matching system refactoring

-- Create the candidate_company_matches table
CREATE TABLE IF NOT EXISTS public.candidate_company_matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Eligibility gate
  is_eligible         boolean NOT NULL DEFAULT true,
  ineligible_reasons  jsonb DEFAULT '[]'::jsonb,

  -- Individual score components (0-100)
  base_score          int CHECK (base_score IS NULL OR (base_score BETWEEN 0 AND 100)),
  values_score        int CHECK (values_score IS NULL OR (values_score BETWEEN 0 AND 100)),
  role_score          int CHECK (role_score IS NULL OR (role_score BETWEEN 0 AND 100)),
  interview_score     int CHECK (interview_score IS NULL OR (interview_score BETWEEN 0 AND 100)),

  -- Overall weighted score (0-100)
  overall_score       int NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),

  -- Detailed breakdown as JSON
  score_breakdown     jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  last_calculated_at  timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Ensure one match record per company-candidate pair
  UNIQUE (company_id, candidate_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidate_company_matches_company_id 
  ON public.candidate_company_matches(company_id);

CREATE INDEX IF NOT EXISTS idx_candidate_company_matches_candidate_id 
  ON public.candidate_company_matches(candidate_id);

CREATE INDEX IF NOT EXISTS idx_candidate_company_matches_overall_score 
  ON public.candidate_company_matches(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_company_matches_is_eligible 
  ON public.candidate_company_matches(is_eligible) WHERE is_eligible = true;

CREATE INDEX IF NOT EXISTS idx_candidate_company_matches_last_calculated_at 
  ON public.candidate_company_matches(last_calculated_at DESC);

-- Composite index for common query patterns (company + eligible + score)
CREATE INDEX IF NOT EXISTS idx_candidate_company_matches_company_eligible_score 
  ON public.candidate_company_matches(company_id, is_eligible, overall_score DESC) 
  WHERE is_eligible = true;

-- Enable Row Level Security
ALTER TABLE public.candidate_company_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Company users can view matches for their company
DROP POLICY IF EXISTS "Company users can view own matches" ON public.candidate_company_matches;
CREATE POLICY "Company users can view own matches" 
  ON public.candidate_company_matches
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

-- Service role can manage all matches (for background jobs)
DROP POLICY IF EXISTS "Service role can manage all matches" ON public.candidate_company_matches;
CREATE POLICY "Service role can manage all matches"
  ON public.candidate_company_matches
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.candidate_company_matches IS 
  'Central table for Candidate ↔ Company matching scores. Stores eligibility, individual score components (base, values, role, interview), overall weighted score, and detailed breakdown.';

COMMENT ON COLUMN public.candidate_company_matches.is_eligible IS 
  'Gate check: if false, candidate does not meet basic requirements (target group, level, must-have skills, location). overall_score will be 0.';

COMMENT ON COLUMN public.candidate_company_matches.ineligible_reasons IS 
  'JSON array of reasons why candidate is not eligible (e.g., ["target_group_mismatch", "level_too_low"]).';

COMMENT ON COLUMN public.candidate_company_matches.base_score IS 
  'Base matching score (0-100) based on industry, skills/level, location. NULL if not calculated yet.';

COMMENT ON COLUMN public.candidate_company_matches.values_score IS 
  'Values matching score (0-100) comparing company_values with user_values. NULL if not calculated yet (V1: stub).';

COMMENT ON COLUMN public.candidate_company_matches.role_score IS 
  'Role expectations matching score (0-100) comparing company_role_expectations with candidate profile. NULL if not calculated yet (V1: stub).';

COMMENT ON COLUMN public.candidate_company_matches.interview_score IS 
  'Interview answers matching score (0-100) comparing candidate answers with expected answers. NULL if not calculated yet (V1: not implemented).';

COMMENT ON COLUMN public.candidate_company_matches.overall_score IS 
  'Weighted overall matching score (0-100). V1: equals base_score. Future: weighted combination of all components.';

COMMENT ON COLUMN public.candidate_company_matches.score_breakdown IS 
  'JSON object with detailed breakdown of scoring (e.g., {"base": {"industry": 30, "location": 25, "skills": 20}, "weights": {...}}).';

COMMENT ON COLUMN public.candidate_company_matches.last_calculated_at IS 
  'Timestamp when the match scores were last calculated. Used for cache invalidation.';

