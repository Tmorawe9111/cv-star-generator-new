-- Update Profile-Koordinaten basierend auf PLZ/Ort
-- Diese Funktion aktualisiert Profile mit Koordinaten aus postal_codes oder locations Tabellen

-- 0. Hilfsfunktion: Update postal_codes mit Koordinaten (inkl. geog)
CREATE OR REPLACE FUNCTION public.upsert_postal_code_coords(
  p_plz VARCHAR(5),
  p_lat DOUBLE PRECISION,
  p_lon DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.postal_codes
  SET 
    latitude = p_lat,
    longitude = p_lon,
    geog = ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
  WHERE plz = p_plz;
END;
$$;

-- 1. Funktion: Update Profile-Koordinaten aus postal_codes
CREATE OR REPLACE FUNCTION public.update_profile_coordinates_from_postal()
RETURNS TABLE (
  updated_count INTEGER,
  skipped_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_profile RECORD;
BEGIN
  -- Update Profile mit PLZ (wenn postal_codes Koordinaten hat)
  FOR v_profile IN
    SELECT p.id, p.plz, p.ort
    FROM public.profiles p
    WHERE p.plz IS NOT NULL
      AND (p.latitude IS NULL OR p.longitude IS NULL OR p.geog IS NULL)
      AND p.profile_published = true
  LOOP
    -- Versuche Koordinaten aus postal_codes zu holen
    UPDATE public.profiles
    SET 
      latitude = pc.latitude,
      longitude = pc.longitude,
      geog = ST_SetSRID(ST_MakePoint(pc.longitude, pc.latitude), 4326)::geography
    FROM public.postal_codes pc
    WHERE profiles.id = v_profile.id
      AND profiles.plz = pc.plz
      AND pc.latitude IS NOT NULL
      AND pc.longitude IS NOT NULL;

    IF FOUND THEN
      v_updated := v_updated + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_updated, v_skipped;
END;
$$;

-- 2. Funktion: Update Profile-Koordinaten aus locations Tabelle
CREATE OR REPLACE FUNCTION public.update_profile_coordinates_from_locations()
RETURNS TABLE (
  updated_count INTEGER,
  skipped_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_profile RECORD;
BEGIN
  -- Update Profile mit PLZ und Ort (wenn locations Koordinaten hat)
  FOR v_profile IN
    SELECT p.id, p.plz, p.ort
    FROM public.profiles p
    WHERE p.plz IS NOT NULL
      AND p.ort IS NOT NULL
      AND (p.latitude IS NULL OR p.longitude IS NULL OR p.geog IS NULL)
      AND p.profile_published = true
  LOOP
    -- Versuche Koordinaten aus locations zu holen
    UPDATE public.profiles
    SET 
      latitude = ST_Y(l.geog::geometry),
      longitude = ST_X(l.geog::geometry),
      geog = l.geog
    FROM public.locations l
    WHERE profiles.id = v_profile.id
      AND profiles.plz = l.postal_code
      AND LOWER(profiles.ort) = LOWER(l.city)
      AND l.geog IS NOT NULL;

    IF FOUND THEN
      v_updated := v_updated + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_updated, v_skipped;
END;
$$;

-- 3. Funktion: Update alle Profile-Koordinaten (ruft beide Funktionen auf)
CREATE OR REPLACE FUNCTION public.update_all_profile_coordinates()
RETURNS TABLE (
  total_updated INTEGER,
  total_skipped INTEGER,
  from_postal_codes INTEGER,
  from_locations INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_postal_result RECORD;
  v_location_result RECORD;
BEGIN
  -- Update aus postal_codes
  SELECT * INTO v_postal_result FROM public.update_profile_coordinates_from_postal();
  
  -- Update aus locations (nur die, die noch keine Koordinaten haben)
  SELECT * INTO v_location_result FROM public.update_profile_coordinates_from_locations();

  RETURN QUERY SELECT 
    (v_postal_result.updated_count + v_location_result.updated_count)::INTEGER AS total_updated,
    (v_postal_result.skipped_count + v_location_result.skipped_count)::INTEGER AS total_skipped,
    v_postal_result.updated_count::INTEGER AS from_postal_codes,
    v_location_result.updated_count::INTEGER AS from_locations;
END;
$$;

-- 4. Trigger: Automatisches Update bei Profile-Änderung (optional)
CREATE OR REPLACE FUNCTION public.trigger_update_profile_coordinates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Wenn PLZ oder Ort geändert wurde und Koordinaten fehlen
  IF (NEW.plz IS NOT NULL OR NEW.ort IS NOT NULL) 
     AND (NEW.latitude IS NULL OR NEW.longitude IS NULL OR NEW.geog IS NULL) THEN
    
    -- Versuche aus postal_codes
    IF NEW.plz IS NOT NULL THEN
      UPDATE public.profiles
      SET 
        latitude = pc.latitude,
        longitude = pc.longitude,
        geog = ST_SetSRID(ST_MakePoint(pc.longitude, pc.latitude), 4326)::geography
      FROM public.postal_codes pc
      WHERE profiles.id = NEW.id
        AND profiles.plz = pc.plz
        AND pc.latitude IS NOT NULL
        AND pc.longitude IS NOT NULL;
    END IF;

    -- Falls nicht gefunden, versuche aus locations
    IF NEW.latitude IS NULL AND NEW.plz IS NOT NULL AND NEW.ort IS NOT NULL THEN
      UPDATE public.profiles
      SET 
        latitude = ST_Y(l.geog::geometry),
        longitude = ST_X(l.geog::geometry),
        geog = l.geog
      FROM public.locations l
      WHERE profiles.id = NEW.id
        AND profiles.plz = l.postal_code
        AND LOWER(profiles.ort) = LOWER(l.city)
        AND l.geog IS NOT NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger aktivieren (optional - kann auch manuell aufgerufen werden)
-- DROP TRIGGER IF EXISTS trigger_update_profile_coords ON public.profiles;
-- CREATE TRIGGER trigger_update_profile_coords
--   AFTER INSERT OR UPDATE OF plz, ort ON public.profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION public.trigger_update_profile_coordinates();

-- Kommentare
COMMENT ON FUNCTION public.update_profile_coordinates_from_postal IS 'Aktualisiert Profile-Koordinaten aus postal_codes Tabelle basierend auf PLZ';
COMMENT ON FUNCTION public.update_profile_coordinates_from_locations IS 'Aktualisiert Profile-Koordinaten aus locations Tabelle basierend auf PLZ und Ort';
COMMENT ON FUNCTION public.update_all_profile_coordinates IS 'Aktualisiert alle Profile-Koordinaten aus postal_codes und locations Tabellen';
COMMENT ON FUNCTION public.trigger_update_profile_coordinates IS 'Trigger-Funktion für automatisches Update von Profile-Koordinaten bei Änderung von PLZ/Ort';

