-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create postal_codes table for German postal codes
CREATE TABLE IF NOT EXISTS public.postal_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plz VARCHAR(5) NOT NULL,
  ort TEXT NOT NULL,
  bundesland TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create school_types table
CREATE TABLE IF NOT EXISTS public.school_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  branch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create languages table
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.postal_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reference data (read-only for authenticated users)
CREATE POLICY "Reference data is viewable by authenticated users" ON public.postal_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "School types are viewable by authenticated users" ON public.school_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Skills are viewable by authenticated users" ON public.skills
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Languages are viewable by authenticated users" ON public.languages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Update profiles table with additional CV fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vorname TEXT,
ADD COLUMN IF NOT EXISTS nachname TEXT,
ADD COLUMN IF NOT EXISTS strasse TEXT,
ADD COLUMN IF NOT EXISTS hausnummer TEXT,
ADD COLUMN IF NOT EXISTS plz VARCHAR(5),
ADD COLUMN IF NOT EXISTS ort TEXT,
ADD COLUMN IF NOT EXISTS telefon TEXT,
ADD COLUMN IF NOT EXISTS geburtsdatum DATE,
ADD COLUMN IF NOT EXISTS schule TEXT,
ADD COLUMN IF NOT EXISTS geplanter_abschluss TEXT,
ADD COLUMN IF NOT EXISTS abschlussjahr TEXT,
ADD COLUMN IF NOT EXISTS ausbildungsberuf TEXT,
ADD COLUMN IF NOT EXISTS ausbildungsbetrieb TEXT,
ADD COLUMN IF NOT EXISTS startjahr TEXT,
ADD COLUMN IF NOT EXISTS voraussichtliches_ende TEXT,
ADD COLUMN IF NOT EXISTS abschlussjahr_ausgelernt TEXT,
ADD COLUMN IF NOT EXISTS aktueller_beruf TEXT,
ADD COLUMN IF NOT EXISTS praktische_erfahrung TEXT,
ADD COLUMN IF NOT EXISTS branche TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS kenntnisse TEXT,
ADD COLUMN IF NOT EXISTS uebermich TEXT,
ADD COLUMN IF NOT EXISTS motivation TEXT,
ADD COLUMN IF NOT EXISTS schulbildung JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS berufserfahrung JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS faehigkeiten JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sprachen JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS layout INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS einwilligung BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_published BOOLEAN DEFAULT FALSE;

-- Insert sample postal codes (major German cities)
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
('01067', 'Dresden', 'Sachsen'),
('04109', 'Leipzig', 'Sachsen'),
('30159', 'Hannover', 'Niedersachsen'),
('90402', 'Nürnberg', 'Bayern'),
('28195', 'Bremen', 'Bremen'),
('24103', 'Kiel', 'Schleswig-Holstein')
ON CONFLICT (plz) DO NOTHING;

-- Insert school types
INSERT INTO public.school_types (name, category) VALUES
('Grundschule', 'Primarstufe'),
('Hauptschule', 'Sekundarstufe I'),
('Realschule', 'Sekundarstufe I'),
('Gymnasium', 'Sekundarstufe I/II'),
('Gesamtschule', 'Sekundarstufe I/II'),
('Berufsschule', 'Berufliche Bildung'),
('Berufsfachschule', 'Berufliche Bildung'),
('Fachoberschule', 'Berufliche Bildung'),
('Berufsoberschule', 'Berufliche Bildung'),
('Fachhochschule', 'Hochschule'),
('Universität', 'Hochschule')
ON CONFLICT (name) DO NOTHING;

-- Insert common skills
INSERT INTO public.skills (name, category, branch) VALUES
('Microsoft Office', 'Software', 'Allgemein'),
('Excel', 'Software', 'Allgemein'),
('PowerPoint', 'Software', 'Allgemein'),
('Word', 'Software', 'Allgemein'),
('Teamarbeit', 'Soft Skills', 'Allgemein'),
('Kommunikation', 'Soft Skills', 'Allgemein'),
('Problemlösung', 'Soft Skills', 'Allgemein'),
('Zeitmanagement', 'Soft Skills', 'Allgemein'),
('Führungsqualitäten', 'Soft Skills', 'Allgemein'),
('Projektmanagement', 'Fachkompetenz', 'Allgemein'),
('Kundenbetreuung', 'Fachkompetenz', 'Handel'),
('Verkauf', 'Fachkompetenz', 'Handel'),
('Buchhaltung', 'Fachkompetenz', 'Finanzen'),
('HTML/CSS', 'Programmierung', 'IT'),
('JavaScript', 'Programmierung', 'IT'),
('Python', 'Programmierung', 'IT'),
('Maschinenbedienung', 'Technisch', 'Produktion'),
('Qualitätskontrolle', 'Technisch', 'Produktion'),
('Schweißen', 'Handwerk', 'Metallbau'),
('Elektroinstallation', 'Handwerk', 'Elektro')
ON CONFLICT (name) DO NOTHING;

-- Insert languages
INSERT INTO public.languages (code, name) VALUES
('de', 'Deutsch'),
('en', 'Englisch'),
('fr', 'Französisch'),
('es', 'Spanisch'),
('it', 'Italienisch'),
('pt', 'Portugiesisch'),
('ru', 'Russisch'),
('zh', 'Chinesisch'),
('ja', 'Japanisch'),
('ar', 'Arabisch'),
('tr', 'Türkisch'),
('pl', 'Polnisch'),
('nl', 'Niederländisch'),
('sv', 'Schwedisch'),
('da', 'Dänisch'),
('no', 'Norwegisch'),
('fi', 'Finnisch'),
('cs', 'Tschechisch'),
('hu', 'Ungarisch'),
('ro', 'Rumänisch')
ON CONFLICT (name) DO NOTHING;