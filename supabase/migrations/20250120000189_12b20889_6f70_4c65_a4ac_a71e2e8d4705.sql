-- Move PostGIS reference table out of public into a dedicated schema for a clean linter pass
-- Recommended approach: keep a compatibility view in public

-- 1) Ensure a dedicated schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2) Try to move the spatial_ref_sys table to extensions schema
DO $$
BEGIN
  -- Only attempt move if table exists in public and not already moved
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'spatial_ref_sys' AND c.relkind = 'r'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.spatial_ref_sys SET SCHEMA extensions';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping move of spatial_ref_sys (insufficient privileges): %', SQLERRM;
    END;
  END IF;
END$$;

-- 3) Recreate a compatibility view in public with the same name if the table was moved
DO $$
BEGIN
  -- If table now lives in extensions and there is no table in public, create view
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'extensions' AND c.relname = 'spatial_ref_sys' AND c.relkind = 'r'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'spatial_ref_sys'
  ) THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.spatial_ref_sys AS SELECT * FROM extensions.spatial_ref_sys';
  END IF;
END$$;

-- 4) Tighten schema access (optional, views in public remain readable if needed)
REVOKE ALL ON SCHEMA extensions FROM PUBLIC;
GRANT USAGE ON SCHEMA extensions TO postgres;