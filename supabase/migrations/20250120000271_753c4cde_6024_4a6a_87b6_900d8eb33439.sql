-- CV Creation Sessions Table für alle 3 Flows (Classic, Voice, Chat)
CREATE TABLE IF NOT EXISTS cv_creation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_type TEXT NOT NULL CHECK (flow_type IN ('classic', 'voice', 'chat')),
  
  -- Voice-Flow Daten
  audio_url TEXT,
  transcript TEXT,
  normalized_text TEXT,
  original_language TEXT,
  
  -- Chat-Flow Daten
  chat_messages JSONB DEFAULT '[]'::jsonb,
  
  -- Gemeinsame Daten
  extracted_data JSONB,
  confidence_scores JSONB,
  auto_enhancements JSONB,
  selected_layout INTEGER,
  profile_image_url TEXT,
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_to_completion_seconds INTEGER,
  
  -- Conversion Tracking
  conversion_action TEXT CHECK (conversion_action IN ('paid_download', 'profile_signup', NULL)),
  payment_intent_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cv_creation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sessions"
  ON cv_creation_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON cv_creation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON cv_creation_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes für Performance
CREATE INDEX idx_cv_sessions_user_id ON cv_creation_sessions(user_id);
CREATE INDEX idx_cv_sessions_status ON cv_creation_sessions(status);
CREATE INDEX idx_cv_sessions_flow_type ON cv_creation_sessions(flow_type);
CREATE INDEX idx_cv_sessions_created_at ON cv_creation_sessions(created_at DESC);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_cv_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cv_sessions_updated_at
  BEFORE UPDATE ON cv_creation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_cv_sessions_updated_at();