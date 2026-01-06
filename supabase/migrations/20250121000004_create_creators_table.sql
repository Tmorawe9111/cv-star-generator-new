-- Create creators table for managing Instagram/Facebook creator links
CREATE TABLE IF NOT EXISTS public.creators (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Creator information
  code text NOT NULL UNIQUE, -- Unique code (e.g., 'nakam')
  name text NOT NULL, -- Creator name (e.g., 'Nakam')
  
  -- Platform configuration
  platform text NOT NULL DEFAULT 'instagram', -- 'instagram', 'facebook', 'both'
  
  -- Tracking configuration
  utm_campaign text, -- Optional UTM campaign (e.g., 'january2024')
  
  -- Redirect configuration
  redirect_to text NOT NULL DEFAULT 'cv-generator', -- 'cv-generator' or 'gesundheitswesen'
  
  -- Metadata
  is_active boolean DEFAULT true NOT NULL,
  notes text -- Optional notes about the creator
);

-- Indexes for fast queries
CREATE INDEX idx_creators_code ON public.creators(code);
CREATE INDEX idx_creators_platform ON public.creators(platform);
CREATE INDEX idx_creators_is_active ON public.creators(is_active);

-- Enable RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read active creators
CREATE POLICY "Allow authenticated users to read active creators"
ON public.creators FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Allow admins to perform all operations
CREATE POLICY "Allow admins full access to creators"
ON public.creators FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_creators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW
  EXECUTE FUNCTION update_creators_updated_at();

-- Comments
COMMENT ON TABLE public.creators IS 'Manages Instagram and Facebook creator links for social media tracking';
COMMENT ON COLUMN public.creators.code IS 'Unique code used in URLs (e.g., bevisiblle.de/ig?c=nakam)';
COMMENT ON COLUMN public.creators.platform IS 'Platform: instagram, facebook, or both';
COMMENT ON COLUMN public.creators.redirect_to IS 'Where to redirect: cv-generator or gesundheitswesen';

