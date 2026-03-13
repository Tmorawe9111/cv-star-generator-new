-- Erstelle job_saves Tabelle
CREATE TABLE IF NOT EXISTS job_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE job_saves ENABLE ROW LEVEL SECURITY;

-- RLS Policies für job_saves
CREATE POLICY "Users can manage their own saves"
  ON job_saves FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);