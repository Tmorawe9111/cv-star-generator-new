-- =====================================================
-- SIMPLIFIED EMPLOYEE & ALUMNI NETWORK
-- =====================================================
-- Uses existing berufserfahrung/schulbildung JSON fields
-- Only adds: privacy toggle, schools table, autocomplete functions

-- 1. Add privacy setting to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_as_former_employee BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.profiles.show_as_former_employee IS 'If true, user appears in "Ehemalige" lists at companies/schools';

-- 2. Create schools table (for autocomplete matching)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  type TEXT CHECK (type IN ('grundschule', 'hauptschule', 'realschule', 'gymnasium', 'gesamtschule', 'berufsschule', 'fachhochschule', 'universitaet', 'sonstige')) DEFAULT 'sonstige',
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_name ON public.schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools(city);

-- RLS for schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert schools" ON public.schools FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Enable fuzzy matching extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4. Function to search companies for autocomplete
CREATE OR REPLACE FUNCTION public.search_companies_for_linking(
  p_search_term TEXT,
  p_city TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  logo_url TEXT,
  employee_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.id,
    c.name,
    COALESCE(c.city, c.main_location) as city,
    c.logo_url,
    (SELECT COUNT(*) FROM company_users cu WHERE cu.company_id = c.id) as employee_count
  FROM companies c
  WHERE 
    c.name ILIKE '%' || p_search_term || '%'
    AND (p_city IS NULL OR c.city ILIKE '%' || p_city || '%' OR c.main_location ILIKE '%' || p_city || '%')
  ORDER BY 
    CASE WHEN c.name ILIKE p_search_term THEN 0 
         WHEN c.name ILIKE p_search_term || '%' THEN 1 
         ELSE 2 END
  LIMIT 5;
$$;

-- 5. Function to search schools for autocomplete
CREATE OR REPLACE FUNCTION public.search_schools_for_linking(
  p_search_term TEXT,
  p_city TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  type TEXT,
  logo_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    s.id,
    s.name,
    s.city,
    s.type,
    s.logo_url
  FROM schools s
  WHERE 
    s.name ILIKE '%' || p_search_term || '%'
    AND (p_city IS NULL OR s.city ILIKE '%' || p_city || '%')
  ORDER BY 
    CASE WHEN s.name ILIKE p_search_term THEN 0 
         WHEN s.name ILIKE p_search_term || '%' THEN 1 
         ELSE 2 END
  LIMIT 5;
$$;

-- 6. Function to get employees from profiles.berufserfahrung JSON
-- Matches company name in JSON array to registered company
CREATE OR REPLACE FUNCTION public.get_company_team_from_profiles(
  p_company_name TEXT,
  p_include_former BOOLEAN DEFAULT true
)
RETURNS TABLE (
  user_id UUID,
  vorname TEXT,
  nachname TEXT,
  avatar_url TEXT,
  job_position TEXT,
  start_date TEXT,
  end_date TEXT,
  is_current BOOLEAN,
  show_as_former BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.vorname,
    p.nachname,
    p.avatar_url,
    (exp->>'position')::TEXT as job_position,
    (exp->>'zeitraum_von')::TEXT as start_date,
    (exp->>'zeitraum_bis')::TEXT as end_date,
    (exp->>'zeitraum_bis' IS NULL OR exp->>'zeitraum_bis' = '') as is_current,
    COALESCE(p.show_as_former_employee, true) as show_as_former
  FROM profiles p,
       jsonb_array_elements(p.berufserfahrung::jsonb) as exp
  WHERE 
    (exp->>'unternehmen') ILIKE p_company_name
    AND (
      -- Current employees always shown
      (exp->>'zeitraum_bis' IS NULL OR exp->>'zeitraum_bis' = '')
      -- Former only if privacy allows
      OR (p_include_former AND COALESCE(p.show_as_former_employee, true) = true)
    )
  ORDER BY 
    (exp->>'zeitraum_bis' IS NULL OR exp->>'zeitraum_bis' = '') DESC,
    (exp->>'zeitraum_von') DESC;
END;
$$;

-- 7. Function to get alumni from profiles.schulbildung JSON
CREATE OR REPLACE FUNCTION public.get_school_alumni_from_profiles(
  p_school_name TEXT,
  p_graduation_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  vorname TEXT,
  nachname TEXT,
  avatar_url TEXT,
  abschluss TEXT,
  abschlussjahr TEXT,
  is_current BOOLEAN,
  show_as_former BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.vorname,
    p.nachname,
    p.avatar_url,
    (edu->>'abschluss')::TEXT as abschluss,
    (edu->>'abschlussjahr')::TEXT as abschlussjahr,
    (edu->>'abschlussjahr' IS NULL OR edu->>'abschlussjahr' = '') as is_current,
    COALESCE(p.show_as_former_employee, true) as show_as_former
  FROM profiles p,
       jsonb_array_elements(p.schulbildung::jsonb) as edu
  WHERE 
    (edu->>'schule') ILIKE p_school_name
    AND COALESCE(p.show_as_former_employee, true) = true
    AND (p_graduation_year IS NULL OR (edu->>'abschlussjahr')::TEXT = p_graduation_year::TEXT)
  ORDER BY 
    (edu->>'abschlussjahr') DESC NULLS FIRST;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.schools TO anon, authenticated;
GRANT INSERT ON public.schools TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_companies_for_linking TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_schools_for_linking TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_team_from_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_alumni_from_profiles TO anon, authenticated;

-- Comments
COMMENT ON TABLE public.schools IS 'Registered schools/universities for alumni matching';
COMMENT ON FUNCTION public.get_company_team_from_profiles IS 'Gets team members by matching company name in profiles.berufserfahrung JSON';

