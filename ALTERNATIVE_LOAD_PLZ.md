# Alternative: PLZ-Koordinaten laden

Da "Invoke" im Dashboard nicht funktioniert, hier sind **3 Alternativen**:

## Option 1: Bestehende Function verwenden (empfohlen)

Die `seed-locations-de` Function existiert bereits und kann verwendet werden:

1. Gehe zu: **Supabase Dashboard** → **Edge Functions** → **seed-locations-de**
2. Klicke auf die Function
3. Im **Logs** Tab siehst du die Function
4. **Oder** verwende curl:

```bash
curl -X POST https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/seed-locations-de \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 0}'
```

**Hinweis:** `limit: 0` bedeutet "alle" (keine Limitierung)

## Option 2: Via Supabase CLI (wenn du den ANON_KEY hast)

```bash
# Setze deinen ANON_KEY
export SUPABASE_ANON_KEY="dein_anon_key_hier"

# Rufe die Function auf
curl -X POST https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/seed-all-postal-codes \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false, "batch_size": 1000}'
```

## Option 3: SQL direkt (wenn postal_codes bereits Daten hat)

Falls deine `postal_codes` Tabelle bereits viele Einträge hat, aber keine Koordinaten:

1. Lade das CSV manuell: https://raw.githubusercontent.com/WZBSocialScienceCenter/plz_geocoord/master/plz_geocoord.csv
2. Importiere es in eine temporäre Tabelle
3. Update postal_codes mit JOIN

**Oder** verwende die bestehende `seed-locations-de` Function, die das automatisch macht!

## Empfehlung: Option 1

Die `seed-locations-de` Function macht genau das, was du brauchst:
- Lädt CSV mit PLZ-Koordinaten
- Aktualisiert `postal_codes` Tabelle
- Erstellt Einträge in `locations` Tabelle

**Einfach aufrufen mit:**
```json
{"limit": 0}
```

Das lädt **alle** PLZ mit Koordinaten!

