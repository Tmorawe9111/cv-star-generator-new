-- =====================================================
-- BLOG SYSTEM FÜR SEO CONTENT
-- Komplett neue Tabelle, keine Änderungen an bestehenden
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  
  -- SEO-Felder
  industry_sector TEXT CHECK (industry_sector IN ('pflege', 'handwerk', 'industrie', 'allgemein')),
  target_audience TEXT CHECK (target_audience IN ('schueler', 'azubi', 'profi', 'unternehmen')),
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  
  -- Content
  featured_image TEXT,
  category TEXT,
  tags TEXT[],
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_blog_sector_audience ON public.blog_posts(industry_sector, target_audience);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blog_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_category ON public.blog_posts(category) WHERE category IS NOT NULL;

-- RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policies (nur erstellen, wenn sie nicht existieren)
DO $$ 
BEGIN
  -- Policy für SELECT (öffentliche Ansicht)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Anyone can view published posts'
  ) THEN
    CREATE POLICY "Anyone can view published posts" ON public.blog_posts
      FOR SELECT USING (status = 'published');
  END IF;

  -- Policy für INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Authenticated can create posts'
  ) THEN
    CREATE POLICY "Authenticated can create posts" ON public.blog_posts
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  -- Policy für UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Authors can update own posts'
  ) THEN
    CREATE POLICY "Authors can update own posts" ON public.blog_posts
      FOR UPDATE USING (auth.uid() = author_id);
  END IF;

  -- Policy für DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Authors can delete own posts'
  ) THEN
    CREATE POLICY "Authors can delete own posts" ON public.blog_posts
      FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;

-- Grant
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;

-- Kommentare
COMMENT ON TABLE public.blog_posts IS 'Blog-Artikel für SEO-Content-Marketing';
COMMENT ON COLUMN public.blog_posts.industry_sector IS 'Branche: pflege, handwerk, industrie, allgemein';
COMMENT ON COLUMN public.blog_posts.target_audience IS 'Zielgruppe: schueler, azubi, profi, unternehmen';
COMMENT ON COLUMN public.blog_posts.slug IS 'URL-freundlicher Slug (z.B. generalistik-pflegeausbildung-2025)';

