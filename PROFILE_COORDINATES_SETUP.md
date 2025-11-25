# Profile-Koordinaten Setup

## 🎯 Ziel

1. **Alle deutschen PLZ mit Koordinaten** in die Datenbank laden
2. **Profile automatisch mit Koordinaten** versehen (basierend auf PLZ/Ort)

## 📋 Schritte

### Schritt 1: Alle PLZ mit Koordinaten laden

**Option A: Via Edge Function (empfohlen)**

```bash
# Deploy die neue Function
cd /Users/toddmorawe/cv-star-generator
supabase functions deploy seed-all-postal-codes
```

**Option B: Via Supabase Dashboard**

1. Gehe zu **Edge Functions** → **seed-all-postal-codes**
2. Klicke **Invoke**
3. Body:
```json
{
  "dry_run": false,
  "batch_size": 1000
}
```

**Option C: Via curl**

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/seed-all-postal-codes \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "x-seed-token: YOUR_SEED_TOKEN" \
  -d '{"dry_run": false, "batch_size": 1000}'
```

### Schritt 2: Migration ausführen

Führe die Migration aus, um die Update-Funktionen zu erstellen:

```sql
-- Kopiere Inhalt von:
supabase/migrations/20251112000002_update_profiles_with_coordinates.sql
```

Oder im Supabase SQL Editor ausführen.

### Schritt 3: Profile-Koordinaten aktualisieren

**Via SQL:**

```sql
-- Update alle Profile-Koordinaten
SELECT * FROM public.update_all_profile_coordinates();
```

**Via Supabase Dashboard:**

1. Gehe zu **SQL Editor**
2. Führe aus:
```sql
SELECT * FROM public.update_all_profile_coordinates();
```

**Ergebnis:**
- `total_updated`: Anzahl aktualisierter Profile
- `total_skipped`: Profile ohne passende PLZ/Ort
- `from_postal_codes`: Aktualisiert aus postal_codes
- `from_locations`: Aktualisiert aus locations

### Schritt 4: Automatisches Update (Optional)

Um zukünftige Profile automatisch mit Koordinaten zu versehen, aktiviere den Trigger:

```sql
-- Trigger aktivieren
CREATE TRIGGER trigger_update_profile_coords
  AFTER INSERT OR UPDATE OF plz, ort ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_profile_coordinates();
```

## 🔍 Prüfen

**Wie viele PLZ haben Koordinaten?**

```sql
SELECT 
  COUNT(*) as total,
  COUNT(latitude) as with_coords,
  COUNT(*) - COUNT(latitude) as without_coords
FROM postal_codes;
```

**Wie viele Profile haben Koordinaten?**

```sql
SELECT 
  COUNT(*) as total,
  COUNT(latitude) as with_coords,
  COUNT(*) - COUNT(latitude) as without_coords
FROM profiles
WHERE profile_published = true;
```

**Profile ohne Koordinaten finden:**

```sql
SELECT id, plz, ort, vorname, nachname
FROM profiles
WHERE profile_published = true
  AND (latitude IS NULL OR longitude IS NULL)
  AND plz IS NOT NULL
LIMIT 20;
```

## 📊 Datenquellen

**PLZ-Koordinaten:**
- GitHub: https://github.com/WZBSocialScienceCenter/plz_geocoord
- CSV mit ~8.000 deutschen PLZ
- Wird automatisch von `seed-all-postal-codes` geladen

**Profile-Koordinaten:**
- Werden aus `postal_codes` oder `locations` Tabellen übernommen
- Basierend auf `profiles.plz` und `profiles.ort`

## 🚀 Nächste Schritte

1. ✅ Alle PLZ laden (`seed-all-postal-codes`)
2. ✅ Migration ausführen
3. ✅ Profile-Koordinaten aktualisieren
4. ⏳ Optional: Trigger aktivieren für automatisches Update

## 🐛 Troubleshooting

**Problem: "No coordinates found for PLZ"**
- Lösung: Prüfe ob PLZ in `postal_codes` Tabelle existiert
- Lösung: Führe `seed-all-postal-codes` aus

**Problem: "Profile coordinates not updating"**
- Lösung: Prüfe ob `profiles.plz` und `profiles.ort` gesetzt sind
- Lösung: Prüfe ob entsprechende PLZ in `postal_codes` existiert

**Problem: "Function not found"**
- Lösung: Migration ausführen (`20251112000002_update_profiles_with_coordinates.sql`)

