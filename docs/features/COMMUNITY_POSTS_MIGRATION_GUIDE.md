# Community Posts Consolidation - Migration Guide

## 🚨 WICHTIG: Migration muss über Supabase Dashboard ausgeführt werden

Die Migration `20250130000000_consolidate_community_posts.sql` muss manuell über das Supabase Dashboard ausgeführt werden.

## 📋 Schritte zur Migration:

### 1. Supabase Dashboard öffnen
- Gehen Sie zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv
- Navigieren Sie zu **SQL Editor**

### 2. Migration ausführen
- Kopieren Sie den Inhalt der Datei: `supabase/migrations/20250130000000_consolidate_community_posts.sql`
- Fügen Sie ihn in den SQL Editor ein
- Klicken Sie auf **Run** um die Migration auszuführen

### 3. Migration überprüfen
Nach der Migration sollten folgende Tabellen existieren:
- ✅ `community_posts` (konsolidierte Haupttabelle)
- ✅ `community_comments` (konsolidierte Kommentare)
- ✅ `community_likes` (konsolidierte Likes)
- ✅ `community_shares` (konsolidierte Shares)
- ✅ `posts` (View für Rückwärtskompatibilität)
- ✅ `posts_authenticated` (View für authentifizierte Benutzer)

## 🔧 Was die Migration macht:

### ✅ **Konsolidierung:**
- **Entfernt** alle konfliktierenden Post-Tabellen
- **Erstellt** eine einheitliche `community_posts` Tabelle
- **Unterstützt** sowohl User- als auch Company-Posts
- **Implementiert** vollständige RLS-Policies

### ✅ **Features:**
- **Unified Schema** für alle Post-Typen
- **Author Support** für Users und Companies
- **Media Support** mit JSONB
- **Scheduling** für geplante Posts
- **Engagement Counters** mit automatischen Triggern
- **Job Integration** für Job-Posts

### ✅ **Performance:**
- **Optimierte Indizes** für schnelle Abfragen
- **Efficient Joins** mit Author-Daten
- **Pagination Support** für große Feeds

## 🧪 Nach der Migration testen:

### 1. Community Feed testen
```bash
# Teste die neue API
curl "https://koymmvuhcxlvcuoyjnvv.supabase.co/rest/v1/community_posts?select=id,content,status&limit=5" \
  -H "apikey: YOUR_ANON_KEY"
```

### 2. Anwendung testen
- Öffnen Sie http://localhost:3000/
- Navigieren Sie zu `/community` oder `/feed`
- Überprüfen Sie, ob Posts korrekt geladen werden

### 3. Post-Erstellung testen
- Erstellen Sie einen neuen Post
- Überprüfen Sie Likes und Kommentare
- Testen Sie Company-Posts

## 🚀 Vorteile nach der Migration:

### ✅ **Keine Bugs mehr:**
- **Einheitliche Datenstruktur** verhindert Konflikte
- **Konsistente API** für alle Post-Operationen
- **Zuverlässige Counter-Updates** durch Triggern

### ✅ **Bessere Performance:**
- **Optimierte Abfragen** mit weniger Joins
- **Effiziente Indizes** für schnelle Suche
- **Reduzierte Datenbankkomplexität**

### ✅ **Einfachere Wartung:**
- **Eine Tabelle** statt mehrerer konfliktierender
- **Klare Struktur** für Entwickler
- **Bessere Dokumentation** durch einheitliches Schema

## ⚠️ Wichtige Hinweise:

1. **Backup erstellen** vor der Migration (automatisch durch die Migration)
2. **Testen** nach der Migration in der Entwicklungsumgebung
3. **Überwachen** der Anwendung nach dem Deployment
4. **Dokumentation aktualisieren** für das Team

## 📞 Support:

Bei Problemen nach der Migration:
1. Überprüfen Sie die Supabase Logs
2. Testen Sie die API-Endpunkte
3. Überprüfen Sie die RLS-Policies
4. Kontaktieren Sie das Entwicklungsteam

---

**Die Migration ist kritisch für die Stabilität der Community-Features!** 🎯
