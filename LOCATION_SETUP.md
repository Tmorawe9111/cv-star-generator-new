# ✅ Standorte, PLZ und Städte - Setup

## Was wurde implementiert

### 1. LocationAutocomplete in Settings
- **Datei**: `src/pages/Company/Settings.tsx`
- **Änderung**: `LocationAutocomplete` Komponente statt einfachem Input
- **Funktion**: Automatisches Speichern von Koordinaten beim Eingeben

### 2. Location Utils
- **Datei**: `src/lib/location-utils.ts`
- **Funktionen**:
  - `parseLocation()`: Parst PLZ und Stadt
  - `saveCompanyLocation()`: Speichert Standort mit Koordinaten

### 3. Datenbank-Trigger
- **Datei**: `TRIGGER_GEOG_COMPANIES.sql`
- **Funktion**: Aktualisiert automatisch `geog` Spalte

## Setup-Schritte

### 1. Trigger in Datenbank erstellen

Führe diese SQL im Supabase SQL Editor aus:

```sql
-- Siehe: TRIGGER_GEOG_COMPANIES.sql
```

Oder kopiere den Inhalt von `TRIGGER_GEOG_COMPANIES.sql` und führe ihn aus.

### 2. Testen

1. **Settings öffnen**: `/company/settings`
2. **Hauptsitz eingeben**: z.B. "10115 Berlin"
3. **Prüfen in Supabase**:
   - `companies.main_location` sollte "10115 Berlin" sein
   - `companies.location_id` sollte gesetzt sein
   - `companies.latitude` und `longitude` sollten gesetzt sein
   - `companies.geog` sollte automatisch gesetzt sein (via Trigger)
   - `locations` Tabelle sollte einen Eintrag haben

## Datenfluss

```
User gibt "10115 Berlin" ein
  → LocationAutocomplete zeigt Vorschläge
  → User wählt Vorschlag
  → saveCompanyLocation() wird aufgerufen
    → Parse: postalCode="10115", city="Berlin"
    → get_location_coordinates() RPC
      → Prüft postal_codes Tabelle
      → Gibt Koordinaten zurück
    → upsert_location_with_coords() RPC
      → Speichert/Findet in locations Tabelle
      → Gibt location_id zurück
    → Update companies:
      - main_location = "10115 Berlin"
      - location_id = <id>
      - latitude = 52.52
      - longitude = 13.40
      - geog = <automatisch via Trigger>
```

## Wichtige Hinweise

- **geog Spalte**: Wird automatisch via Trigger aktualisiert (nach Migration)
- **Koordinaten**: Werden aus `postal_codes` Tabelle geholt
- **Fallback**: Wenn keine Koordinaten gefunden werden, wird nur Text gespeichert
- **Radius-Suche**: Funktioniert nur wenn `location_id` oder Koordinaten gesetzt sind

## Nächste Schritte (optional)

1. **CompanySignup aktualisieren**: LocationAutocomplete auch im Signup verwenden
2. **Onboarding aktualisieren**: Standort im Onboarding speichern
3. **Profil anzeigen**: Standort mit Koordinaten im Profil anzeigen

