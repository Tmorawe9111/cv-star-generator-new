-- Company Packages & Needs System
-- ====================================

-- Company packages for different tiers
CREATE TABLE IF NOT EXISTS company_packages (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  included_needs INTEGER NOT NULL DEFAULT 3,
  extra_need_price_cents INTEGER NOT NULL DEFAULT 2900,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default packages
INSERT INTO company_packages (id, code, name, monthly_price_cents, included_needs, extra_need_price_cents) VALUES
('starter', 'starter', 'Starter', 0, 3, 2900),
('professional', 'professional', 'Professional', 9900, 10, 1900),
('enterprise', 'enterprise', 'Enterprise', 29900, 50, 990)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  included_needs = EXCLUDED.included_needs,
  extra_need_price_cents = EXCLUDED.extra_need_price_cents;

-- Update companies table with package reference and need credits
ALTER TABLE companies ADD COLUMN IF NOT EXISTS package_id TEXT REFERENCES company_packages(id) DEFAULT 'starter';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS need_credits INTEGER DEFAULT 0;

-- Company purchases (for extra needs/upgrades)
CREATE TABLE IF NOT EXISTS company_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'extra_need', 'package_upgrade'
  item_qty INTEGER NOT NULL DEFAULT 1,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Company Needs (Requirements Profiles)
CREATE TABLE IF NOT EXISTS company_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Anlagenmechaniker SHK"
  profession_id UUID, -- Reference to professions/roles
  employment_type TEXT NOT NULL DEFAULT 'apprenticeship', -- 'apprenticeship', 'full_time', 'part_time', 'internship'
  location_geog GEOGRAPHY(POINT, 4326), -- PostGIS point for location
  radius_km INTEGER NOT NULL DEFAULT 25,
  start_date DATE,
  seniority TEXT, -- 'entry', 'junior', 'senior', 'expert'
  visibility TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'archived'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Need Skills (Must/Nice to have)
CREATE TABLE IF NOT EXISTS need_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID NOT NULL REFERENCES company_needs(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('must', 'nice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Need Licenses
CREATE TABLE IF NOT EXISTS need_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID NOT NULL REFERENCES company_needs(id) ON DELETE CASCADE,
  license TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('must', 'nice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Need Languages
CREATE TABLE IF NOT EXISTS need_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID NOT NULL REFERENCES company_needs(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  level TEXT NOT NULL, -- 'basic', 'intermediate', 'advanced', 'native'
  type TEXT NOT NULL CHECK (type IN ('must', 'nice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Need Target Groups
CREATE TABLE IF NOT EXISTS need_target_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID NOT NULL REFERENCES company_needs(id) ON DELETE CASCADE,
  target_group TEXT NOT NULL, -- 'azubi', 'schueler', 'ausgelernt', 'quereinsteiger'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Candidate Profiles (simplified for matching)
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profession_id UUID,
  seniority TEXT,
  location_geog GEOGRAPHY(POINT, 4326),
  availability_date DATE,
  target_groups TEXT[], -- array of target groups
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Candidate Skills
CREATE TABLE IF NOT EXISTS candidate_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  level TEXT DEFAULT 'basic', -- 'basic', 'intermediate', 'advanced', 'expert'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Candidate Licenses
CREATE TABLE IF NOT EXISTS candidate_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  license TEXT NOT NULL,
  obtained_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Candidate Languages
CREATE TABLE IF NOT EXISTS candidate_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  level TEXT NOT NULL, -- 'basic', 'intermediate', 'advanced', 'native'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Need Matches (computed matches with scores)
CREATE TABLE IF NOT EXISTS need_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID NOT NULL REFERENCES company_needs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0, -- 0-100 match score
  breakdown JSONB DEFAULT '{}', -- detailed scoring breakdown
  passed_gates BOOLEAN DEFAULT false, -- passed must-have requirements
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(need_id, candidate_id)
);

-- Update company_candidates to reference needs
ALTER TABLE company_candidates ADD COLUMN IF NOT EXISTS source_need_id UUID REFERENCES company_needs(id);
ALTER TABLE company_candidates ADD COLUMN IF NOT EXISTS match_score INTEGER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_needs_company_id ON company_needs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_needs_visibility ON company_needs(visibility);
CREATE INDEX IF NOT EXISTS idx_need_matches_need_id ON need_matches(need_id);
CREATE INDEX IF NOT EXISTS idx_need_matches_score ON need_matches(need_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_location ON candidate_profiles USING GIST(location_geog);
CREATE INDEX IF NOT EXISTS idx_company_needs_location ON company_needs USING GIST(location_geog);

-- RLS Policies
ALTER TABLE company_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE need_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE need_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE need_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE need_target_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE need_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_packages (public read)
CREATE POLICY "Packages are viewable by everyone" ON company_packages FOR SELECT USING (active = true);

-- RLS Policies for company_purchases
CREATE POLICY "Company members can view purchases" ON company_purchases FOR SELECT USING (has_company_access(company_id));
CREATE POLICY "Company admins can insert purchases" ON company_purchases FOR INSERT WITH CHECK (is_company_admin(company_id));

-- RLS Policies for company_needs
CREATE POLICY "Company members can view needs" ON company_needs FOR SELECT USING (has_company_access(company_id));
CREATE POLICY "Company admins can manage needs" ON company_needs FOR ALL USING (is_company_admin(company_id)) WITH CHECK (is_company_admin(company_id));

-- RLS Policies for need_* tables (inherit from parent need)
CREATE POLICY "Company members can view need skills" ON need_skills FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_skills.need_id AND has_company_access(n.company_id))
);
CREATE POLICY "Company admins can manage need skills" ON need_skills FOR ALL USING (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_skills.need_id AND is_company_admin(n.company_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_skills.need_id AND is_company_admin(n.company_id))
);

CREATE POLICY "Company members can view need licenses" ON need_licenses FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_licenses.need_id AND has_company_access(n.company_id))
);
CREATE POLICY "Company admins can manage need licenses" ON need_licenses FOR ALL USING (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_licenses.need_id AND is_company_admin(n.company_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_licenses.need_id AND is_company_admin(n.company_id))
);

CREATE POLICY "Company members can view need languages" ON need_languages FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_languages.need_id AND has_company_access(n.company_id))
);
CREATE POLICY "Company admins can manage need languages" ON need_languages FOR ALL USING (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_languages.need_id AND is_company_admin(n.company_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_languages.need_id AND is_company_admin(n.company_id))
);

CREATE POLICY "Company members can view need target groups" ON need_target_groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_target_groups.need_id AND has_company_access(n.company_id))
);
CREATE POLICY "Company admins can manage need target groups" ON need_target_groups FOR ALL USING (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_target_groups.need_id AND is_company_admin(n.company_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_target_groups.need_id AND is_company_admin(n.company_id))
);

