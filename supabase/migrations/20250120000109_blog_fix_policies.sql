-- =====================================================
-- BLOG POLICIES FIX - Idempotent
-- Stellt sicher, dass alle Policies korrekt existieren
-- =====================================================

-- Stelle sicher, dass die Tabelle existiert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'blog_posts'
  ) THEN
    RAISE EXCEPTION 'Table blog_posts does not exist. Please run migration 20250229000001_blog_system_seo.sql first.';
  END IF;
END $$;

-- RLS aktivieren (idempotent)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policies nur erstellen, wenn sie nicht existieren
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

  -- Policy für INSERT (nur wenn keine Admin-Policy existiert)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Admins can create posts'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Authenticated can create posts'
  ) THEN
    CREATE POLICY "Authenticated can create posts" ON public.blog_posts
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  -- Policy für UPDATE (nur wenn keine Admin-Policy existiert)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Admins can update posts'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Authors can update own posts'
  ) THEN
    CREATE POLICY "Authors can update own posts" ON public.blog_posts
      FOR UPDATE USING (auth.uid() = author_id);
  END IF;

  -- Policy für DELETE (nur wenn keine Admin-Policy existiert)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Admins can delete posts'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_posts' 
    AND policyname = 'Authors can delete own posts'
  ) THEN
    CREATE POLICY "Authors can delete own posts" ON public.blog_posts
      FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;

-- Grants (idempotent - können mehrfach ausgeführt werden)
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;

