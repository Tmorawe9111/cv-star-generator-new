-- Alternative: Lade alle PLZ-Koordinaten direkt via SQL
-- Diese Funktion lädt alle PLZ aus postal_codes und aktualisiert sie mit Koordinaten
-- Falls postal_codes noch keine Koordinaten hat, müssen sie zuerst geladen werden

-- Schritt 1: Prüfe wie viele PLZ bereits Koordinaten haben
SELECT 
  COUNT(*) as total_plz,
  COUNT(latitude) as with_coords,
  COUNT(*) - COUNT(latitude) as without_coords
FROM postal_codes;

-- Schritt 2: Falls viele PLZ ohne Koordinaten sind, verwende die bestehende seed-locations-de Function
-- Gehe zu: Supabase Dashboard → Edge Functions → seed-locations-de → Invoke
-- Body: {"limit": 0} (0 = alle, keine Limitierung)

-- Schritt 3: Oder verwende diese SQL-Funktion um postal_codes direkt zu aktualisieren
-- (Funktioniert nur wenn postal_codes bereits Koordinaten aus CSV hat)

-- Update postal_codes geog Spalte aus lat/lon
UPDATE postal_codes
SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND geog IS NULL;

-- Schritt 4: Update Profile-Koordinaten
SELECT * FROM public.update_all_profile_coordinates();

