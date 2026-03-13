-- Create bulk stage update function
CREATE OR REPLACE FUNCTION bulk_stage_update(
  p_company_id uuid,
  p_profile_ids uuid[],
  p_stage text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update existing pipeline entries
  UPDATE company_candidates 
  SET 
    stage = p_stage,
    updated_at = now(),
    last_touched_at = now()
  WHERE company_id = p_company_id
    AND candidate_id = ANY(p_profile_ids);
    
  -- Insert new pipeline entries for profiles that don't exist yet
  INSERT INTO company_candidates (company_id, candidate_id, stage, created_at, updated_at, last_touched_at)
  SELECT 
    p_company_id,
    unnest(p_profile_ids),
    p_stage,
    now(),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM company_candidates 
    WHERE company_id = p_company_id 
    AND candidate_id = ANY(p_profile_ids)
  );
END;
$$;

-- Create exports storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for exports bucket
CREATE POLICY "Company members can access exports" ON storage.objects
FOR ALL 
USING (bucket_id = 'exports' AND auth.uid() IS NOT NULL);