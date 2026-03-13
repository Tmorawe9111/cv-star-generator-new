-- Create enum tag_type if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tag_type') THEN
    CREATE TYPE public.tag_type AS ENUM ('profession','target_group','benefit','must','nice','work_env');
  END IF;
END $$;

-- Vocab tags table
CREATE TABLE IF NOT EXISTS public.vocab_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.tag_type NOT NULL,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and allow public read of vocab
ALTER TABLE public.vocab_tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vocab_tags' AND policyname = 'Vocab readable by everyone'
  ) THEN
    CREATE POLICY "Vocab readable by everyone" ON public.vocab_tags FOR SELECT USING (true);
  END IF;
END $$;

-- Seed example tags (idempotent)
INSERT INTO public.vocab_tags (type, key, label) VALUES
  -- professions
  ('profession','elektriker','Elektriker'),
  ('profession','kauffrau_bueromanagement','Kauffrau/Kaufmann für Büromanagement'),
  ('profession','mechatroniker','Mechatroniker'),
  ('profession','anlagenmechaniker_shk','Anlagenmechaniker SHK'),
  -- target groups
  ('target_group','schueler_ab_16','Schüler ab 16'),
  ('target_group','azubi','Azubi'),
  ('target_group','geselle','Geselle'),
  ('target_group','quereinsteiger','Quereinsteiger möglich'),
  -- benefits
  ('benefit','wohnheim','Azubi‑Wohnheim'),
  ('benefit','jobticket','Deutschlandticket/Jobticket'),
  ('benefit','fitness','Firmenfitness'),
  ('benefit','uebernahme','Übernahmegarantie'),
  ('benefit','werkzeug','Werkzeug gestellt'),
  ('benefit','praemien','Prämien/Bonus'),
  ('benefit','fs_foerderung','Führerscheinförderung'),
  ('benefit','auslandsaufenthalt','Auslandsaufenthalt möglich'),
  ('benefit','flex_time','Flexible Arbeitszeiten'),
  -- must
  ('must','deutsch_b1','Deutsch ≥ B1'),
  ('must','teamfaehig','Teamfähigkeit'),
  ('must','puenktlich','Pünktlichkeit'),
  ('must','ms_office','Grundkenntnisse MS Office'),
  -- nice
  ('nice','englisch_a2','Englisch A2'),
  ('nice','teamsport','Vereins-/Teamsport'),
  ('nice','praktikum','Praktikumserfahrung'),
  -- work env
  ('work_env','familiaer','familiär'),
  ('work_env','startup','Start‑up‑Atmosphäre'),
  ('work_env','international','internationales Team'),
  ('work_env','traditionell','traditionell'),
  ('work_env','kundenorientiert','kundenorientiert')
ON CONFLICT (key) DO NOTHING;

-- Extend companies with matching text fields and radius (reuse existing main_location field)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS matching_about text,
  ADD COLUMN IF NOT EXISTS matching_benefits_text text,
  ADD COLUMN IF NOT EXISTS matching_must_text text,
  ADD COLUMN IF NOT EXISTS matching_nice_text text,
  ADD COLUMN IF NOT EXISTS location_radius_km int DEFAULT 25;

-- Company tags junction
CREATE TABLE IF NOT EXISTS public.company_tags (
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.vocab_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, tag_id)
);
ALTER TABLE public.company_tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_tags' AND policyname = 'Company members can read company tags'
  ) THEN
    CREATE POLICY "Company members can read company tags" ON public.company_tags FOR SELECT USING (has_company_access(company_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_tags' AND policyname = 'Company admins can insert tags'
  ) THEN
    CREATE POLICY "Company admins can insert tags" ON public.company_tags FOR INSERT WITH CHECK (is_company_admin(company_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_tags' AND policyname = 'Company admins can delete tags'
  ) THEN
    CREATE POLICY "Company admins can delete tags" ON public.company_tags FOR DELETE USING (is_company_admin(company_id));
  END IF;
END $$;

-- Profile tags junction
CREATE TABLE IF NOT EXISTS public.profile_tags (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.vocab_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, tag_id)
);
ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_tags' AND policyname = 'Owners can read profile tags'
  ) THEN
    CREATE POLICY "Owners can read profile tags" ON public.profile_tags FOR SELECT USING (profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_tags' AND policyname = 'Owners can insert profile tags'
  ) THEN
    CREATE POLICY "Owners can insert profile tags" ON public.profile_tags FOR INSERT WITH CHECK (profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_tags' AND policyname = 'Owners can delete profile tags'
  ) THEN
    CREATE POLICY "Owners can delete profile tags" ON public.profile_tags FOR DELETE USING (profile_id = auth.uid());
  END IF;
END $$;

-- Matching RPC adjusted to current schema (profile_published)
CREATE OR REPLACE FUNCTION public.match_candidates_for_company(p_company uuid, p_limit int DEFAULT 10)
RETURNS TABLE (
  profile_id uuid,
  display_name text,
  score numeric,
  reasons text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH c_tags AS (
    SELECT vt.id, vt.type, vt.key, vt.label
    FROM public.company_tags ct
    JOIN public.vocab_tags vt ON vt.id = ct.tag_id
    WHERE ct.company_id = p_company
  ),
  prof AS (
    SELECT p.id,
      COALESCE(NULLIF(TRIM(COALESCE(p.display_name, '')), ''),
               NULLIF(TRIM(COALESCE(p.vorname, '') || ' ' || COALESCE(p.nachname, '')), '')) AS display_name
    FROM public.profiles p
    WHERE p.profile_published = true
  ),
  tag_hits AS (
    SELECT
      pt.profile_id,
      SUM(CASE WHEN vt.type = 'profession' THEN 5 ELSE 0 END) +
      SUM(CASE WHEN vt.type = 'target_group' THEN 3 ELSE 0 END) +
      SUM(CASE WHEN vt.type = 'benefit' THEN 2 ELSE 0 END) +
      SUM(CASE WHEN vt.type = 'must' THEN 5 ELSE 0 END) +
      SUM(CASE WHEN vt.type = 'nice' THEN 2 ELSE 0 END) +
      SUM(CASE WHEN vt.type = 'work_env' THEN 1 ELSE 0 END) AS tag_score,
      ARRAY_AGG(DISTINCT vt.label) AS reasons
    FROM public.profile_tags pt
    JOIN c_tags vt ON vt.id = pt.tag_id
    GROUP BY pt.profile_id
  ),
  base AS (
    SELECT
      pr.id AS profile_id,
      pr.display_name,
      COALESCE(th.tag_score, 0) AS tag_score,
      COALESCE(th.reasons, ARRAY[]::text[]) AS reasons
    FROM prof pr
    LEFT JOIN tag_hits th ON th.profile_id = pr.id
  )
  SELECT b.profile_id, b.display_name, (b.tag_score)::numeric AS score, b.reasons
  FROM base b
  ORDER BY score DESC NULLS LAST
  LIMIT p_limit;
END;
$$;