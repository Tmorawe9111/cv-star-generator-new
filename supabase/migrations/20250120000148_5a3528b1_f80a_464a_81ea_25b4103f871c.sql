
-- 1) profiles.branche-Constraint erweitern
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_branche_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_branche_check
  CHECK (
    branche = ANY (
      ARRAY[
        'handwerk',
        'it',
        'gesundheit',
        'buero',
        'verkauf',
        'gastronomie',
        'bau'
      ]::text[]
    )
  );

-- 2) Referenzdaten öffentlich lesbar machen (für nicht eingeloggte Nutzer)
-- languages_master: bisher nur authenticated; jetzt öffentlich
DROP POLICY IF EXISTS "Languages master viewable by authenticated users" ON public.languages_master;
CREATE POLICY "Languages master viewable by everyone"
  ON public.languages_master
  FOR SELECT
  USING (true);

-- skills_master: bisher nur authenticated; jetzt öffentlich
DROP POLICY IF EXISTS "Skills master viewable by authenticated users" ON public.skills_master;
CREATE POLICY "Skills master viewable by everyone"
  ON public.skills_master
  FOR SELECT
  USING (true);
