-- Create advertisements table for managing ad links
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  badge TEXT, -- e.g., "Sponsored", "Anzeige", "Neu"
  category TEXT, -- e.g., "Membership", "Event", "Feature"
  position TEXT CHECK (position IN ('left', 'right', 'both')) DEFAULT 'right',
  priority INTEGER DEFAULT 0, -- Lower number = higher priority
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  -- Targeting fields for clustering
  target_branche TEXT[], -- Array of branches (handwerk, it, gesundheit, etc.)
  target_status TEXT[], -- Array of statuses (schueler, azubi, fachkraft)
  target_regions TEXT[], -- Array of regions/cities
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for active ads
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON public.advertisements(active, position, priority);

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_advertisements_dates ON public.advertisements(start_date, end_date);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active advertisements
CREATE POLICY "Anyone can view active advertisements"
  ON public.advertisements
  FOR SELECT
  USING (active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

-- Policy: Only authenticated users with admin role can insert/update/delete
CREATE POLICY "Admins can manage advertisements"
  ON public.advertisements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_advertisements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_advertisements_updated_at();

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_ad_click_count(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.advertisements
  SET click_count = click_count + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some example advertisements (optional)
-- INSERT INTO public.advertisements (title, url, description, badge, category, position, priority) VALUES
-- ('Premium Mitgliedschaft', '/premium', 'Erhalte Zugang zu exklusiven Features', 'Anzeige', 'Membership', 'right', 1),
-- ('Karriere-Webinar', '/webinar', 'Lerne von Branchenexperten', 'Neu', 'Event', 'right', 2),
-- ('Job-Alerts aktivieren', '/jobs/alerts', 'Verpasse keine neuen Stellenangebote', 'Sponsored', 'Feature', 'right', 3);

