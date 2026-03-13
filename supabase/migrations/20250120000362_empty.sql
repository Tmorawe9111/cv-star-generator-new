-- Create vocab_tags and profile_tags with RLS and seed data

-- 1) Create vocab_tags table
CREATE TABLE IF NOT EXISTS public.vocab_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('profession','must','nice','work_env','benefit','target_group')),
  synonyms TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Create profile_tags join table
CREATE TABLE IF NOT EXISTS public.profile_tags (
  profile_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.vocab_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, tag_id)
);

-- 3) Enable RLS
ALTER TABLE public.vocab_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;

-- 4) Policies
-- vocab_tags readable by everyone (public reference data)
DROP POLICY IF EXISTS "vocab readable by everyone" ON public.vocab_tags;
CREATE POLICY "vocab readable by everyone"
ON public.vocab_tags
FOR SELECT
USING (true);

-- profile_tags: users can manage their own tags
DROP POLICY IF EXISTS "Users can view own tags" ON public.profile_tags;
CREATE POLICY "Users can view own tags"
ON public.profile_tags
FOR SELECT
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can add own tags" ON public.profile_tags;
CREATE POLICY "Users can add own tags"
ON public.profile_tags
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can remove own tags" ON public.profile_tags;
CREATE POLICY "Users can remove own tags"
ON public.profile_tags
FOR DELETE
USING (auth.uid() = profile_id);

-- 5) Update trigger for vocab_tags.updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vocab_tags_updated_at ON public.vocab_tags;
CREATE TRIGGER trg_vocab_tags_updated_at
BEFORE UPDATE ON public.vocab_tags
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 6) Seed expanded tags (idempotent upserts by (name,type))
-- Create a temporary staging table for upsert
CREATE TEMP TABLE _seed_vocab (name TEXT, type TEXT);

INSERT INTO _seed_vocab (name, type) VALUES
-- Profession
('Kaufmann/-frau für Büromanagement','profession'),
('Fachinformatiker/in Anwendungsentwicklung','profession'),
('Fachinformatiker/in Systemintegration','profession'),
('Elektroniker/in für Energie- und Gebäudetechnik','profession'),
('Mechatroniker/in','profession'),
('Anlagenmechaniker/in SHK','profession'),
('Industriemechaniker/in','profession'),
('Kfz-Mechatroniker/in','profession'),
('Friseur/in','profession'),
('Medizinische/r Fachangestellte/r (MFA)','profession'),
-- Must (strengths)
('Zuverlässig','must'),('Teamfähig','must'),('Lernbereit','must'),('Pünktlich','must'),('Sorgfältig','must'),
('Kommunikativ','must'),('Eigenverantwortlich','must'),('Kundenorientiert','must'),
-- Nice-to-have
('Grundkenntnisse Programmierung','nice'),('Erste Praktika-Erfahrung','nice'),('Führerschein Klasse B','nice'),
('Englischkenntnisse','nice'),('Office-Kenntnisse','nice'),('Handwerkliches Geschick','nice'),
-- Work environment
('Kleines Team','work_env'),('Junges Team','work_env'),('Strukturierte Ausbildung','work_env'),
('Viel Praxis','work_env'),('Moderne Werkstatt','work_env'),('Remote-Anteile','work_env'),
-- Benefits
('ÖPNV-Zuschuss','benefit'),('Mitarbeiterrabatte','benefit'),('Laptop/Arbeitsgerät','benefit'),('Weiterbildung','benefit'),
('Azubi-Events','benefit'),('Übernahmemöglichkeit','benefit'),('Flexible Arbeitszeiten','benefit'),
-- Target group / status
('Schüler/in','target_group'),('Azubi','target_group'),('Geselle/ausgelernt','target_group');

-- Upsert from staging
INSERT INTO public.vocab_tags (name, type)
SELECT s.name, s.type
FROM _seed_vocab s
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS _seed_vocab;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_vocab_tags_type ON public.vocab_tags(type);
CREATE INDEX IF NOT EXISTS idx_profile_tags_profile ON public.profile_tags(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_tags_tag ON public.profile_tags(tag_id);