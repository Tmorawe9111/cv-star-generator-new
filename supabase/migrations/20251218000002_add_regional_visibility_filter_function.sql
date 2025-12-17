-- Function to filter profiles by regional visibility
-- Returns profile IDs that should be visible to a company based on regional_visibility setting
-- If regional_visibility = false: profile is always visible
-- If regional_visibility = true: profile is only visible if company is within 50km
CREATE OR REPLACE FUNCTION public.filter_profiles_by_regional_visibility(
  p_company_latitude DOUBLE PRECISION,
  p_company_longitude DOUBLE PRECISION,
  p_profile_ids UUID[] DEFAULT NULL -- If provided, only check these profiles
)
RETURNS TABLE (
  profile_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_geog GEOGRAPHY;
BEGIN
  -- Create geography point for company location
  v_company_geog := ST_SetSRID(ST_MakePoint(p_company_longitude, p_company_latitude), 4326)::geography;

  RETURN QUERY
  SELECT p.id AS profile_id
  FROM public.profiles p
  WHERE p.profile_published = true
    AND p.visibility_mode = 'visible'
    AND (p_profile_ids IS NULL OR p.id = ANY(p_profile_ids))
    AND (
      -- Profile without regional visibility: always visible
      p.regional_visibility = false
      OR
      -- Profile with regional visibility: only visible if within 50km
      (
        p.regional_visibility = true
        AND p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
          v_company_geog,
          50000.0 -- 50km in meters
        )
      )
    );
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.filter_profiles_by_regional_visibility IS 'Filters profiles by regional visibility. Profiles with regional_visibility=true are only visible if company is within 50km. Users can still apply to jobs everywhere.';

