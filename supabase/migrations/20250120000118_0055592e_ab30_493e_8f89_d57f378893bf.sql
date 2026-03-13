-- Create profiles table for user CV data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  
  -- Basic CV data
  branche TEXT CHECK (branche IN ('handwerk', 'it', 'gesundheit')),
  status TEXT CHECK (status IN ('schueler', 'azubi', 'ausgelernt')),
  
  -- Personal data
  vorname TEXT,
  nachname TEXT,
  geburtsdatum DATE,
  strasse TEXT,
  hausnummer TEXT,
  plz VARCHAR(5),
  ort TEXT,
  telefon TEXT,
  email TEXT,
  avatar_url TEXT,
  
  -- Status-specific data
  schule TEXT,
  geplanter_abschluss TEXT,
  abschlussjahr TEXT,
  ausbildungsberuf TEXT,
  ausbildungsbetrieb TEXT,
  startjahr TEXT,
  voraussichtliches_ende TEXT,
  abschlussjahr_ausgelernt TEXT,
  aktueller_beruf TEXT,
  
  -- Skills and languages (JSON for flexibility)
  sprachen JSONB DEFAULT '[]',
  faehigkeiten JSONB DEFAULT '[]',
  
  -- Experience data (JSON arrays)
  schulbildung JSONB DEFAULT '[]',
  berufserfahrung JSONB DEFAULT '[]',
  
  -- AI-generated content
  ueberMich TEXT,
  kenntnisse TEXT,
  motivation TEXT,
  praktische_erfahrung TEXT,
  
  -- Profile settings
  layout INTEGER DEFAULT 1,
  profile_published BOOLEAN DEFAULT FALSE,
  profile_complete BOOLEAN DEFAULT FALSE,
  account_created BOOLEAN DEFAULT FALSE,
  einwilligung BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reference data tables for standardized dropdowns

-- German postal codes and cities
CREATE TABLE public.postal_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plz VARCHAR(5) NOT NULL,
  ort TEXT NOT NULL,
  bundesland TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Languages for dropdown selection
