# ✅ Nächste Schritte nach erfolgreicher Migration

## Schritt 1: Edge Function deployen

Deploye die neue Function, um alle deutschen PLZ mit Koordinaten zu laden:

```bash
cd /Users/toddmorawe/cv-star-generator
supabase functions deploy seed-all-postal-codes
```

## Schritt 2: Alle PLZ mit Koordinaten laden

**Option A: Via Supabase Dashboard (empfohlen)**

1. Gehe zu **Supabase Dashboard** → **Edge Functions** → **seed-all-postal-codes**
2. Klicke **Invoke**
3. Body:
```json
{
  "dry_run": false,
  "batch_size": 1000
}
```
4. Klicke **Invoke Function**

**Option B: Via curl**

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/seed-all-postal-codes \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false, "batch_size": 1000}'
```

**Erwartetes Ergebnis:**
- Lädt ~8.000 deutsche PLZ mit Koordinaten
- Aktualisiert `postal_codes` Tabelle
- Erstellt/aktualisiert Einträge in `locations` Tabelle

## Schritt 3: Prüfen ob PLZ-Koordinaten geladen wurden

Im Supabase SQL Editor:

```sql
-- Prüfe wie viele PLZ jetzt Koordinaten haben
SELECT 
  COUNT(*) as total_plz,
  COUNT(latitude) as with_coords,
  COUNT(*) - COUNT(latitude) as without_coords,
  ROUND(COUNT(latitude)::numeric / COUNT(*)::numeric * 100, 2) as percentage_with_coords
FROM postal_codes;
```

**Erwartung:** Sollte ~8.000 PLZ mit Koordinaten zeigen (je nachdem wie viele in deiner DB sind)

## Schritt 4: Profile-Koordinaten aktualisieren

Im Supabase SQL Editor:

```sql
-- Update alle Profile mit Koordinaten
SELECT * FROM public.update_all_profile_coordinates();
```

**Ergebnis zeigt:**
- `total_updated`: Anzahl aktualisierter Profile
- `total_skipped`: Profile ohne passende PLZ/Ort
- `from_postal_codes`: Aktualisiert aus postal_codes
- `from_locations`: Aktualisiert aus locations

## Schritt 5: Prüfen ob Profile-Koordinaten aktualisiert wurden

```sql
-- Prüfe wie viele Profile jetzt Koordinaten haben
SELECT 
  COUNT(*) as total_profiles,
  COUNT(latitude) as with_coords,
  COUNT(*) - COUNT(latitude) as without_coords,
  ROUND(COUNT(latitude)::numeric / COUNT(*)::numeric * 100, 2) as percentage_with_coords
FROM profiles
WHERE profile_published = true;
```

## Schritt 6: Optional - Automatisches Update aktivieren

Um zukünftige Profile automatisch mit Koordinaten zu versehen, aktiviere den Trigger:

```sql
-- Trigger aktivieren
DROP TRIGGER IF EXISTS trigger_update_profile_coords ON public.profiles;
CREATE TRIGGER trigger_update_profile_coords
  AFTER INSERT OR UPDATE OF plz, ort ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_profile_coordinates();
```

**Hinweis:** Dieser Trigger aktualisiert automatisch Koordinaten, wenn ein Profile erstellt oder PLZ/Ort geändert wird.

## ✅ Fertig!

Nach diesen Schritten:
- ✅ Alle deutschen PLZ haben Koordinaten
- ✅ Alle Profile haben Koordinaten (basierend auf PLZ/Ort)
- ✅ Radius-Suche funktioniert vollständig
- ✅ Autocomplete zeigt alle verfügbaren PLZ/Städte

## 🧪 Testen

1. Gehe zu `/company/search`
2. Gib einen Standort ein (z. B. "10115 Berlin")
3. Stelle Radius ein (z. B. 50 km)
4. Suche starten
5. Profile im Radius sollten gefunden werden!

## 🐛 Troubleshooting

**Problem: "No coordinates found"**
- Lösung: Prüfe ob Schritt 2 erfolgreich war (PLZ-Koordinaten geladen)
- Lösung: Prüfe ob Profile PLZ/Ort haben

**Problem: "Function not found"**
- Lösung: Migration nochmal ausführen (Schritt 1)

**Problem: "Edge Function error"**
- Lösung: Prüfe ob Function deployed wurde
- Lösung: Prüfe Logs in Supabase Dashboard

