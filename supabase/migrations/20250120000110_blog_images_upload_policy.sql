-- =====================================================
-- BLOG IMAGES UPLOAD POLICY
-- Erlaubt allen authentifizierten Benutzern, Bilder hochzuladen
-- =====================================================

-- Policy für alle authentifizierten Benutzer zum Hochladen von Bildern
DO $$ 
BEGIN
  -- Prüfe ob Policy bereits existiert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload blog images'
  ) THEN
    CREATE POLICY "Authenticated users can upload blog images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'blog-images'
    );
  END IF;
END $$;

-- Kommentar
COMMENT ON POLICY "Authenticated users can upload blog images" ON storage.objects IS 
'Erlaubt allen authentifizierten Benutzern, Bilder in den blog-images Bucket hochzuladen';

