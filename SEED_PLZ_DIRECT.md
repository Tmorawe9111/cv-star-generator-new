# PLZs direkt laden - Alternative Methode

Da die Edge Function Authorization-Probleme hat, können wir die PLZs auch direkt über SQL laden.

## Option 1: Über Supabase Dashboard SQL Editor

Führe diesen SQL-Befehl im Supabase SQL Editor aus:

```sql
-- Erstelle eine temporäre Tabelle für die CSV-Daten
CREATE TEMP TABLE temp_plz_coords (
  plz VARCHAR(5),
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION
);

-- Lade Daten (manuell oder über eine CSV-Import-Funktion)
-- Oder verwende die Edge Function mit korrekter Authorization
```

## Option 2: Edge Function manuell im Dashboard aufrufen

1. Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/functions
2. Klicke auf `seed-all-postal-codes`
3. Klicke auf "Invoke function"
4. Setze den Body:
```json
{
  "dry_run": false,
  "batch_size": 500
}
```
5. Setze den Header `x-seed-token` auf: `e2d69ab684396bbfeac29eb6a3b333977d804b0d1e8c713122de8e79957bf688`

## Option 3: Über Supabase CLI mit Service Role

```bash
# Hole den Service Role Key
supabase secrets list | grep SERVICE_ROLE_KEY

# Rufe die Function auf (mit Service Role Key als Authorization)
curl -X POST 'https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/seed-all-postal-codes' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SERVICE_ROLE_KEY_HIER' \
  -H 'x-seed-token: e2d69ab684396bbfeac29eb6a3b333977d804b0d1e8c713122de8e79957bf688' \
  -d '{"dry_run": false, "batch_size": 500}'
```



