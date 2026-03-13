-- Add new columns to profiles table for entry gate functionality
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visibility_mode TEXT DEFAULT 'invisible',
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_profile_saved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visibility_prompt_shown BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_dashboard_seen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS house_number TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add check constraint for visibility_mode
ALTER TABLE profiles 
ADD CONSTRAINT profiles_visibility_mode_check 
CHECK (visibility_mode IN ('visible', 'invisible'));