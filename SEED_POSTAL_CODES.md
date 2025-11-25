# Alle deutschen PLZs laden

## Aktueller Status

**Aktuell:** Nur ~15 Beispiel-PLZs in der Datenbank (große Städte)  
**Deutschland hat:** ~8.000-9.000 PLZs für Orte (insgesamt ~27.000 inkl. Postfächer)

## Lösung

Die Edge Function `seed-all-postal-codes` wurde aktualisiert und kann jetzt:
- ✅ Alle PLZs aus der CSV-Quelle laden
- ✅ Neue PLZs in die Datenbank einfügen
- ✅ Koordinaten für alle PLZs setzen
- ✅ Locations-Tabelle aktualisieren

## CSV-Quelle

Die Function verwendet diese öffentliche CSV-Datei:
- **URL:** `https://raw.githubusercontent.com/WZBSocialScienceCenter/plz_geocoord/master/plz_geocoord.csv`
- **Inhalt:** Alle deutschen PLZs mit Koordinaten (lat/lon)
- **Format:** CSV mit Header `,lat,lng` und Zeilen wie `01067,51.05,13.71`

## Ausführung

### 1. Edge Function deployen

```bash
cd /Users/toddmorawe/cv-star-generator
supabase functions deploy seed-all-postal-codes
```

### 2. Secret Token setzen (optional, für Sicherheit)

```bash
supabase secrets set SEED_LOCATIONS_TOKEN=dein-sicheres-token
```

### 3. Function aufrufen

**Option A: Mit Secret Token**
```bash
curl -X POST \
  'https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/seed-all-postal-codes' \
  -H 'Content-Type: application/json' \
  -H 'x-seed-token: dein-sicheres-token' \
  -d '{"dry_run": false, "batch_size": 500}'
```

**Option B: Als Admin (mit JWT Token)**
```bash
# Zuerst ein JWT Token holen (z.B. aus Supabase Dashboard)
curl -X POST \
  'https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/seed-all-postal-codes' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer DEIN_JWT_TOKEN' \
  -d '{"dry_run": false, "batch_size": 500}'
```

### 4. Dry Run (Test ohne Änderungen)

```bash
curl -X POST \
  'https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/seed-all-postal-codes' \
  -H 'Content-Type: application/json' \
  -H 'x-seed-token: dein-sicheres-token' \
  -d '{"dry_run": true}'
```

## Parameter

- `dry_run` (boolean, default: false): Wenn `true`, werden keine Änderungen vorgenommen, nur geloggt
- `batch_size` (number, default: 500): Anzahl der PLZs pro Batch
- `url` (string, optional): Alternative CSV-URL (Standard: WZBSocialScienceCenter)

## Erwartetes Ergebnis

Nach erfolgreicher Ausführung:
- ✅ ~8.000-9.000 PLZs in `postal_codes` Tabelle
- ✅ Alle mit Koordinaten (latitude, longitude, geog)
- ✅ Einträge in `locations` Tabelle
- ✅ Response: `{"ok": true, "totalInCSV": 8500, "created": 8485, "updated": 15, ...}`

## Hinweise

- Die Function lädt die CSV einmal herunter und verarbeitet alle PLZs
- Neue PLZs werden erstellt, existierende werden aktualisiert
- Die Verarbeitung kann einige Minuten dauern (je nach Batch-Größe)
- Bei Fehlern werden Details in den Logs ausgegeben

## Überprüfung

Nach der Ausführung kannst du in Supabase prüfen:

```sql
-- Anzahl der PLZs
SELECT COUNT(*) FROM postal_codes;

-- PLZs mit Koordinaten
SELECT COUNT(*) FROM postal_codes WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Beispiel-PLZs
SELECT plz, ort, bundesland, latitude, longitude 
FROM postal_codes 
ORDER BY plz 
LIMIT 10;
```


