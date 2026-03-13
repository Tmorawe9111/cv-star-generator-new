-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  header_image TEXT,
  description TEXT,
  size_range TEXT CHECK (size_range IN ('1-10', '11-25', '26-50', '51-100', '101-250', '250+')),
  industry TEXT,
  founded_year INT,
  main_location TEXT,
  additional_locations JSONB DEFAULT '[]'::jsonb,
  website_url TEXT,
  plan_type TEXT DEFAULT 'basic',
  active_tokens INT DEFAULT 0,
  seats INT DEFAULT 1,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company users (seats management)
CREATE TABLE company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, company_id)
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  price_yearly NUMERIC,
  token_per_month INT,
  seat_count INT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tokens used (corrected to reference profiles table)
CREATE TABLE tokens_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, profile_id)
);

-- Company settings
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  target_status JSONB DEFAULT '["azubi", "schueler", "ausgelernt"]'::jsonb,
  target_industries JSONB DEFAULT '[]'::jsonb,
  target_locations JSONB DEFAULT '[]'::jsonb,
  notification_prefs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company posts
CREATE TABLE company_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'public'
);

-- Matches (corrected to reference profiles table)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('offen', 'gematcht', 'abgelehnt')) DEFAULT 'offen',
  matched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, profile_id)
);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Company users can view their company" 
ON companies FOR SELECT 
USING (id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

CREATE POLICY "Company admins can update their company" 
ON companies FOR UPDATE 
USING (id IN (
  SELECT company_id FROM company_users 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for company_users
CREATE POLICY "Company users can view team members" 
ON company_users FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

CREATE POLICY "Company admins can manage team members" 
ON company_users FOR ALL 
USING (company_id IN (
  SELECT company_id FROM company_users 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for subscriptions
CREATE POLICY "Company users can view subscriptions" 
ON subscriptions FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

-- RLS Policies for tokens_used
CREATE POLICY "Company users can view token usage" 
ON tokens_used FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

CREATE POLICY "Company users can create token usage" 
ON tokens_used FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

-- RLS Policies for company_settings
CREATE POLICY "Company users can view settings" 
ON company_settings FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

CREATE POLICY "Company admins can manage settings" 
ON company_settings FOR ALL 
USING (company_id IN (
  SELECT company_id FROM company_users 
  WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
));

-- RLS Policies for company_posts
CREATE POLICY "Anyone can view public posts" 
ON company_posts FOR SELECT 
USING (visibility = 'public');

CREATE POLICY "Company users can view all posts" 
ON company_posts FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

CREATE POLICY "Company users can create posts" 
ON company_posts FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

-- RLS Policies for matches
CREATE POLICY "Company users can view matches" 
ON matches FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

CREATE POLICY "Company users can create matches" 
ON matches FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

CREATE POLICY "Company users can update matches" 
ON matches FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();