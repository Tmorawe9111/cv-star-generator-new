-- Update get_company_public function to include contact person fields
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
  contact_person text,
  contact_email text,
  contact_phone text,
  contact_position text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.id, c.name, c.logo_url, c.header_image, c.description, c.mission_statement, c.industry,
         c.size_range, c.employee_count, c.main_location, c.country, c.website_url, c.linkedin_url,
         c.instagram_url, c.contact_person, c.contact_email, c.contact_phone, c.contact_position, c.created_at
  FROM public.companies c
  WHERE c.id = p_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_public(uuid) TO anon, authenticated;

