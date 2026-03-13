-- Migration: Sync missing candidates from candidates table to profiles table
-- This fixes the FK constraint violation "fk_company_candidates_profile"
-- IMPORTANT: profiles.id = user_id (auth.users), NOT candidate.id

WITH ranked_candidates AS (
  SELECT 
    c.*,
    ROW_NUMBER() OVER (PARTITION BY c.user_id ORDER BY c.created_at DESC) as rn
  FROM candidates c
  WHERE c.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = c.user_id)
)
INSERT INTO profiles (
  id,  -- This is the user_id, not candidate_id!
  vorname, 
  nachname, 
  email,
  telefon,
  ort,
  avatar_url,
  status,
  branche,
  created_at,
  updated_at,
  full_name
)
SELECT 
  c.user_id as id,  -- Use user_id as profiles.id
  c.vorname,
  c.nachname,
  c.email,
  c.phone as telefon,
  c.city as ort,
  c.profile_image as avatar_url,
  CASE 
    WHEN c.availability_status = 'available' THEN 'arbeitssuchend'
    WHEN c.availability_status IN ('schueler', 'azubi', 'fachkraft', 'student', 'absolvent', 'berufstaetig', 'arbeitssuchend', 'ausgelernt') 
      THEN c.availability_status
    ELSE 'arbeitssuchend'
  END as status,
  CASE
    WHEN LOWER(c.industry) LIKE '%handwerk%' THEN 'handwerk'
    WHEN LOWER(c.industry) LIKE '%it%' THEN 'it'
    WHEN LOWER(c.industry) LIKE '%gesundheit%' THEN 'gesundheit'
    WHEN LOWER(c.industry) LIKE '%büro%' OR LOWER(c.industry) LIKE '%office%' THEN 'buero'
    WHEN LOWER(c.industry) LIKE '%verkauf%' THEN 'verkauf'
    WHEN LOWER(c.industry) LIKE '%gastronomie%' THEN 'gastronomie'
    WHEN LOWER(c.industry) LIKE '%bau%' THEN 'bau'
    ELSE 'handwerk'
  END as branche,
  c.created_at,
  NOW() as updated_at,
  c.full_name
FROM ranked_candidates c
WHERE c.rn = 1  -- Only take the most recent candidate per user
ON CONFLICT (id) DO NOTHING;