-- RLS Policies for candidate_* tables (own data)
CREATE POLICY "Users can manage their candidate profile" ON candidate_profiles FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Company members can view candidate profiles for matching" ON candidate_profiles FOR SELECT USING (true); -- For matching purposes

CREATE POLICY "Users can manage their candidate skills" ON candidate_skills FOR ALL USING (
  EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.id = candidate_skills.candidate_id AND cp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.id = candidate_skills.candidate_id AND cp.user_id = auth.uid())
);

CREATE POLICY "Users can manage their candidate licenses" ON candidate_licenses FOR ALL USING (
  EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.id = candidate_licenses.candidate_id AND cp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.id = candidate_licenses.candidate_id AND cp.user_id = auth.uid())
);

CREATE POLICY "Users can manage their candidate languages" ON candidate_languages FOR ALL USING (
  EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.id = candidate_languages.candidate_id AND cp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.id = candidate_languages.candidate_id AND cp.user_id = auth.uid())
);

-- RLS Policies for need_matches
CREATE POLICY "Company members can view need matches" ON need_matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_needs n WHERE n.id = need_matches.need_id AND has_company_access(n.company_id))
);

-- Functions

-- Company Need Quota View
CREATE OR REPLACE VIEW company_need_quota AS
SELECT 
  c.id AS company_id,
  COALESCE(cp.included_needs, 0) AS included_needs,
  COALESCE(c.need_credits, 0) AS need_credits,
  (SELECT COUNT(*) FROM company_needs n WHERE n.company_id = c.id AND n.visibility = 'active') AS used_needs,
  GREATEST(0, 
    COALESCE(cp.included_needs, 0) + COALESCE(c.need_credits, 0) 
    - (SELECT COUNT(*) FROM company_needs n WHERE n.company_id = c.id AND n.visibility = 'active')
  ) AS remaining_needs
FROM companies c
LEFT JOIN company_packages cp ON cp.id = c.package_id;

