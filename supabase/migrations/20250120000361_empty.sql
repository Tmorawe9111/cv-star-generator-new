-- 1) Vokabel-Tabelle für Tags (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS public.vocab_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS aktivieren (Referenzdaten sind lesbar)
ALTER TABLE public.vocab_tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vocab_tags' AND policyname = 'Vocab readable by everyone'
  ) THEN
    CREATE POLICY "Vocab readable by everyone"
    ON public.vocab_tags
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Nur Admins/Editoren könnten schreiben – hier keine Policy, Seeds via Migration

-- 2) Join-Tabelle für Profil-Tags (User-seitig)
CREATE TABLE IF NOT EXISTS public.profile_tags (
  profile_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.vocab_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, tag_id)
);

ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;

-- Policies: Nutzer verwalten nur eigene Tags
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_tags' AND policyname = 'Users can read own tags'
  ) THEN
    CREATE POLICY "Users can read own tags"
    ON public.profile_tags
    FOR SELECT
    USING (profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_tags' AND policyname = 'Users can insert own tags'
  ) THEN
    CREATE POLICY "Users can insert own tags"
    ON public.profile_tags
    FOR INSERT
    WITH CHECK (profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_tags' AND policyname = 'Users can delete own tags'
  ) THEN
    CREATE POLICY "Users can delete own tags"
    ON public.profile_tags
    FOR DELETE
    USING (profile_id = auth.uid());
  END IF;
END $$;

-- 3) Seed-Tags (erweitert). Nutzt ON CONFLICT DO NOTHING, um Duplikate zu vermeiden
INSERT INTO public.vocab_tags (type, key, label)
VALUES
  -- profession
  ('profession','kaufleute-buero','Kaufmann/-frau für Büromanagement'),
  ('profession','fachinformatiker-ae','Fachinformatiker/in Anwendungsentwicklung'),
  ('profession','fachinformatiker-si','Fachinformatiker/in Systemintegration'),
  ('profession','mechatroniker','Mechatroniker/in'),
  ('profession','elektroniker-betriebstechnik','Elektroniker/in für Betriebstechnik'),
  ('profession','industriekaufmann','Industriekaufmann/-frau'),
  ('profession','mediengestalter','Mediengestalter/in Digital und Print'),

  -- target_group
  ('target_group','azubi','Azubi'),
  ('target_group','schueler','Schüler/in'),
  ('target_group','studierende','Studierende/r'),
  ('target_group','ausgelernt','Ausgelernt/Young Professional'),

  -- benefit
  ('benefit','homeoffice','Homeoffice (nach Einarbeitung)'),
  ('benefit','oePNV-zuschuss','ÖPNV-Zuschuss'),
  ('benefit','rabatte','Mitarbeiterrabatte'),
  ('benefit','dienstlaptop','Dienstlaptop/Handy'),
  ('benefit','kantine','Kantine/Essenszuschuss'),

  -- must (Muss-Kriterien)
  ('must','zuverlaessigkeit','Zuverlässigkeit'),
  ('must','teamfaehigkeit','Teamfähigkeit'),
  ('must','deutsch-b2','Deutsch B2+'),
  ('must','praxisorientiert','Praxisorientierte Arbeitsweise'),

  -- nice (Nice-to-have)
  ('nice','fuehrerschein-b','Führerschein Klasse B'),
  ('nice','kundenservice-erfahrung','Erfahrung im Kundenservice'),
  ('nice','office-kenntnisse','Gute MS-Office-Kenntnisse'),
  ('nice','git-kenntnisse','Grundkenntnisse in Git'),

  -- work_env
  ('work_env','startup','Startup-Umfeld'),
  ('work_env','familienbetrieb','Familienbetrieb'),
  ('work_env','konzern','Konzern-Strukturen'),
  ('work_env','handwerk','Handwerklicher Betrieb')
ON CONFLICT (key) DO NOTHING;