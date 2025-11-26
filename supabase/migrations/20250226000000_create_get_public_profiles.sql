-- Create function to get public profiles (bypasses RLS for marketplace)
CREATE OR REPLACE FUNCTION public.get_public_profiles(limit_count INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  vorname TEXT,
  nachname TEXT,
  avatar_url TEXT,
  bio TEXT,
  wunschberuf TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.vorname,
    p.nachname,
    p.avatar_url,
    p.bio,
    p.wunschberuf
  FROM profiles p
  WHERE p.vorname IS NOT NULL
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_public_profiles TO anon, authenticated;

