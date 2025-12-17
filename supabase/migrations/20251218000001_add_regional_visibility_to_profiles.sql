-- Add regional_visibility column to profiles table
-- If true, profile is only visible to companies within 50km radius
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS regional_visibility BOOLEAN DEFAULT false;

-- Add index for better performance on regional visibility queries
CREATE INDEX IF NOT EXISTS idx_profiles_regional_visibility ON public.profiles(regional_visibility);

-- Add comment
COMMENT ON COLUMN public.profiles.regional_visibility IS 'If true, profile is only visible to companies within 50km radius. Users can still apply to jobs everywhere.';