CREATE TABLE public.languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code VARCHAR(3) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- School types for education dropdown
CREATE TABLE public.school_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills categorized by branch
CREATE TABLE public.skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  branch TEXT CHECK (branch IN ('handwerk', 'it', 'gesundheit')),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community tables (for future features)
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postal_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view published profiles" 
ON public.profiles 
FOR SELECT 
USING (profile_published = true OR auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- RLS Policies for reference data (read-only for all authenticated users)
CREATE POLICY "Reference data is viewable by authenticated users" 
ON public.postal_codes 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Languages are viewable by authenticated users" 
ON public.languages 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "School types are viewable by authenticated users" 
ON public.school_types 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Skills are viewable by authenticated users" 
ON public.skills 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" 
ON public.posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for follows
CREATE POLICY "Follows are viewable by authenticated users" 
ON public.follows 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own follows" 
ON public.follows 
FOR ALL 
USING (auth.uid() = follower_id);

-- Create indexes for performance
CREATE INDEX idx_profiles_published ON public.profiles(profile_published);
CREATE INDEX idx_profiles_branche ON public.profiles(branche);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_postal_codes_plz ON public.postal_codes(plz);
CREATE INDEX idx_skills_branch ON public.skills(branch);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, account_created)
  VALUES (
    NEW.id, 
    NEW.email,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample reference data

-- Languages
INSERT INTO public.languages (name, code) VALUES
('Deutsch', 'de'),
('Englisch', 'en'),
('Französisch', 'fr'),
('Spanisch', 'es'),
('Italienisch', 'it'),
('Portugiesisch', 'pt'),
('Russisch', 'ru'),
('Türkisch', 'tr'),
('Arabisch', 'ar'),
('Chinesisch', 'zh'),
('Japanisch', 'ja'),
('Koreanisch', 'ko'),
('Niederländisch', 'nl'),
('Polnisch', 'pl'),
('Tschechisch', 'cs'),
('Ungarisch', 'hu'),
('Rumänisch', 'ro'),
('Bulgarisch', 'bg'),
('Kroatisch', 'hr'),
('Serbisch', 'sr');

-- School types
INSERT INTO public.school_types (name, category) VALUES
('Hauptschule', 'Allgemeinbildend'),
('Realschule', 'Allgemeinbildend'),
('Gymnasium', 'Allgemeinbildend'),
('Gesamtschule', 'Allgemeinbildend'),
('Berufsschule', 'Beruflich'),
('Berufsfachschule', 'Beruflich'),
('Fachoberschule', 'Beruflich'),
('Berufsoberschule', 'Beruflich'),
('Fachschule', 'Beruflich'),
('Berufskolleg', 'Beruflich'),
('Fachhochschule', 'Hochschule'),
('Universität', 'Hochschule'),
('Duale Hochschule', 'Hochschule');

-- Skills by branch - Handwerk
INSERT INTO public.skills (name, branch, category) VALUES
('Werkzeugnutzung', 'handwerk', 'Praktisch'),
('Handwerkliches Geschick', 'handwerk', 'Praktisch'),
('Präzises Arbeiten', 'handwerk', 'Praktisch'),
('Materialkunde', 'handwerk', 'Fachlich'),
('Arbeitssicherheit', 'handwerk', 'Fachlich'),
('Qualitätskontrolle', 'handwerk', 'Fachlich'),
('Teamarbeit', 'handwerk', 'Sozial'),
('Kundenorientierung', 'handwerk', 'Sozial'),
('Problemlösung', 'handwerk', 'Kognitiv'),
('Sorgfältigkeit', 'handwerk', 'Persönlich'),
('Körperliche Belastbarkeit', 'handwerk', 'Physisch'),
('Technisches Verständnis', 'handwerk', 'Kognitiv'),
('Kreativität', 'handwerk', 'Persönlich'),
('Zuverlässigkeit', 'handwerk', 'Persönlich'),
('Flexibilität', 'handwerk', 'Persönlich');

-- Skills by branch - IT
INSERT INTO public.skills (name, branch, category) VALUES
('Programmierung', 'it', 'Fachlich'),
('Datenbanken', 'it', 'Fachlich'),
('Netzwerktechnik', 'it', 'Fachlich'),
('Systemadministration', 'it', 'Fachlich'),
('Cybersecurity', 'it', 'Fachlich'),
('Webentwicklung', 'it', 'Fachlich'),
('Analytisches Denken', 'it', 'Kognitiv'),
('Problemlösung', 'it', 'Kognitiv'),
('Projektmanagement', 'it', 'Organisatorisch'),
('Teamarbeit', 'it', 'Sozial'),
('Kommunikation', 'it', 'Sozial'),
('Lernbereitschaft', 'it', 'Persönlich'),
('Detailgenauigkeit', 'it', 'Persönlich'),
('Stressresistenz', 'it', 'Persönlich'),
('Innovationsfreude', 'it', 'Persönlich');

-- Skills by branch - Gesundheit
INSERT INTO public.skills (name, branch, category) VALUES
('Patientenbetreuung', 'gesundheit', 'Sozial'),
('Erste Hilfe', 'gesundheit', 'Fachlich'),
('Empathie', 'gesundheit', 'Sozial'),
('Hygienemaßnahmen', 'gesundheit', 'Fachlich'),
('Medizinische Grundlagen', 'gesundheit', 'Fachlich'),
('Dokumentation', 'gesundheit', 'Organisatorisch'),
('Kommunikationsfähigkeit', 'gesundheit', 'Sozial'),
('Belastbarkeit', 'gesundheit', 'Persönlich'),
('Verantwortungsbewusstsein', 'gesundheit', 'Persönlich'),
('Teamarbeit', 'gesundheit', 'Sozial'),
('Sorgfältigkeit', 'gesundheit', 'Persönlich'),
('Diskretion', 'gesundheit', 'Persönlich'),
('Geduld', 'gesundheit', 'Persönlich'),
('Flexibilität', 'gesundheit', 'Persönlich'),
('Einfühlungsvermögen', 'gesundheit', 'Sozial');

-- Sample postal codes (major German cities)
INSERT INTO public.postal_codes (plz, ort, bundesland) VALUES
('10115', 'Berlin', 'Berlin'),
('20095', 'Hamburg', 'Hamburg'),
('80331', 'München', 'Bayern'),
('50667', 'Köln', 'Nordrhein-Westfalen'),
('60311', 'Frankfurt am Main', 'Hessen'),
('70173', 'Stuttgart', 'Baden-Württemberg'),
('40213', 'Düsseldorf', 'Nordrhein-Westfalen'),
('44135', 'Dortmund', 'Nordrhein-Westfalen'),
('45127', 'Essen', 'Nordrhein-Westfalen'),
('04109', 'Leipzig', 'Sachsen'),
('01067', 'Dresden', 'Sachsen'),
('30159', 'Hannover', 'Niedersachsen'),
('90402', 'Nürnberg', 'Bayern'),
('68159', 'Mannheim', 'Baden-Württemberg'),
('76133', 'Karlsruhe', 'Baden-Württemberg');