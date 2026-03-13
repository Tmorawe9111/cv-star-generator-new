-- SCHRITT 1: Tabelle erweitern und RLS Policies setzen
-- Führen Sie diesen Code im Supabase Dashboard SQL Editor aus

-- 1. Tabelle erweitern (falls Spalten fehlen)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. RLS Policies erstellen
-- Lesen für alle (öffentlicher Feed)
DROP POLICY IF EXISTS "read posts" ON posts;
CREATE POLICY "read posts" ON posts
FOR SELECT USING (true);

-- Schreiben: nur eingeloggte Nutzer dürfen eigene Posts erstellen
DROP POLICY IF EXISTS "insert own posts" ON posts;
CREATE POLICY "insert own posts" ON posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Bestätigung
SELECT 'SQL erfolgreich ausgeführt!' as status;
