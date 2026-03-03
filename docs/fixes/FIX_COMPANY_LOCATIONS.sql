-- Prüfe ob die Tabelle existiert und erstelle sie falls nicht
-- Führe dieses SQL in Supabase SQL Editor aus

-- 1. Erstelle die Tabelle falls sie nicht existiert
CREATE TABLE IF NOT EXISTS public.company_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT,
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Deutschland',
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Füge fehlende Spalten hinzu falls die Tabelle schon existiert
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS house_number TEXT;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Deutschland';
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_company_locations_company ON public.company_locations(company_id);

-- 4. Enable RLS
ALTER TABLE public.company_locations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Lösche alte und erstelle neu
DROP POLICY IF EXISTS "Anyone can view active company locations" ON public.company_locations;
CREATE POLICY "Anyone can view active company locations"
  ON public.company_locations FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Company members can insert locations" ON public.company_locations;
CREATE POLICY "Company members can insert locations"
  ON public.company_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_locations.company_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Company members can update locations" ON public.company_locations;
CREATE POLICY "Company members can update locations"
  ON public.company_locations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_locations.company_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Company admins can delete locations" ON public.company_locations;
CREATE POLICY "Company admins can delete locations"
  ON public.company_locations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_locations.company_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'admin'
    )
  );

-- 6. Trigger für updated_at und single primary
CREATE OR REPLACE FUNCTION public.company_location_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  
  -- Ensure only one primary location per company
  IF NEW.is_primary = true THEN
    UPDATE public.company_locations
    SET is_primary = false, updated_at = NOW()
    WHERE company_id = NEW.company_id 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_location ON public.company_locations;
CREATE TRIGGER trg_company_location
  BEFORE INSERT OR UPDATE ON public.company_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.company_location_trigger_fn();

-- 7. Prüfe die Tabelle
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'company_locations' 
ORDER BY ordinal_position;

