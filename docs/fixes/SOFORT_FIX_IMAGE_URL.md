# SOFORT-FIX: image_url Spalte hinzufügen

## Führen Sie diesen Code JETZT im Supabase Dashboard SQL Editor aus:

```sql
-- Spalte hinzufügen zur posts Tabelle
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Bestätigung
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;
```

## Nach dem Ausführen sollten Sie sehen:
- id
- content  
- user_id
- created_at
- updated_at
- **image_url** ✅

## Dann Cache löschen:

```javascript
// In Browser Console ausführen:
localStorage.clear();
location.reload();
```

**Führen Sie das SQL JETZT aus, dann sollte es funktionieren!** 🚀
