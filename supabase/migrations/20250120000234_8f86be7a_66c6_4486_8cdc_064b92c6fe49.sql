-- Create public profile view with live employment data
CREATE OR REPLACE VIEW profiles_public AS
SELECT
  p.id,
  p.vorname,
  p.nachname,
  p.avatar_url,
  p.headline,
  p.city,
  p.fs,
  p.seeking,
  CASE 
    WHEN p.vorname IS NOT NULL AND p.nachname IS NOT NULL 
    THEN CONCAT(p.vorname, ' ', p.nachname)
    ELSE COALESCE(p.vorname, p.nachname, 'Unknown User')
  END as full_name,
  er.company_id,
  c.name as company_name,
  c.logo_url as company_logo,
  er.status as employment_status
FROM profiles p
LEFT JOIN company_employment_requests er 
  ON er.user_id = p.id AND er.status = 'accepted'
LEFT JOIN companies c 
  ON c.id = er.company_id;

-- Grant access to the view
GRANT SELECT ON profiles_public TO anon, authenticated;

-- Create function to get company people
CREATE OR REPLACE FUNCTION company_people_public(p_company_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  vorname text,
  nachname text,
  avatar_url text,
  headline text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    CASE 
      WHEN p.vorname IS NOT NULL AND p.nachname IS NOT NULL 
      THEN CONCAT(p.vorname, ' ', p.nachname)
      ELSE COALESCE(p.vorname, p.nachname, 'Unknown User')
    END as full_name,
    p.vorname,
    p.nachname,
    p.avatar_url,
    p.headline,
    er.created_at
  FROM company_employment_requests er
  JOIN profiles p ON p.id = er.user_id
  WHERE er.company_id = p_company_id
    AND er.status = 'accepted'
  ORDER BY er.created_at DESC;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION company_people_public(uuid) TO anon, authenticated;