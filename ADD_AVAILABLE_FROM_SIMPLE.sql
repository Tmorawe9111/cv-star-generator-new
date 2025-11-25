-- Einfache Version zum direkten Ausführen im Supabase SQL Editor
-- Fügt die Spalte available_from zur profiles Tabelle hinzu

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS available_from TEXT;

COMMENT ON COLUMN public.profiles.available_from IS 'Date when user becomes available for job search (format: YYYY-MM, e.g., "2025-03")';

