-- =====================================================
-- BLOG RLS POLICIES FÜR ADMINS/CONTENT EDITORS
-- Erweitert die bestehenden Policies
-- =====================================================

-- Entferne alte Policies (falls vorhanden)
DROP POLICY IF EXISTS "Authenticated can create posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.blog_posts;

-- Neue Policies: Nur Admins/ContentEditors können schreiben
-- Verwendet die tatsächlichen Enum-Werte aus app_role
CREATE POLICY "Admins can create posts" ON public.blog_posts
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can update posts" ON public.blog_posts
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can delete posts" ON public.blog_posts
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'editor')
    )
  );

-- Kommentar
COMMENT ON POLICY "Admins can create posts" ON public.blog_posts IS 'Nur Admins und Content Editors können Blog-Artikel erstellen';
COMMENT ON POLICY "Admins can update posts" ON public.blog_posts IS 'Nur Admins und Content Editors können Blog-Artikel bearbeiten';
COMMENT ON POLICY "Admins can delete posts" ON public.blog_posts IS 'Nur Admins und Content Editors können Blog-Artikel löschen';

