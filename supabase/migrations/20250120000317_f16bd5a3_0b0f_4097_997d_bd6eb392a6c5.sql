-- Drop the broken function
DROP FUNCTION IF EXISTS get_candidates_for_job(UUID, JSONB);

-- Recreate the function with the correct table structure
CREATE OR REPLACE FUNCTION get_candidates_for_job(
  p_job_id UUID,
  p_filters JSONB DEFAULT NULL
)
RETURNS TABLE (
  candidate_id UUID,
  profile_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  skills JSONB,
  stage TEXT,
  match_score INTEGER,
  is_unlocked BOOLEAN,
  unlocked_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id as candidate_id,
    cc.profile_id,
    CASE 
      WHEN cc.basic_unlocked THEN p.vorname
      ELSE LEFT(p.vorname, 1) || '.'
    END as first_name,
    CASE 
      WHEN cc.basic_unlocked THEN p.nachname
      ELSE '***'
    END as last_name,
    CASE 
      WHEN cc.contact_unlocked THEN p.email
      ELSE NULL
    END as email,
    CASE 
      WHEN cc.contact_unlocked THEN p.telefon
      ELSE NULL
    END as phone,
    p.ort as city,
    CASE 
      WHEN cc.basic_unlocked THEN p.avatar_url
      ELSE NULL
    END as avatar_url,
    p.faehigkeiten as skills,
    COALESCE(cc.stage, 'new') as stage,
    COALESCE(cc.match_score, 0) as match_score,
    cc.basic_unlocked as is_unlocked,
    cc.basic_unlocked_at as unlocked_at,
    cc.created_at as applied_at
  FROM company_candidates cc
  JOIN profiles p ON cc.profile_id = p.id
  WHERE cc.job_post_id = p_job_id
  ORDER BY cc.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_candidates_for_job(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidates_for_job(UUID, JSONB) TO anon;