-- Fix missing columns in companies table
-- This ensures all columns requested by the frontend exist

-- Add city column if it doesn't exist (as alias for main_location or separate)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE companies ADD COLUMN city text;
    
    -- Copy data from main_location to city if main_location exists and city is empty
    UPDATE companies 
    SET city = main_location 
    WHERE city IS NULL AND main_location IS NOT NULL;
  END IF;
END $$;

-- Ensure all other required columns exist
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_groups jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_plan_id text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS onboarding_skipped_steps integer[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed_steps integer[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS main_location text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS industry text;

-- Create index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_companies_onboarding_status 
ON companies(onboarding_completed, onboarding_step);

