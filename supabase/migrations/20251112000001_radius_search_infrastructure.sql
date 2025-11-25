-- Radius-Suche Infrastruktur
-- Erweitert bestehende locations Tabelle (mit PostGIS) und fügt Radius-Suche Funktionen hinzu

-- 1. Prüfe und erweitere locations Tabelle
DO $$
BEGIN
  -- Füge full_address hinzu, falls nicht vorhanden
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'full_address') THEN
    ALTER TABLE public.locations ADD COLUMN full_address TEXT;
  END IF;

  -- Füge lat/lon Spalten hinzu (falls nicht vorhanden, für einfacheren Zugriff)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'latitude') THEN
    ALTER TABLE public.locations ADD COLUMN latitude DOUBLE PRECISION;
    ALTER TABLE public.locations ADD COLUMN longitude DOUBLE PRECISION;
    
    -- Update lat/lon aus geog Spalte (falls vorhanden)
    UPDATE public.locations 
    SET latitude = ST_Y(geog::geometry),
        longitude = ST_X(geog::geometry)
    WHERE geog IS NOT NULL AND latitude IS NULL;
  END IF;
END $$;

-- 2. Erweitere postal_codes Tabelle mit Koordinaten
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postal_codes' AND column_name = 'latitude') THEN
    ALTER TABLE public.postal_codes ADD COLUMN latitude DOUBLE PRECISION;
    ALTER TABLE public.postal_codes ADD COLUMN longitude DOUBLE PRECISION;
    ALTER TABLE public.postal_codes ADD COLUMN geog GEOGRAPHY(POINT, 4326);
    
    -- Update geog aus lat/lon
    UPDATE public.postal_codes 
    SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geog IS NULL;
    
    CREATE INDEX idx_postal_codes_coords ON public.postal_codes USING GIST (geog)
    WHERE geog IS NOT NULL;
  END IF;
END $$;

-- 3. Erweitere profiles Tabelle mit Koordinaten (für Radius-Suche)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'latitude') THEN
    ALTER TABLE public.profiles ADD COLUMN latitude DOUBLE PRECISION;
    ALTER TABLE public.profiles ADD COLUMN longitude DOUBLE PRECISION;
    ALTER TABLE public.profiles ADD COLUMN geog GEOGRAPHY(POINT, 4326);
    
    -- Update geog aus lat/lon (falls vorhanden)
    UPDATE public.profiles 
    SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geog IS NULL;
    
    CREATE INDEX idx_profiles_coords ON public.profiles USING GIST (geog)
    WHERE geog IS NOT NULL;
  END IF;
END $$;

-- 4. Erweitere companies Tabelle mit Koordinaten
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'latitude') THEN
    ALTER TABLE public.companies ADD COLUMN latitude DOUBLE PRECISION;
    ALTER TABLE public.companies ADD COLUMN longitude DOUBLE PRECISION;
    ALTER TABLE public.companies ADD COLUMN geog GEOGRAPHY(POINT, 4326);
    
    -- Update geog aus lat/lon (falls vorhanden)
    UPDATE public.companies 
    SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geog IS NULL;
    
    CREATE INDEX idx_companies_coords ON public.companies USING GIST (geog)
    WHERE geog IS NOT NULL;
  END IF;
END $$;

-- 5. PostGIS sollte bereits installiert sein (wird von bestehender locations Tabelle verwendet)
-- Falls nicht, installiere es:
CREATE EXTENSION IF NOT EXISTS postgis;

