-- Add new columns to job_posts table
ALTER TABLE job_posts
ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS required_languages jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tasks_md text,
ADD COLUMN IF NOT EXISTS requirements_md text,
ADD COLUMN IF NOT EXISTS benefits_description text,
ADD COLUMN IF NOT EXISTS work_mode text CHECK (work_mode IN ('remote', 'hybrid', 'onsite')),
ADD COLUMN IF NOT EXISTS working_hours text;

-- Create function to suggest jobs for a user
CREATE OR REPLACE FUNCTION suggest_jobs(p_viewer uuid, p_limit int DEFAULT 3)
RETURNS TABLE (
  id uuid,
  title text,
  company_name text,
  city text,
  employment_type text,
  salary_min integer,
  salary_max integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jp.id,
    jp.title,
    c.name as company_name,
    jp.city,
    jp.employment_type,
    jp.salary_min,
    jp.salary_max
  FROM job_posts jp
  JOIN companies c ON c.id = jp.company_id
  WHERE jp.is_active = true
    AND jp.is_public = true
    AND jp.status = 'published'
    AND jp.id NOT IN (
      -- Exclude jobs already applied to
      SELECT job_id FROM applications WHERE candidate_id = p_viewer
    )
  ORDER BY jp.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;