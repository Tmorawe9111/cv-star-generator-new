-- =====================================================
-- SEO BRANCHES EXPANSION
-- Nur neue Spalten hinzufügen, bestehende unverändert
-- =====================================================

-- Erweitere branches Tabelle NUR mit neuen Spalten (IF NOT EXISTS)
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS seo_slug TEXT,
ADD COLUMN IF NOT EXISTS industry_sector TEXT CHECK (industry_sector IN ('pflege', 'handwerk', 'industrie', 'allgemein')),
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Update bestehende Branchen (nur wenn Spalten leer sind)
UPDATE public.branches 
SET 
  industry_sector = CASE 
    WHEN key = 'gesundheit' THEN 'pflege'
    WHEN key = 'handwerk' THEN 'handwerk'
    WHEN key IN ('it', 'bau') THEN 'industrie'
    ELSE 'allgemein'
  END,
  seo_slug = CASE key
    WHEN 'gesundheit' THEN 'pflege'
    WHEN 'handwerk' THEN 'handwerk'
    WHEN 'it' THEN 'industrie-it'
    WHEN 'bau' THEN 'industrie-bau'
    ELSE key
  END
WHERE seo_slug IS NULL; -- Nur wenn noch nicht gesetzt

-- Index für SEO-Queries
CREATE INDEX IF NOT EXISTS idx_branches_industry_sector ON public.branches(industry_sector);
CREATE INDEX IF NOT EXISTS idx_branches_seo_slug ON public.branches(seo_slug);

-- Kommentare für Dokumentation
COMMENT ON COLUMN public.branches.seo_slug IS 'SEO-optimierter Slug für URLs (z.B. pflege, handwerk)';
COMMENT ON COLUMN public.branches.industry_sector IS 'Industrie-Sektor für Content-Hubs (pflege, handwerk, industrie, allgemein)';
COMMENT ON COLUMN public.branches.seo_keywords IS 'Array von SEO-Keywords für diese Branche';
COMMENT ON COLUMN public.branches.seo_description IS 'SEO Meta-Description für Branchen-Landing Pages';