-- 6. Geocoding Cache Tabelle (um API-Calls zu reduzieren)
CREATE TABLE IF NOT EXISTS public.geocoding_cache (
  id BIGSERIAL PRIMARY KEY,
  address_hash TEXT UNIQUE NOT NULL, -- Hash der Adresse (PLZ, Stadt, Straße)
  postal_code VARCHAR(10),
  city TEXT,
  street TEXT,
  country_code VARCHAR(2) DEFAULT 'DE',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  full_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_geocoding_cache_hash ON public.geocoding_cache(address_hash);

-- Füge geog Spalte für Geocoding Cache hinzu
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geocoding_cache' AND column_name = 'geog') THEN
    ALTER TABLE public.geocoding_cache ADD COLUMN geog GEOGRAPHY(POINT, 4326);
    
    -- Update geog aus lat/lon
    UPDATE public.geocoding_cache 
    SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geog IS NULL;
    
    CREATE INDEX idx_geocoding_cache_coords ON public.geocoding_cache USING GIST (geog)
    WHERE geog IS NOT NULL;
  END IF;
END $$;

-- 7. Radius-Suche Funktion (verwendet PostGIS für präzise Entfernungsberechnung)
CREATE OR REPLACE FUNCTION public.search_profiles_within_radius(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 50.0,
  p_location_id BIGINT DEFAULT NULL -- Alternative: verwende location_id statt Koordinaten
)
RETURNS TABLE (
  profile_id UUID,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_center_geog GEOGRAPHY;
BEGIN
  -- Bestimme Zentrum (entweder aus Koordinaten oder location_id)
  IF p_location_id IS NOT NULL THEN
    SELECT geog INTO v_center_geog
    FROM public.locations
    WHERE id = p_location_id;
  ELSE
    v_center_geog := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  END IF;

  IF v_center_geog IS NULL THEN
    RAISE EXCEPTION 'Invalid center location';
  END IF;

  -- Suche Profile innerhalb des Radius (verwendet PostGIS ST_DWithin)
  RETURN QUERY
  SELECT 
    p.id AS profile_id,
    ST_Distance(lp.geog, v_center_geog) / 1000.0 AS distance_km
  FROM public.profiles p
  JOIN public.locations lp ON lp.id = p.location_id
  WHERE p.location_id IS NOT NULL
    AND lp.geog IS NOT NULL
    AND p.profile_published = true
    AND ST_DWithin(lp.geog, v_center_geog, p_radius_km * 1000.0)
  ORDER BY distance_km;
END;
$$;

-- Alternative: Radius-Suche mit direkten Koordinaten (falls profiles keine location_id haben)
CREATE OR REPLACE FUNCTION public.search_profiles_within_radius_by_coords(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 50.0
)
RETURNS TABLE (
  profile_id UUID,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_center_geog GEOGRAPHY;
BEGIN
  v_center_geog := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

  -- Suche Profile mit eigenen Koordinaten
  RETURN QUERY
  SELECT 
    p.id AS profile_id,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
      v_center_geog
    ) / 1000.0 AS distance_km
  FROM public.profiles p
  WHERE p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND p.profile_published = true
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
      v_center_geog,
      p_radius_km * 1000.0
    )
  ORDER BY distance_km;
END;
$$;

-- 8. Funktion: Finde Koordinaten für PLZ/Stadt (nutzt bestehende locations Tabelle mit PostGIS)
CREATE OR REPLACE FUNCTION public.get_location_coordinates(
  p_postal_code VARCHAR(10) DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_street TEXT DEFAULT NULL,
  p_country_code VARCHAR(2) DEFAULT 'DE'
)
RETURNS TABLE (
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  full_address TEXT,
  location_id BIGINT,
  source TEXT -- 'cache', 'postal_codes', 'locations'
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_address_hash TEXT;
  v_cached RECORD;
  v_postal RECORD;
  v_location RECORD;
BEGIN
  -- Erstelle Hash für Cache-Lookup
  v_address_hash := md5(
    COALESCE(p_postal_code, '') || '|' || 
    COALESCE(LOWER(p_city), '') || '|' || 
    COALESCE(LOWER(p_street), '') || '|' || 
    COALESCE(p_country_code, 'DE')
  );

  -- 1. Prüfe Cache
  SELECT latitude, longitude, full_address INTO v_cached
  FROM public.geocoding_cache
  WHERE address_hash = v_address_hash
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT v_cached.latitude, v_cached.longitude, v_cached.full_address, NULL::BIGINT, 'cache'::TEXT;
    RETURN;
  END IF;

  -- 2. Prüfe postal_codes Tabelle
  IF p_postal_code IS NOT NULL THEN
    SELECT latitude, longitude INTO v_postal
    FROM public.postal_codes
    WHERE plz = p_postal_code
    LIMIT 1;

    IF FOUND AND v_postal.latitude IS NOT NULL THEN
      RETURN QUERY SELECT v_postal.latitude, v_postal.longitude, 
        (p_postal_code || ' ' || COALESCE(p_city, ''))::TEXT, NULL::BIGINT, 'postal_codes'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 3. Prüfe locations Tabelle (mit PostGIS geog)
  IF p_postal_code IS NOT NULL AND p_city IS NOT NULL THEN
    SELECT 
      ST_Y(geog::geometry) AS lat,
      ST_X(geog::geometry) AS lon,
      full_address,
      id
    INTO v_location
    FROM public.locations
    WHERE postal_code = p_postal_code
      AND LOWER(city) = LOWER(p_city)
      AND country_code = p_country_code
      AND geog IS NOT NULL
    LIMIT 1;

    IF FOUND THEN
      RETURN QUERY SELECT 
        v_location.lat, 
        v_location.lon, 
        COALESCE(v_location.full_address, (p_postal_code || ' ' || p_city))::TEXT,
        v_location.id,
        'locations'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 4. Keine Koordinaten gefunden - muss via Geocoding API geholt werden
  RETURN QUERY SELECT NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::TEXT, NULL::BIGINT, 'not_found'::TEXT;
END;
$$;

-- 9. Funktion: Cache Geocoding-Ergebnis
CREATE OR REPLACE FUNCTION public.cache_geocoding_result(
  p_postal_code VARCHAR(10),
  p_city TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_street TEXT DEFAULT NULL,
  p_country_code VARCHAR(2) DEFAULT 'DE',
  p_full_address TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_address_hash TEXT;
  v_id BIGINT;
BEGIN
  v_address_hash := md5(
    COALESCE(p_postal_code, '') || '|' || 
    COALESCE(LOWER(p_city), '') || '|' || 
    COALESCE(LOWER(p_street), '') || '|' || 
    COALESCE(p_country_code, 'DE')
  );

  INSERT INTO public.geocoding_cache (
    address_hash, postal_code, city, street, country_code,
    latitude, longitude, full_address
  )
  VALUES (
    v_address_hash, p_postal_code, p_city, p_street, p_country_code,
    p_latitude, p_longitude, p_full_address
  )
  ON CONFLICT (address_hash) 
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    full_address = EXCLUDED.full_address,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 10. RLS Policies
ALTER TABLE public.geocoding_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Geocoding cache is readable by authenticated users" 
  ON public.geocoding_cache FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Geocoding cache is writable by service role" 
  ON public.geocoding_cache FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Kommentare
COMMENT ON FUNCTION public.search_profiles_within_radius IS 'Sucht Profile innerhalb eines Radius (km) um gegebene Koordinaten oder location_id. Verwendet PostGIS für präzise Entfernungsberechnung.';
COMMENT ON FUNCTION public.search_profiles_within_radius_by_coords IS 'Sucht Profile mit eigenen Koordinaten innerhalb eines Radius. Fallback wenn profiles keine location_id haben.';
COMMENT ON FUNCTION public.get_location_coordinates IS 'Findet Koordinaten für PLZ/Stadt/Straße. Prüft Cache, postal_codes und locations Tabellen.';
COMMENT ON FUNCTION public.cache_geocoding_result IS 'Speichert Geocoding-Ergebnisse im Cache für spätere Verwendung.';

