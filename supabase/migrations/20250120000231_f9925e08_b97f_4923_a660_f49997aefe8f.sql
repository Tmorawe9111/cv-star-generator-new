-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employer_free text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employer_slogan text;

-- Add employer_profile column to companies table  
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employer_profile boolean DEFAULT false;

-- Add index for company name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS companies_name_trgm_idx ON companies USING gin (name gin_trgm_ops);

-- RPC function to search companies for employment claims
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_companies_for_claim(text, int) TO anon, authenticated;

-- Ensure RLS policies exist for profiles (users can update own profile)
DROP POLICY IF EXISTS "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);