
-- 1) Performance/Qualität: Indizes
CREATE INDEX IF NOT EXISTS idx_locations_geog ON public.locations USING GIST (geog);
CREATE UNIQUE INDEX IF NOT EXISTS ux_locations_postal_city_country
  ON public.locations (postal_code, city, country_code);

-- 2) Standort-Auflösung nach PLZ/Ort
CREATE OR REPLACE FUNCTION public.resolve_location_id(
  p_postal_code text,
  p_city text,
  p_country_code text DEFAULT 'DE'
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT id
  FROM public.locations
  WHERE postal_code = p_postal_code
    AND lower(city) = lower(p_city)
    AND country_code = p_country_code
  LIMIT 1;
$function$;

-- 3) Upsert mit Koordinaten (wenn Standort nicht existiert)
CREATE OR REPLACE FUNCTION public.upsert_location_with_coords(
  p_postal_code text,
  p_city text,
  p_state text,
  p_country_code text,
  p_lat double precision,
  p_lon double precision
)
RETURNS bigint
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_id bigint;
BEGIN
  -- Versuche vorhandenen Standort zu finden (postal_code, city, country)
  SELECT id INTO v_id
  FROM public.locations
  WHERE postal_code = p_postal_code
    AND lower(city) = lower(p_city)
    AND country_code = p_country_code
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- Lege neuen Standort an
  INSERT INTO public.locations (postal_code, city, state, country_code, lat, lon, geog)
  VALUES (
    p_postal_code,
    p_city,
    NULLIF(p_state, ''),
    p_country_code,
    p_lat,
    p_lon,
    public.ST_SetSRID(public.ST_MakePoint(p_lon, p_lat), 4326)::geography
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

-- 4) Radius: nahe Locations zu einer center location_id
CREATE OR REPLACE FUNCTION public.find_locations_within_radius(
  p_center_location_id bigint,
  p_radius_km integer
)
RETURNS TABLE(location_id bigint, distance_km double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT l.id AS location_id,
         public.ST_Distance(l.geog, c.geog) / 1000.0 AS distance_km
  FROM public.locations l
  JOIN public.locations c ON c.id = p_center_location_id
  WHERE l.geog IS NOT NULL
    AND public.ST_DWithin(l.geog, c.geog, (p_radius_km::double precision * 1000.0));
$function$;

-- 5) Radius: nahe Profile (nach location_id) inkl. Distanz
-- Hinweis: Diese Funktion gibt nur IDs + Distanz; die UI kann danach Details per normalen Selects laden.
CREATE OR REPLACE FUNCTION public.find_profile_ids_within_radius(
  p_center_location_id bigint,
  p_radius_km integer
)
RETURNS TABLE(profile_id uuid, distance_km double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT p.id AS profile_id,
         public.ST_Distance(lp.geog, c.geog) / 1000.0 AS distance_km
  FROM public.profiles p
  JOIN public.locations lp ON lp.id = p.location_id
  JOIN public.locations c  ON c.id  = p_center_location_id
  WHERE p.location_id IS NOT NULL
    AND lp.geog IS NOT NULL
    AND c.geog IS NOT NULL
    AND public.ST_DWithin(lp.geog, c.geog, (p_radius_km::double precision * 1000.0));
$function$;
