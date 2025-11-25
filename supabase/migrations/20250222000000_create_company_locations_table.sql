-- Create company_locations table (simplified without PostGIS)
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

-- Index
CREATE INDEX IF NOT EXISTS idx_company_locations_company ON public.company_locations(company_id);

-- Enable RLS
ALTER TABLE public.company_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Trigger for updated_at and single primary
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

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_company_location_count(p_company_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.company_locations
  WHERE company_id = p_company_id AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_add_company_location(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_current_count INTEGER;
  v_max_locations INTEGER;
BEGIN
  SELECT COALESCE(active_plan_id, plan_type, 'free') INTO v_plan
  FROM public.companies WHERE id = p_company_id;
  
  SELECT get_company_location_count(p_company_id) INTO v_current_count;
  
  v_max_locations := CASE v_plan
    WHEN 'free' THEN 1
    WHEN 'basic' THEN 3
    WHEN 'growth' THEN 5
    WHEN 'bevisiblle' THEN 15
    WHEN 'enterprise' THEN 999999
    ELSE 1
  END;
  
  RETURN v_current_count < v_max_locations;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.company_locations IS 'Company locations with full address details. Plan limits: Free=1, Basic=3, Growth=5, BeVisiblle=15, Enterprise=unlimited';
