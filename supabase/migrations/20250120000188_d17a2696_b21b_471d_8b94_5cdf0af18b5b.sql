-- Enable RLS on PostGIS reference table and add safe read policy
-- This addresses linter error 0013: RLS Disabled in Public

-- Enable RLS (idempotent if already enabled)
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Add a read-only policy so existing functionality is not broken
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys' AND policyname = 'Public can read spatial_ref_sys'
  ) THEN
    CREATE POLICY "Public can read spatial_ref_sys"
    ON public.spatial_ref_sys
    FOR SELECT
    USING (true);
  END IF;
END $$;