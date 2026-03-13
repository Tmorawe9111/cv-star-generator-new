-- Add CV-related fields and status flags to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_published boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_created boolean DEFAULT true;

-- Add CV data fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vorname text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nachname text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS geburtsdatum date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS strasse text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hausnummer text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plz text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefon text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profilbild_url text;

-- Branch and status fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branche text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text;

-- Education fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS schule text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS geplanter_abschluss text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS abschlussjahr text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ausbildungsberuf text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ausbildungsbetrieb text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS startjahr text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voraussichtliches_ende text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS abschlussjahr_ausgelernt text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aktueller_beruf text;

-- Skills and languages
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sprachen jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faehigkeiten text[] DEFAULT ARRAY[]::text[];

-- School and work experience
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS schulbildung jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS berufserfahrung jsonb DEFAULT '[]'::jsonb;

-- Layout and AI-generated content
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS layout_id integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ueber_mich text;

-- Consent
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS einwilligung boolean DEFAULT false;

-- Add index for published profiles
CREATE INDEX IF NOT EXISTS idx_profiles_published ON public.profiles(profile_published) WHERE profile_published = true;