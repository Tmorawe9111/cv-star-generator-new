# PLZs laden - Schritt-für-Schritt Anleitung

## ✅ Edge Function ist bereits deployed!

Die Function `seed-all-postal-codes` ist bereit und kann alle deutschen PLZs laden.

## 🚀 Ausführung über Supabase Dashboard (Empfohlen)

1. **Öffne das Supabase Dashboard:**
   - Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/functions

2. **Wähle die Function:**
   - Klicke auf `seed-all-postal-codes`

3. **Rufe die Function auf:**
   - Klicke auf "Invoke function" oder den "Test" Tab
   - **Body (JSON):**
     ```json
     {
       "dry_run": false,
       "batch_size": 500
     }
     ```
   - **Headers:**
     - Key: `x-seed-token`
     - Value: `e2d69ab684396bbfeac29eb6a3b333977d804b0d1e8c713122de8e79957bf688`

4. **Klicke auf "Invoke"**

5. **Warte auf das Ergebnis:**
   - Die Function lädt die CSV (ca. 8.000+ PLZs)
   - Erstellt/aktualisiert alle Einträge in `postal_codes`
   - Setzt Koordinaten für alle PLZs
   - Dauer: ca. 2-5 Minuten

## 📊 Erwartetes Ergebnis

Nach erfolgreicher Ausführung:
```json
{
  "ok": true,
  "totalInCSV": 8500,
  "totalProcessed": 8500,
  "created": 8485,
  "updated": 15,
  "skipped": 0,
  "errors": 0,
  "dry_run": false
}
```

## ✅ Überprüfung

Nach der Ausführung kannst du in Supabase prüfen:

**SQL Editor:**
```sql
-- Anzahl der PLZs
SELECT COUNT(*) FROM postal_codes;

-- PLZs mit Koordinaten
SELECT COUNT(*) FROM postal_codes 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Beispiel-PLZs
SELECT plz, ort, bundesland, latitude, longitude 
FROM postal_codes 
ORDER BY plz 
LIMIT 10;
```

## 🔄 Alternative: Dry Run (Test)

Um zu testen, ohne Änderungen vorzunehmen:
```json
{
  "dry_run": true,
  "batch_size": 100
}
```

## ⚠️ Hinweise

- Die Function lädt die CSV von: `https://raw.githubusercontent.com/WZBSocialScienceCenter/plz_geocoord/master/plz_geocoord.csv`
- Neue PLZs werden erstellt, existierende werden aktualisiert
- Die Verarbeitung kann einige Minuten dauern
- Bei Fehlern werden Details in den Logs ausgegeben

## 🎯 Nach dem Laden

Nach erfolgreichem Laden:
- ✅ Alle deutschen PLZs sind in der Datenbank
- ✅ `LocationAutocomplete` funktioniert für alle PLZs
- ✅ Radius-Suche funktioniert für alle Standorte
- ✅ Koordinaten sind für alle PLZs gesetzt


