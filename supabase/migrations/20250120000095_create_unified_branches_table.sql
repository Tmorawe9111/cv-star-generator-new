-- Create unified branches table for both users and companies
-- This replaces the need for separate industry/branche fields and ensures consistency

-- Create branches table with standardized keys
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- e.g., 'handwerk', 'it', 'gesundheit'
  label TEXT NOT NULL, -- e.g., 'Handwerk', 'IT & Software'
  emoji TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standardized branches from src/lib/branches.ts
INSERT INTO public.branches (key, label, emoji, description) VALUES
  ('handwerk', 'Handwerk', '👷', 'Bau, Elektro, Sanitär, KFZ und mehr'),
  ('it', 'IT & Software', '💻', 'Programmierung, Support, Systemadmin'),
  ('gesundheit', 'Gesundheit', '🩺', 'Pflege, Therapie, medizinische Assistenz'),
  ('buero', 'Büro & Verwaltung', '📊', 'Organisation, Kommunikation, Administration'),
  ('verkauf', 'Verkauf & Handel', '🛍️', 'Beratung, Kundenservice, Einzelhandel'),
  ('gastronomie', 'Gastronomie', '🍽️', 'Service, Küche, Hotellerie'),
  ('bau', 'Bau & Architektur', '🏗️', 'Konstruktion, Planung, Ausführung')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_branches_key ON public.branches(key);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read branches
CREATE POLICY "Anyone can view branches" ON public.branches
  FOR SELECT USING (true);

-- Update profiles.branche to reference branches.key
-- First, ensure all existing values are valid branch keys
DO $$
DECLARE
  invalid_branches TEXT[];
BEGIN
  -- Find profiles with branche values that don't exist in branches table
  SELECT ARRAY_AGG(DISTINCT branche)
  INTO invalid_branches
  FROM profiles
  WHERE branche IS NOT NULL
    AND branche NOT IN (SELECT key FROM branches);
  
  -- Log invalid branches (we'll keep them for now, but they won't match)
  IF invalid_branches IS NOT NULL THEN
    RAISE NOTICE 'Found profiles with non-standard branches: %', invalid_branches;
  END IF;
END $$;

-- Update companies.industry to use branch keys instead of free text
-- Map common industry values to branch keys
UPDATE public.companies
SET industry = CASE
  WHEN LOWER(industry) LIKE '%handwerk%' OR LOWER(industry) = 'handwerk' THEN 'handwerk'
  WHEN LOWER(industry) LIKE '%it%' OR LOWER(industry) LIKE '%software%' OR LOWER(industry) = 'it' THEN 'it'
  WHEN LOWER(industry) LIKE '%gesundheit%' OR LOWER(industry) LIKE '%pflege%' OR LOWER(industry) = 'gesundheit' THEN 'gesundheit'
  WHEN LOWER(industry) LIKE '%büro%' OR LOWER(industry) LIKE '%verwaltung%' OR LOWER(industry) = 'buero' THEN 'buero'
  WHEN LOWER(industry) LIKE '%verkauf%' OR LOWER(industry) LIKE '%handel%' OR LOWER(industry) = 'verkauf' THEN 'verkauf'
  WHEN LOWER(industry) LIKE '%gastronomie%' OR LOWER(industry) LIKE '%hotel%' OR LOWER(industry) = 'gastronomie' THEN 'gastronomie'
  WHEN LOWER(industry) LIKE '%bau%' OR LOWER(industry) LIKE '%architektur%' OR LOWER(industry) = 'bau' THEN 'bau'
  ELSE industry -- Keep original if no match found
END
WHERE industry IS NOT NULL;

-- Update job_posts.industry to use branch keys
UPDATE public.job_posts
SET industry = CASE
  WHEN LOWER(industry) LIKE '%handwerk%' OR LOWER(industry) = 'handwerk' THEN 'handwerk'
  WHEN LOWER(industry) LIKE '%it%' OR LOWER(industry) LIKE '%software%' OR LOWER(industry) = 'it & software' OR LOWER(industry) = 'it & technologie' THEN 'it'
  WHEN LOWER(industry) LIKE '%gesundheit%' OR LOWER(industry) LIKE '%pflege%' OR LOWER(industry) = 'gesundheit' OR LOWER(industry) = 'gesundheit & pflege' THEN 'gesundheit'
  WHEN LOWER(industry) LIKE '%büro%' OR LOWER(industry) LIKE '%verwaltung%' OR LOWER(industry) = 'büro & verwaltung' THEN 'buero'
  WHEN LOWER(industry) LIKE '%verkauf%' OR LOWER(industry) LIKE '%handel%' OR LOWER(industry) = 'verkauf & handel' OR LOWER(industry) = 'einzelhandel' THEN 'verkauf'
  WHEN LOWER(industry) LIKE '%gastronomie%' OR LOWER(industry) LIKE '%hotel%' OR LOWER(industry) = 'gastronomie' OR LOWER(industry) = 'gastronomie & hotellerie' THEN 'gastronomie'
  WHEN LOWER(industry) LIKE '%bau%' OR LOWER(industry) LIKE '%architektur%' OR LOWER(industry) = 'bau & architektur' THEN 'bau'
  ELSE industry -- Keep original if no match found
END
WHERE industry IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE public.branches IS 'Unified branches table for users (profiles.branche) and companies (companies.industry). Keys match src/lib/branches.ts';
COMMENT ON COLUMN public.branches.key IS 'Standardized branch key (e.g., handwerk, it, gesundheit) - used in profiles.branche and companies.industry';
COMMENT ON COLUMN public.branches.label IS 'Human-readable label (e.g., Handwerk, IT & Software)';

