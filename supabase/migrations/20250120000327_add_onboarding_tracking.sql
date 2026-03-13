-- Add onboarding tracking fields to companies table
-- This enables proper skip/completed step tracking

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS onboarding_skipped_steps integer[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed_steps integer[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN companies.onboarding_skipped_steps IS 'Array of onboarding step numbers that were skipped (can appear again until completed)';
COMMENT ON COLUMN companies.onboarding_completed_steps IS 'Array of onboarding step numbers that were completed (0=Branche, 1=TargetGroups, 2=Plan, 3=Profile, 4=FirstJob, 5=TeamInvite, 6=Welcome)';

-- Ensure industry field exists and can store the branch selection
-- (This should already exist, but we verify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'industry'
  ) THEN
    ALTER TABLE companies ADD COLUMN industry text;
  END IF;
END $$;

-- Ensure location fields exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'main_location'
  ) THEN
    ALTER TABLE companies ADD COLUMN main_location text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'country'
  ) THEN
    ALTER TABLE companies ADD COLUMN country text;
  END IF;
END $$;

-- Create index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_companies_onboarding_status 
ON companies(onboarding_completed, onboarding_step);

