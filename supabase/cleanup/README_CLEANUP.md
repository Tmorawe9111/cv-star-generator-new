# Cleanup Scripts - Alle Posts und Profile löschen

## ⚠️ WICHTIG: Diese Scripts löschen ALLE Daten!

Diese Scripts sind für Entwicklungs-/Testzwecke gedacht. **NICHT in Produktion verwenden!**

## So führen Sie die Scripts in Supabase aus:

### Option 1: Über Supabase Dashboard (Empfohlen)

1. **Öffnen Sie das Supabase Dashboard**
   - Gehen Sie zu: https://supabase.com/dashboard
   - Wählen Sie Ihr Projekt aus

2. **Navigieren Sie zum SQL Editor**
   - Klicken Sie auf "SQL Editor" im linken Menü
   - Klicken Sie auf "New query"

3. **Führen Sie das Script aus**
   - Kopieren Sie den Inhalt von `delete_all_posts_and_profiles.sql`
   - Fügen Sie ihn in den SQL Editor ein
   - Klicken Sie auf "Run" (oder drücken Sie Cmd/Ctrl + Enter)

### Option 2: Schritt für Schritt (Sicherer)

Wenn Sie Probleme mit Foreign Key Constraints haben, führen Sie diese Befehle nacheinander aus:

#### Schritt 1: Alle Posts löschen
```sql
DELETE FROM public.posts;
```

#### Schritt 2: Alle Profile löschen
```sql
DELETE FROM public.profiles;
```

### Option 3: Mit CASCADE (Löscht auch abhängige Daten)

Wenn Sie sicher sind, dass Sie ALLES löschen wollen:

```sql
-- Alle Posts und abhängige Daten löschen
DELETE FROM public.posts CASCADE;

-- Alle Profile und abhängige Daten löschen
DELETE FROM public.profiles CASCADE;
```

## Fehlerbehebung

### Fehler: "table has no primary keys"

Dieser Fehler tritt auf, wenn:
1. Die Tabelle tatsächlich keinen Primary Key hat
2. Oder Supabase die Struktur nicht richtig erkannt hat

**Lösung:**
1. Prüfen Sie die Tabellenstruktur im Supabase Dashboard:
   - Gehen Sie zu "Table Editor"
   - Wählen Sie die Tabelle `posts` oder `profiles`
   - Prüfen Sie, ob ein `id` Feld als Primary Key markiert ist

2. Falls kein Primary Key existiert, fügen Sie einen hinzu:
```sql
-- Für posts Tabelle
ALTER TABLE public.posts 
ADD CONSTRAINT posts_pkey PRIMARY KEY (id);

-- Für profiles Tabelle
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
```

### Fehler: Foreign Key Constraint

Wenn Sie Foreign Key Fehler erhalten, löschen Sie zuerst die abhängigen Daten:

```sql
-- 1. Lösche alle Likes
DELETE FROM public.post_likes;

-- 2. Lösche alle Comments
DELETE FROM public.post_comments;

-- 3. Lösche alle Reposts
DELETE FROM public.post_reposts;

-- 4. Lösche alle Posts
DELETE FROM public.posts;

-- 5. Lösche alle Profile
DELETE FROM public.profiles;
```

## Alternative: Nur Daten bis heute löschen

Wenn Sie nur alte Daten löschen wollen (nicht alles):

```sql
-- Lösche alle Posts von heute
DELETE FROM public.posts 
WHERE DATE(created_at) = CURRENT_DATE;

-- Lösche alle Profile von heute
DELETE FROM public.profiles 
WHERE DATE(created_at) = CURRENT_DATE;
```

## Prüfen vor dem Löschen

Bevor Sie löschen, können Sie prüfen, wie viele Datensätze betroffen sind:

```sql
-- Anzahl Posts
SELECT COUNT(*) as total_posts FROM public.posts;

-- Anzahl Profile
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Posts pro Tag
SELECT DATE(created_at) as date, COUNT(*) as count 
FROM public.posts 
GROUP BY DATE(created_at) 
ORDER BY date DESC;

-- Profile pro Tag
SELECT DATE(created_at) as date, COUNT(*) as count 
FROM public.profiles 
GROUP BY DATE(created_at) 
ORDER BY date DESC;
```

