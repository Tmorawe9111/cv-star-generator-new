# SCHRITT 3: Storage Bucket erstellen

## Im Supabase Dashboard:

1. **Gehen Sie zu:** https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/storage/buckets

2. **Klicken Sie auf:** "New Bucket" oder "Create Bucket"

3. **Bucket konfigurieren:**
   - **Name:** `post-images`
   - **Public:** ✅ AKTIVIEREN (wichtig!)
   - **File size limit:** 50 MB
   - **Allowed MIME types:** image/jpeg, image/png, image/gif, image/webp

4. **Klicken Sie auf:** "Create Bucket"

5. **Bucket Policies (optional, falls nicht automatisch gesetzt):**
   Gehen Sie zu **Policies** und fügen Sie hinzu:
   
   ```sql
   -- Jeder kann Bilder lesen
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'post-images' );

   -- Nur authentifizierte User können hochladen
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'post-images' 
     AND auth.role() = 'authenticated'
   );
   ```

## ✅ Fertig!

Wenn der Bucket erstellt ist, können Posts mit Bildern hochgeladen werden!
