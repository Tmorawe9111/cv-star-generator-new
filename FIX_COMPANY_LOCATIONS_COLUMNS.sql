-- Füge fehlende Spalten zur company_locations Tabelle hinzu
-- Führe dieses SQL in Supabase SQL Editor aus

ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS house_number TEXT;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Deutschland';
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Prüfe die Spalten
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'company_locations' 
ORDER BY ordinal_position;

