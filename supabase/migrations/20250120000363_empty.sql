-- Align with existing schema: add unique index and policies; seed tags

-- 1) Ensure RLS enabled
ALTER TABLE public.vocab_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;

-- 2) Policies
DROP POLICY IF EXISTS "vocab readable by everyone" ON public.vocab_tags;
CREATE POLICY "vocab readable by everyone"
ON public.vocab_tags
FOR SELECT
USING (true);

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

-- 3) Unique index for idempotent seeds
CREATE UNIQUE INDEX IF NOT EXISTS uniq_vocab_type_key ON public.vocab_tags(type, key);

-- 4) Seed data (key, label, type)
INSERT INTO public.vocab_tags (key, label, type)
VALUES
-- Profession
('buero-kfm','Kaufmann/-frau für Büromanagement','profession'),
('fi-ae','Fachinformatiker/in Anwendungsentwicklung','profession'),
('fi-si','Fachinformatiker/in Systemintegration','profession'),
('elektroniker-energie-gebaeude','Elektroniker/in für Energie- und Gebäudetechnik','profession'),
('mechatroniker','Mechatroniker/in','profession'),
('anlagenmechaniker-shk','Anlagenmechaniker/in SHK','profession'),
('industriemechaniker','Industriemechaniker/in','profession'),
('kfz-mechatroniker','Kfz-Mechatroniker/in','profession'),
('friseur','Friseur/in','profession'),
('mfa','Medizinische/r Fachangestellte/r (MFA)','profession'),
-- Must
('zuverlaessig','Zuverlässig','must'),
('teamfaehig','Teamfähig','must'),
('lernbereit','Lernbereit','must'),
('puenktlich','Pünktlich','must'),
('sorgfaeltig','Sorgfältig','must'),
('kommunikativ','Kommunikativ','must'),
('eigenverantwortlich','Eigenverantwortlich','must'),
('kundenorientiert','Kundenorientiert','must'),
-- Nice
('prog-grundkenntnisse','Grundkenntnisse Programmierung','nice'),
('praktika-erfahrung','Erste Praktika-Erfahrung','nice'),
('fuehrerschein-b','Führerschein Klasse B','nice'),
('englisch','Englischkenntnisse','nice'),
('office','Office-Kenntnisse','nice'),
('handwerkliches-geschick','Handwerkliches Geschick','nice'),
-- Work env
('kleines-team','Kleines Team','work_env'),
('junges-team','Junges Team','work_env'),
('strukturierte-ausbildung','Strukturierte Ausbildung','work_env'),
('viel-praxis','Viel Praxis','work_env'),
('moderne-werkstatt','Moderne Werkstatt','work_env'),
('remote-anteile','Remote-Anteile','work_env'),
-- Benefits
('oepnv-zuschuss','ÖPNV-Zuschuss','benefit'),
('mitarbeiterrabatte','Mitarbeiterrabatte','benefit'),
('arbeitsgeraet','Laptop/Arbeitsgerät','benefit'),
('weiterbildung','Weiterbildung','benefit'),
('azubi-events','Azubi-Events','benefit'),
('uebernahmemoeglichkeit','Übernahmemöglichkeit','benefit'),
('flexible-zeiten','Flexible Arbeitszeiten','benefit'),
-- Target group
('schueler','Schüler/in','target_group'),
('azubi','Azubi','target_group'),
('ausgelernt','Geselle/ausgelernt','target_group')
ON CONFLICT (type, key) DO NOTHING;