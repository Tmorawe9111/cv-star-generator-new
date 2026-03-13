-- Fix security warning by setting search path for the function
CREATE OR REPLACE FUNCTION search_companies_for_claim(q text DEFAULT NULL, "limit" int DEFAULT 10)
RETURNS TABLE(
  id uuid,
  name text,
  logo_url text,
  slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.logo_url, COALESCE(c.id::text, c.id::text) AS slug
  FROM companies c
  WHERE c.employer_profile = true
    AND (q IS NULL
         OR q = ''
         OR c.name ILIKE '%' || q || '%')
  ORDER BY
    -- prioritize closer matches first, then recency
    (CASE WHEN q IS NULL OR q = '' THEN 0
          WHEN c.name ILIKE q THEN 1
          WHEN c.name ILIKE q || '%' THEN 2
          WHEN c.name ILIKE '%' || q || '%' THEN 3
          ELSE 9 END),
    c.updated_at DESC NULLS LAST
  LIMIT GREATEST(1, "limit");
$$;