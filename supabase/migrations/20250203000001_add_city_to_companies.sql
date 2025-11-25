-- Add city column to companies table if it doesn't exist
-- This fixes the error: column companies_1.city does not exist

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
    
    COMMENT ON COLUMN companies.city IS 'City name for the company (can be derived from main_location)';
  END IF;
END $$;

