-- Function to get profile data for applications, bypassing visibility restrictions
-- This ensures that companies can see profile data for candidates who actively applied,
-- even if the candidate has set their profile to invisible

CREATE OR REPLACE FUNCTION get_profiles_for_applications(
  p_company_id UUID,
  p_profile_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  vorname TEXT,
  nachname TEXT,
  ort TEXT,
  branche TEXT,
  headline TEXT,
  job_search_preferences JSONB,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Return profile data for applications, even if profile is invisible
  -- This is safe because the user actively applied to the company's job
  RETURN QUERY
  SELECT 
    p.id,
    p.vorname,
    p.nachname,
    p.ort,
    p.branche,
    p.headline,
    p.job_search_preferences,
    p.avatar_url
  FROM profiles p
  WHERE p.id = ANY(p_profile_ids)
    -- Only return profiles that have an application to this company
    -- We check for any application, not just 'new' status, since the user actively applied
    AND EXISTS (
      SELECT 1
      FROM applications a
      WHERE a.candidate_id = p.id
        AND a.company_id = p_company_id
    )
    -- Ensure profile is published (basic safety check)
    AND p.profile_published = true;
END;
$function$;

-- Function to get full profile data for a single application
-- This returns all profile columns, bypassing visibility restrictions for applications
CREATE OR REPLACE FUNCTION get_full_profile_for_application(
  p_company_id UUID,
  p_profile_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  vorname TEXT,
  nachname TEXT,
  email TEXT,
  telefon TEXT,
  ort TEXT,
  plz TEXT,
  strasse TEXT,
  hausnummer TEXT,
  branche TEXT,
  headline TEXT,
  job_search_preferences JSONB,
  avatar_url TEXT,
  faehigkeiten JSONB,
  berufserfahrung JSONB,
  schulbildung JSONB,
  sprachkenntnisse JSONB,
  sprachen TEXT[],
  languages TEXT[],
  uebermich TEXT,
  profile_published BOOLEAN,
  visibility_mode TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Return full profile data for applications, even if profile is invisible
  -- This is safe because the user actively applied to the company's job
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.vorname,
    p.nachname,
    p.email,
    p.telefon,
    p.ort,
    p.plz,
    p.strasse,
    p.hausnummer,
    p.branche,
    p.headline,
    p.job_search_preferences,
    p.avatar_url,
    p.faehigkeiten,
    p.berufserfahrung,
    p.schulbildung,
    p.sprachkenntnisse,
    p.sprachen,
    p.languages,
    p.uebermich,
    p.profile_published,
    p.visibility_mode,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = p_profile_id
    -- Only return profiles that have an application to this company
    -- We check for any application, not just 'new' status, since the user actively applied
    AND EXISTS (
      SELECT 1
      FROM applications a
      WHERE a.candidate_id = p.id
        AND a.company_id = p_company_id
    )
    -- Ensure profile is published (basic safety check)
    AND p.profile_published = true;
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_profiles_for_applications(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_full_profile_for_application(UUID, UUID) TO authenticated;

