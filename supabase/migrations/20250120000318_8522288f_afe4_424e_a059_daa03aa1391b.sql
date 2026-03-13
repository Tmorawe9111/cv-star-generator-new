-- Drop the incorrect function
DROP FUNCTION IF EXISTS get_candidates_for_job(UUID, JSONB);

-- Recreate with correct table structure
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id as candidate_id,
    cc.candidate_id as profile_id,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.vorname
      ELSE LEFT(p.vorname, 1) || '.'
    END as first_name,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.nachname
      ELSE '***'
    END as last_name,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.email
      ELSE NULL
    END as email,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.telefon
      ELSE NULL
    END as phone,
    p.ort as city,
    CASE 
      WHEN cc.unlocked_at IS NOT NULL THEN p.avatar_url
      ELSE NULL
    END as avatar_url,
    p.faehigkeiten as skills,
    COALESCE(cc.stage, 'new') as stage,
    COALESCE(cc.match_score, 0) as match_score,
    (cc.unlocked_at IS NOT NULL) as is_unlocked,
    cc.unlocked_at,
    cc.created_at as applied_at
  FROM company_candidates cc
  JOIN profiles p ON cc.candidate_id = p.id
  WHERE cc.linked_job_ids @> jsonb_build_array(p_job_id)
  ORDER BY cc.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_candidates_for_job(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidates_for_job(UUID, JSONB) TO anon;

-- Insert test candidates for the job
INSERT INTO company_candidates (
  company_id,
  candidate_id,
  stage,
  linked_job_ids,
  source,
  unlock_type,
  created_at,
  updated_at
)
SELECT 
  '61bc0117-9d3b-4e18-bfd2-7769146384c1'::uuid,
  p.id,
  'neu',
  '["5c973cab-eba2-419c-95cf-bf9ff87e593b"]'::jsonb,
  'bewerbung',
  NULL,
  NOW(),
  NOW()
FROM profiles p
WHERE p.profile_published = true
AND NOT EXISTS (
  SELECT 1 FROM company_candidates cc2
  WHERE cc2.candidate_id = p.id 
  AND cc2.company_id = '61bc0117-9d3b-4e18-bfd2-7769146384c1'
  AND cc2.linked_job_ids @> '["5c973cab-eba2-419c-95cf-bf9ff87e593b"]'::jsonb
)
LIMIT 5;