-- Function to compute match score between need and candidate
CREATE OR REPLACE FUNCTION compute_need_candidate_score(p_need_id UUID, p_candidate_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 0;
  v_passed_gates BOOLEAN := true;
  v_breakdown JSONB := '{}';
  v_must_skills INTEGER := 0;
  v_matched_must_skills INTEGER := 0;
  v_nice_skills INTEGER := 0;
  v_matched_nice_skills INTEGER := 0;
  v_location_score INTEGER := 0;
  v_target_group_match BOOLEAN := false;
BEGIN
  -- Check target group match
  SELECT EXISTS (
    SELECT 1 FROM need_target_groups ntg
    JOIN candidate_profiles cp ON cp.target_groups && ARRAY[ntg.target_group]
    WHERE ntg.need_id = p_need_id AND cp.id = p_candidate_id
  ) INTO v_target_group_match;
  
  IF NOT v_target_group_match THEN
    v_passed_gates := false;
  END IF;
  
  -- Count must skills
  SELECT COUNT(*) INTO v_must_skills
  FROM need_skills ns
  WHERE ns.need_id = p_need_id AND ns.type = 'must';
  
  -- Count matched must skills
  SELECT COUNT(*) INTO v_matched_must_skills
  FROM need_skills ns
  JOIN candidate_skills cs ON LOWER(cs.skill) = LOWER(ns.skill)
  WHERE ns.need_id = p_need_id AND ns.type = 'must' AND cs.candidate_id = p_candidate_id;
  
  -- If not all must skills are matched, fail gates
  IF v_must_skills > 0 AND v_matched_must_skills < v_must_skills THEN
    v_passed_gates := false;
  END IF;
  
  -- Count nice skills
  SELECT COUNT(*) INTO v_nice_skills
  FROM need_skills ns
  WHERE ns.need_id = p_need_id AND ns.type = 'nice';
  
  -- Count matched nice skills
  SELECT COUNT(*) INTO v_matched_nice_skills
  FROM need_skills ns
  JOIN candidate_skills cs ON LOWER(cs.skill) = LOWER(ns.skill)
  WHERE ns.need_id = p_need_id AND ns.type = 'nice' AND cs.candidate_id = p_candidate_id;
  
  -- Calculate location score (0-30 points)
  SELECT CASE 
    WHEN ST_DWithin(cn.location_geog, cp.location_geog, cn.radius_km * 1000) THEN 30
    ELSE 0
  END INTO v_location_score
  FROM company_needs cn, candidate_profiles cp
  WHERE cn.id = p_need_id AND cp.id = p_candidate_id;
  
  -- Calculate total score
  v_score := 
    -- Base score for passing gates
    CASE WHEN v_passed_gates THEN 40 ELSE 0 END +
    -- Must skills score (20 points max)
    CASE WHEN v_must_skills > 0 THEN (v_matched_must_skills * 20 / v_must_skills) ELSE 20 END +
    -- Nice skills score (20 points max)
    CASE WHEN v_nice_skills > 0 THEN (v_matched_nice_skills * 20 / v_nice_skills) ELSE 0 END +
    -- Location score (30 points max)
    v_location_score;
  
  -- Build detailed breakdown
  v_breakdown := jsonb_build_object(
    'target_group_match', v_target_group_match,
    'must_skills_total', v_must_skills,
    'must_skills_matched', v_matched_must_skills,
    'nice_skills_total', v_nice_skills,
    'nice_skills_matched', v_matched_nice_skills,
    'location_score', v_location_score
  );
  
  RETURN jsonb_build_object(
    'score', LEAST(100, v_score),
    'passed_gates', v_passed_gates,
    'breakdown', v_breakdown
  );
END;
$$;

-- Function to get matches for a need
CREATE OR REPLACE FUNCTION get_matches_for_need(p_need_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  candidate_id UUID,
  score INTEGER,
  breakdown JSONB,
  passed_gates BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cp.id AS candidate_id,
    (compute_need_candidate_score(p_need_id, cp.id)->>'score')::INTEGER AS score,
    compute_need_candidate_score(p_need_id, cp.id)->'breakdown' AS breakdown,
    (compute_need_candidate_score(p_need_id, cp.id)->>'passed_gates')::BOOLEAN AS passed_gates
  FROM candidate_profiles cp
  WHERE (compute_need_candidate_score(p_need_id, cp.id)->>'passed_gates')::BOOLEAN = true
  ORDER BY (compute_need_candidate_score(p_need_id, cp.id)->>'score')::INTEGER DESC
  LIMIT p_limit;
$$;