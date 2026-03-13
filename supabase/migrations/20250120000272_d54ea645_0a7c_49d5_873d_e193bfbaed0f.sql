-- Erweitere den Status Check Constraint auf der profiles-Tabelle
-- um alle Status-Werte zu erlauben, die im ProfileDetailsStep verwendet werden

-- Lösche den alten Constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Erstelle den neuen Constraint mit allen Status-Werten
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status = ANY (ARRAY[
  'schueler'::text,
  'azubi'::text,
  'fachkraft'::text,
  'student'::text,
  'absolvent'::text,
  'berufstaetig'::text,
  'arbeitssuchend'::text,
  'ausgelernt'::text
]));