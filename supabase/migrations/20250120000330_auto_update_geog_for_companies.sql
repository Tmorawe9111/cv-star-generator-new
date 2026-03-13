-- Auto-update geog column for companies when latitude/longitude changes
-- This ensures the PostGIS geography column is always in sync

-- Function to update geog from lat/lon
CREATE OR REPLACE FUNCTION public.update_company_geog()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update geog if lat/lon are set
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geog := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.geog := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_company_geog ON public.companies;

-- Create trigger
CREATE TRIGGER trigger_update_company_geog
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_geog();

-- Update existing rows that have lat/lon but no geog
UPDATE public.companies
SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND geog IS NULL;

COMMENT ON FUNCTION public.update_company_geog IS 'Automatically updates the geog column when latitude or longitude changes in companies table.';

