# Migration ausführen - Anleitung

## Option 1: Mit Supabase CLI (Empfohlen)

Wenn dein Projekt bereits mit Supabase verlinkt ist:

```bash
cd /Users/toddmorawe/cv-star-generator
supabase db push
```

Dies pusht alle neuen Migrationen (inkl. `20251112000000_add_onboarding_tracking.sql`) zu deiner Supabase-Datenbank.

**Hinweis**: Falls du noch nicht verlinkt bist:
```bash
supabase link --project-ref koymmvuhcxlvcuoyjnvv
```

## Option 2: Manuell im Supabase Dashboard

1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt aus
3. Gehe zu **SQL Editor** (linke Sidebar)
4. Klicke auf **New Query**
5. Kopiere den Inhalt der Migration-Datei:
   - Datei: `supabase/migrations/20251112000000_add_onboarding_tracking.sql`
6. Füge den SQL-Code ein
7. Klicke auf **Run** (oder `Cmd/Ctrl + Enter`)

## Option 3: Migration-Datei direkt ausführen

Falls du die Supabase CLI lokal installiert hast:

```bash
cd /Users/toddmorawe/cv-star-generator
supabase migration up
```

## Was wird geändert?

Die Migration fügt folgende Felder zur `companies` Tabelle hinzu:

- ✅ `onboarding_skipped_steps` (integer[]) - Array für übersprungene Steps
- ✅ `onboarding_completed_steps` (integer[]) - Array für abgeschlossene Steps
- ✅ Stellt sicher, dass `industry`, `main_location`, `country` Felder existieren
- ✅ Erstellt Index für bessere Performance

## Verifizierung

Nach der Migration kannst du prüfen, ob alles funktioniert:

```sql
-- In Supabase SQL Editor ausführen:
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name IN (
    'onboarding_skipped_steps',
    'onboarding_completed_steps',
    'industry',
    'main_location',
    'country'
  )
ORDER BY column_name;
```

Du solltest alle 5 Felder sehen.

## Troubleshooting

**Fehler: "relation already exists"**
- Die Felder existieren bereits → Alles OK, Migration ist idempotent (kann mehrfach ausgeführt werden)

**Fehler: "permission denied"**
- Prüfe, ob du die richtigen Rechte für die Datenbank hast

**Fehler: "column already exists"**
- Die Felder existieren bereits → Alles OK, die Migration verwendet `IF NOT EXISTS`

