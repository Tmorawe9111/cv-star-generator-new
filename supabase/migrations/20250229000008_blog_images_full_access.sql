-- =====================================================
-- BLOG IMAGES FULL ACCESS FOR AUTHENTICATED USERS
-- Erlaubt allen authentifizierten Benutzern, Bilder zu verwalten
-- =====================================================

-- Entferne die alte restriktive Policy (falls vorhanden)
DO $$ 
BEGIN
  -- Lösche die alte Policy, die nur Content Editors erlaubt
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Editors can manage blog images'
  ) THEN
    DROP POLICY "Editors can manage blog images" ON storage.objects;
  END IF;
END $$;

-- Policy für INSERT (Upload) - alle authentifizierten Benutzer
-- Diese Policy erlaubt ALLEN authentifizierten Benutzern das Hochladen
DO $$ 
BEGIN
  -- Entferne alte Policy falls vorhanden
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload blog images'
  ) THEN
    DROP POLICY "Authenticated users can upload blog images" ON storage.objects;
  END IF;
  
  -- Erstelle neue Policy
  CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
  );
END $$;

-- Policy für UPDATE - Benutzer können ihre eigenen Bilder aktualisieren
-- Prüft ob der Pfad mit der User-ID beginnt (z.B. "user-id/filename.jpg")
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own blog images'
  ) THEN
    DROP POLICY "Users can update their own blog images" ON storage.objects;
  END IF;
  
  CREATE POLICY "Users can update their own blog images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'blog-images'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  );
END $$;

-- Policy für DELETE - Benutzer können ihre eigenen Bilder löschen
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own blog images'
  ) THEN
    DROP POLICY "Users can delete their own blog images" ON storage.objects;
  END IF;
  
  CREATE POLICY "Users can delete their own blog images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  );
END $$;

-- Kommentare
COMMENT ON POLICY "Authenticated users can upload blog images" ON storage.objects IS 
'Erlaubt allen authentifizierten Benutzern, Bilder in den blog-images Bucket hochzuladen';

COMMENT ON POLICY "Users can update their own blog images" ON storage.objects IS 
'Erlaubt Benutzern, ihre eigenen Bilder im blog-images Bucket zu aktualisieren (basierend auf User-ID im Pfad)';

COMMENT ON POLICY "Users can delete their own blog images" ON storage.objects IS 
'Erlaubt Benutzern, ihre eigenen Bilder im blog-images Bucket zu löschen (basierend auf User-ID im Pfad)';

