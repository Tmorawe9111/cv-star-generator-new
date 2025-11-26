-- =====================================================
-- EMPLOYEE & ALUMNI NETWORK SYSTEM
-- =====================================================
-- Enables users to link their work experience to registered companies
-- and education to registered schools for networking features

-- 1. Add privacy setting to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_as_former_employee BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.profiles.show_as_former_employee IS 'If true, user appears in "Ehemalige" lists at companies/schools';

-- 2. Create schools table (similar to companies)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT CHECK (type IN ('grundschule', 'hauptschule', 'realschule', 'gymnasium', 'gesamtschule', 'berufsschule', 'fachhochschule', 'universitaet', 'sonstige')) DEFAULT 'sonstige',
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Deutschland',
  logo_url TEXT,
  website TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_name ON public.schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON public.schools(slug);

-- Trigger for slug generation
CREATE OR REPLACE FUNCTION public.set_school_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.name || '-' || COALESCE(NEW.city, '') || '-' || substring(gen_random_uuid()::text FROM 1 FOR 4));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_school_slug ON public.schools;
CREATE TRIGGER trg_set_school_slug
BEFORE INSERT ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.set_school_slug();

-- 3. Create user_experiences table (linked work experiences)
CREATE TABLE IF NOT EXISTS public.user_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Company link (NULL if not linked to registered company)
  linked_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  linked_location_id UUID REFERENCES company_locations(id) ON DELETE SET NULL,
  
  -- Experience details (always stored, regardless of link)
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = current position ("bis heute")
  description TEXT,
  
  -- Metadata
  is_current BOOLEAN GENERATED ALWAYS AS (end_date IS NULL) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_experiences_user ON public.user_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experiences_company ON public.user_experiences(linked_company_id);
CREATE INDEX IF NOT EXISTS idx_user_experiences_current ON public.user_experiences(linked_company_id, is_current) WHERE linked_company_id IS NOT NULL;

-- 4. Create user_education table (linked education)
CREATE TABLE IF NOT EXISTS public.user_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- School link (NULL if not linked to registered school)
  linked_school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  
  -- Education details (always stored, regardless of link)
  school_name TEXT NOT NULL,
  degree TEXT, -- e.g., "Abitur", "Bachelor", "Master"
  field_of_study TEXT, -- e.g., "Informatik", "BWL"
  location TEXT,
  start_date DATE,
  end_date DATE, -- NULL = current student
  grade TEXT, -- e.g., "1.5", "sehr gut"
  description TEXT,
  
  -- Metadata
  is_current BOOLEAN GENERATED ALWAYS AS (end_date IS NULL) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_education_user ON public.user_education(user_id);
CREATE INDEX IF NOT EXISTS idx_user_education_school ON public.user_education(linked_school_id);
CREATE INDEX IF NOT EXISTS idx_user_education_current ON public.user_education(linked_school_id, is_current) WHERE linked_school_id IS NOT NULL;

-- 5. RLS Policies
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_education ENABLE ROW LEVEL SECURITY;

-- Schools: Anyone can view
CREATE POLICY "Anyone can view schools" ON public.schools FOR SELECT USING (true);

-- User experiences: User can manage own, others can view if linked
CREATE POLICY "Users can manage own experiences" ON public.user_experiences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view linked experiences" ON public.user_experiences
  FOR SELECT USING (linked_company_id IS NOT NULL);

-- User education: User can manage own, others can view if linked
CREATE POLICY "Users can manage own education" ON public.user_education
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view linked education" ON public.user_education
  FOR SELECT USING (linked_school_id IS NOT NULL);

