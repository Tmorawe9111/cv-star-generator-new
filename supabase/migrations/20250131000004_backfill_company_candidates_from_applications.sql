-- Backfill company_candidates for existing applications that don't have a corresponding entry
-- This ensures existing new applications also appear in the dashboard

INSERT INTO company_candidates (
  company_id,
  candidate_id,
  source,
  unlock_type,
  stage,
  status,
  linked_job_ids,
  created_at,
  updated_at
)
SELECT DISTINCT
  a.company_id,
  COALESCE(c.user_id, a.candidate_id) AS profile_id,
  'bewerbung' AS source,
  NULL AS unlock_type,
  'new' AS stage,
  'FREIGESCHALTET'::candidate_status AS status,
  CASE WHEN a.job_id IS NOT NULL THEN jsonb_build_array(a.job_id::text) ELSE '[]'::jsonb END AS linked_job_ids,
  a.created_at,
  a.updated_at
FROM applications a
LEFT JOIN candidates c ON c.id = a.candidate_id
WHERE a.status = 'new'::application_status
  AND a.source = 'applied'::application_source
  AND COALESCE(c.user_id, a.candidate_id) IS NOT NULL
  AND EXISTS (SELECT 1 FROM profiles WHERE id = COALESCE(c.user_id, a.candidate_id))
  AND NOT EXISTS (
    SELECT 1 
    FROM company_candidates cc 
    WHERE cc.company_id = a.company_id 
      AND cc.candidate_id = COALESCE(c.user_id, a.candidate_id)
  )
ON CONFLICT DO NOTHING;

