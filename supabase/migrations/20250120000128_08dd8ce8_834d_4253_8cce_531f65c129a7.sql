-- Add driver license class field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN driver_license_class text;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.driver_license_class IS 'Driver license class (AM, A1, A2, A, B, BE, C1, C1E, C, CE, D1, D1E, D, DE, L, T)';