-- 6. Function to get company employees (current + former with privacy)
CREATE OR REPLACE FUNCTION public.get_company_employees(
  p_company_id UUID,
  p_include_former BOOLEAN DEFAULT true
)
RETURNS TABLE (
  user_id UUID,
  vorname TEXT,
  nachname TEXT,
  avatar_url TEXT,
  position TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN,
  show_as_former BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ue.user_id,
    p.vorname,
    p.nachname,
    p.avatar_url,
    ue.position,
    ue.location,
    ue.start_date,
    ue.end_date,
    ue.is_current,
    COALESCE(p.show_as_former_employee, true) as show_as_former
  FROM user_experiences ue
  JOIN profiles p ON p.id = ue.user_id
  WHERE ue.linked_company_id = p_company_id
    AND (
      ue.is_current = true -- Always show current employees
      OR (p_include_former AND COALESCE(p.show_as_former_employee, true) = true) -- Show former only if allowed
    )
  ORDER BY ue.is_current DESC, ue.end_date DESC NULLS FIRST, ue.start_date DESC;
END;
$$;

-- 7. Function to get school members (current + alumni with privacy)
CREATE OR REPLACE FUNCTION public.get_school_members(
  p_school_id UUID,
  p_include_alumni BOOLEAN DEFAULT true
)
RETURNS TABLE (
  user_id UUID,
  vorname TEXT,
  nachname TEXT,
  avatar_url TEXT,
  degree TEXT,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN,
  show_as_former BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ue.user_id,
    p.vorname,
    p.nachname,
    p.avatar_url,
    ue.degree,
    ue.field_of_study,
    ue.start_date,
    ue.end_date,
    ue.is_current,
    COALESCE(p.show_as_former_employee, true) as show_as_former
  FROM user_education ue
  JOIN profiles p ON p.id = ue.user_id
  WHERE ue.linked_school_id = p_school_id
    AND (
      ue.is_current = true -- Always show current students
      OR (p_include_alumni AND COALESCE(p.show_as_former_employee, true) = true) -- Show alumni only if allowed
    )
  ORDER BY ue.is_current DESC, ue.end_date DESC NULLS FIRST, ue.start_date DESC;
END;
$$;

-- 8. Function to get colleague counts for a user's experience
CREATE OR REPLACE FUNCTION public.get_colleague_counts(
  p_user_id UUID,
  p_company_id UUID
)
RETURNS TABLE (
  current_colleagues INT,
  former_colleagues INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE ue.is_current = true AND ue.user_id != p_user_id)::INT as current_colleagues,
    COUNT(*) FILTER (WHERE ue.is_current = false AND ue.user_id != p_user_id AND COALESCE(p.show_as_former_employee, true) = true)::INT as former_colleagues
  FROM user_experiences ue
  JOIN profiles p ON p.id = ue.user_id
  WHERE ue.linked_company_id = p_company_id;
END;
$$;

-- 9. Function to search companies by name and location (for autocomplete)
CREATE OR REPLACE FUNCTION public.search_companies_for_linking(
  p_search_term TEXT,
  p_city TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  logo_url TEXT,
  employee_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    COALESCE(c.city, c.main_location) as city,
    c.logo_url,
    (SELECT COUNT(*) FROM user_experiences ue WHERE ue.linked_company_id = c.id AND ue.is_current = true) as employee_count
  FROM companies c
  WHERE 
    -- Fuzzy name match
    (
      c.name ILIKE '%' || p_search_term || '%'
      OR c.name ILIKE p_search_term || '%'
      OR similarity(c.name, p_search_term) > 0.3
    )
    -- Optional city filter (within ~50km would need PostGIS, so just match city for now)
    AND (p_city IS NULL OR c.city ILIKE '%' || p_city || '%' OR c.main_location ILIKE '%' || p_city || '%')
  ORDER BY 
    -- Exact matches first
    CASE WHEN c.name ILIKE p_search_term THEN 0 
         WHEN c.name ILIKE p_search_term || '%' THEN 1 
         ELSE 2 END,
    similarity(c.name, p_search_term) DESC,
    employee_count DESC
  LIMIT p_limit;
END;
$$;

-- 10. Function to search schools by name and location (for autocomplete)
CREATE OR REPLACE FUNCTION public.search_schools_for_linking(
  p_search_term TEXT,
  p_city TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  type TEXT,
  logo_url TEXT,
  student_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.city,
    s.type,
    s.logo_url,
    (SELECT COUNT(*) FROM user_education ue WHERE ue.linked_school_id = s.id AND ue.is_current = true) as student_count
  FROM schools s
  WHERE 
    -- Fuzzy name match
    (
      s.name ILIKE '%' || p_search_term || '%'
      OR s.name ILIKE p_search_term || '%'
      OR similarity(s.name, p_search_term) > 0.3
    )
    -- Optional city filter
    AND (p_city IS NULL OR s.city ILIKE '%' || p_city || '%')
  ORDER BY 
    CASE WHEN s.name ILIKE p_search_term THEN 0 
         WHEN s.name ILIKE p_search_term || '%' THEN 1 
         ELSE 2 END,
    similarity(s.name, p_search_term) DESC,
    student_count DESC
  LIMIT p_limit;
END;
$$;

-- Enable pg_trgm extension for fuzzy matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Grant permissions
GRANT SELECT ON public.schools TO anon, authenticated;
GRANT ALL ON public.user_experiences TO authenticated;
GRANT ALL ON public.user_education TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_employees TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_members TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_colleague_counts TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_companies_for_linking TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_schools_for_linking TO authenticated;

-- Comments
COMMENT ON TABLE public.schools IS 'Registered schools/universities for alumni networking';
COMMENT ON TABLE public.user_experiences IS 'User work experiences with optional company linking';
COMMENT ON TABLE public.user_education IS 'User education with optional school linking';

