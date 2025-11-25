-- Add available_from column to profiles table
-- This stores the date when the user becomes available for job search (format: YYYY-MM)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'available_from'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN available_from TEXT;
    
    COMMENT ON COLUMN public.profiles.available_from IS 'Date when user becomes available for job search (format: YYYY-MM, e.g., "2025-03")';
  END IF;
END $$;
