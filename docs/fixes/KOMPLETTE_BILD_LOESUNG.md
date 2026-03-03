# KOMPLETTE LÖSUNG - Bilder speichern

## Problem: Post wird erstellt, aber Bild wird nicht gespeichert

## SCHRITT 1: Überprüfen & Tabelle erweitern

Führen Sie im **Supabase Dashboard SQL Editor** aus:

```sql
-- 1. Überprüfen ob Spalte existiert
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts';

-- 2. Spalte hinzufügen (falls nicht vorhanden)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. RLS temporär deaktivieren für Tests
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- 4. Testen: Manuell einen Post mit Bild einfügen
INSERT INTO posts (content, user_id, image_url)
VALUES (
  'Test mit Bild',
  (SELECT id FROM auth.users LIMIT 1),
  'https://test.com/image.jpg'
);

-- 5. Überprüfen ob es funktioniert hat
SELECT id, content, image_url FROM posts ORDER BY created_at DESC LIMIT 5;
```

**Erwartetes Ergebnis:** Sie sollten den Test-Post mit `image_url` sehen!

---

## SCHRITT 2: Storage Bucket erstellen

1. **Gehen Sie zu:** https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/storage/buckets

2. **Klicken Sie auf:** "New Bucket" oder "Create Bucket"

3. **Konfiguration:**
   - **Name:** `post-images`
   - **Public:** ✅ **MUSS aktiviert sein!**
   - **File size limit:** 50 MB
   - **Allowed MIME types:** `image/*`

4. **Klicken Sie:** "Create Bucket"

5. **Bucket Policies setzen:**

```sql
-- Im SQL Editor ausführen:

-- Policy für Upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' 
  AND auth.role() = 'authenticated'
);

-- Policy für Public Read
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'post-images' );
```

---

## SCHRITT 3: Testen mit Console Logs

1. **Öffnen Sie Browser Console** (F12)
2. **Erstellen Sie einen Post mit Bild**
3. **Schauen Sie nach diesen Logs:**

```
Uploading image to: post-images userId/timestamp-xyz.jpg
Image uploaded successfully: https://...supabase.co/storage/.../post-images/...
Saving post to DB with: { content: "...", user_id: "...", image_url: "https://..." }
Post creation result: { data: [...], error: null }
Saved post with image_url: https://...
```

**Wenn Sie einen Upload-Fehler sehen:**
- Bucket existiert nicht → Schritt 2 wiederholen
- Permission denied → Bucket ist nicht public

**Wenn image_url = null im Post:**
- Spalte fehlt → Schritt 1 wiederholen

---

## SCHRITT 4: Überprüfen Sie die Datenbank direkt

Im **Supabase Dashboard → Table Editor**:

1. Öffnen Sie die `posts` Tabelle
2. Schauen Sie sich die neuesten Posts an
3. **Überprüfen Sie:** Hat die `image_url` Spalte einen Wert?

**JA → Alles funktioniert, aber Feed zeigt Bild nicht**
**NEIN → Spalte wird nicht gespeichert**

---

## SCHNELL-TEST:

**Browser Console ausführen:**

```javascript
// Test ob Bucket existiert
const { data, error } = await supabase.storage.getBucket('post-images');
console.log('Bucket exists:', !error, data);

// Test ob Spalte existiert
const { data: post } = await supabase.from('posts').select('image_url').limit(1).single();
console.log('Column exists:', post?.hasOwnProperty('image_url'));
```

---

## ✅ WENN ALLES KLAPPT:

Sie sollten sehen:
1. ✅ Bucket `post-images` existiert
2. ✅ Spalte `image_url` in `posts` Tabelle
3. ✅ Console zeigt Upload-Erfolg
4. ✅ `image_url` ist in Datenbank gespeichert
5. ✅ Bild wird im Feed angezeigt

**Führen Sie Schritt 1 und 2 aus, dann testen Sie!** 🚀
