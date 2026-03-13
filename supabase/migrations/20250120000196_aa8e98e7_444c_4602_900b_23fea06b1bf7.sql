-- Add job_search_preferences to profiles for user visibility preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS job_search_preferences TEXT[] NOT NULL DEFAULT '{}';

-- Optional comment for clarity
COMMENT ON COLUMN public.profiles.job_search_preferences IS 'Mehrfachauswahl, was Kandidat:innen aktiv suchen (z. B. Praktikum, Ausbildung, nach der Ausbildung einen Job, Ausbildungsplatzwechsel)';