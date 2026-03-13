-- Secure company data while preserving public, sanitized access via RPC
-- 1) Ensure RLS is enabled and remove anonymous broad read on base table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='companies' AND policyname='Public can view companies (marketplace)'
  ) THEN
    -- Restrict this policy to authenticated users only
    ALTER POLICY "Public can view companies (marketplace)" ON public.companies TO authenticated;
  END IF;
END $$;

-- 2) Public-safe RPCs using SECURITY DEFINER to bypass RLS for sanitized columns only
-- NOTE: Set search_path to empty then public to avoid search_path hijacking
CREATE OR REPLACE FUNCTION public.get_companies_public(
  search text DEFAULT NULL,
  limit_count integer DEFAULT 12,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  logo_url text,
  header_image text,
  description text,
  industry text,
  size_range text,
  main_location text,
  country text,
  website_url text,
  linkedin_url text,
  instagram_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.id, c.name, c.logo_url, c.header_image, c.description, c.industry, c.size_range,
         c.main_location, c.country, c.website_url, c.linkedin_url, c.instagram_url, c.created_at
  FROM public.companies c
  WHERE (search IS NULL OR c.name ILIKE '%' || search || '%')
  ORDER BY c.created_at DESC
  LIMIT COALESCE(limit_count, 12)
  OFFSET GREATEST(COALESCE(offset_count, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_companies_public(text, integer, integer) TO anon, authenticated;

-- Function to fetch a single company with public-safe fields
CREATE OR REPLACE FUNCTION public.get_company_public(p_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  logo_url text,
  header_image text,
  description text,
  mission_statement text,
  industry text,
  size_range text,
  employee_count integer,
  main_location text,
  country text,
  website_url text,
  linkedin_url text,
  instagram_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.id, c.name, c.logo_url, c.header_image, c.description, c.mission_statement, c.industry,
         c.size_range, c.employee_count, c.main_location, c.country, c.website_url, c.linkedin_url,
         c.instagram_url, c.created_at
  FROM public.companies c
  WHERE c.id = p_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_public(uuid) TO anon, authenticated;

-- Function to fetch multiple companies by ids with minimal fields for joins (e.g., feed)
CREATE OR REPLACE FUNCTION public.get_companies_public_by_ids(ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  logo_url text,
  industry text,
  main_location text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.id, c.name, c.logo_url, c.industry, c.main_location
  FROM public.companies c
  WHERE c.id = ANY(ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_companies_public_by_ids(uuid[]) TO anon, authenticated;