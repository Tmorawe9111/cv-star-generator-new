-- Add onboarding columns to companies table
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_groups jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_plan_id text,
  ADD COLUMN IF NOT EXISTS onboarding_checklist jsonb DEFAULT '{
    "profile": false,
    "team": false,
    "job": false,
    "branding": false
  }'::jsonb;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_companies_onboarding 
  ON public.companies(onboarding_completed, onboarding_step);