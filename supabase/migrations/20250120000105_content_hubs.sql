-- =====================================================
-- CONTENT HUBS FÜR BRANCHEN-LANDING PAGES
-- Komplett neue Tabelle
-- =====================================================

CREATE TABLE IF NOT EXISTS public.content_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  industry_sector TEXT NOT NULL CHECK (industry_sector IN ('pflege', 'handwerk', 'industrie')),
  target_audience TEXT CHECK (target_audience IN ('schueler', 'azubi', 'profi', 'unternehmen')),
  meta_title TEXT,
  meta_description TEXT,
  content TEXT,
  featured_image TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_hubs_sector_audience ON public.content_hubs(industry_sector, target_audience);
CREATE INDEX IF NOT EXISTS idx_content_hubs_slug ON public.content_hubs(slug);
CREATE INDEX IF NOT EXISTS idx_content_hubs_industry ON public.content_hubs(industry_sector);

-- RLS
ALTER TABLE public.content_hubs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view content hubs" ON public.content_hubs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage content hubs" ON public.content_hubs
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant
GRANT SELECT ON public.content_hubs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_hubs TO authenticated;

-- Kommentare
COMMENT ON TABLE public.content_hubs IS 'Content-Hubs für Branchen-Landing Pages (z.B. /karriere/pflege)';
COMMENT ON COLUMN public.content_hubs.slug IS 'URL-Slug (z.B. pflege, handwerk, industrie)';
COMMENT ON COLUMN public.content_hubs.industry_sector IS 'Branche: pflege, handwerk, industrie';
COMMENT ON COLUMN public.content_hubs.target_audience IS 'Zielgruppe: schueler, azubi, profi, unternehmen (optional für Haupt-Hub)';

