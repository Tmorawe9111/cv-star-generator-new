# ✅ Standorte, PLZ und Städte - Implementierung

## Was wurde implementiert

### 1. LocationAutocomplete Komponente
- **Datei**: `src/components/Company/LocationAutocomplete.tsx`
- **Funktion**: Autocomplete für PLZ/Stadt aus `postal_codes` Tabelle
- **Features**:
  - Suche nach PLZ (5-stellig) oder Stadt
  - Vorschläge aus Datenbank
  - Keyboard-Navigation
  - Format: "PLZ Ort" oder "PLZ Ort, Bundesland"

### 2. Location Utils
- **Datei**: `src/lib/location-utils.ts`
- **Funktionen**:
  - `parseLocation()`: Parst PLZ und Stadt aus String
  - `saveCompanyLocation()`: Speichert Standort mit Koordinaten

### 3. Settings Integration
- **Datei**: `src/pages/Company/Settings.tsx`
- **Änderungen**:
  - `LocationAutocomplete` statt einfachem Input
  - Automatisches Speichern von Koordinaten
  - Verknüpfung mit `locations` Tabelle

### 4. Datenbank-Trigger
- **Datei**: `supabase/migrations/20251113000000_auto_update_geog_for_companies.sql`
- **Funktion**: Aktualisiert automatisch `geog` Spalte wenn `latitude`/`longitude` geändert werden

## Datenfluss

```
User gibt PLZ/Stadt ein
  → LocationAutocomplete zeigt Vorschläge
  → User wählt Vorschlag
  → saveCompanyLocation() wird aufgerufen
    → Parse PLZ und Stadt
    → get_location_coordinates() RPC (aus postal_codes oder cache)
    → upsert_location_with_coords() RPC (speichert in locations Tabelle)
    → Update companies Tabelle:
      - main_location (Text)
      - location_id (FK zu locations)
      - latitude, longitude
      - geog (automatisch via Trigger)
```

## Datenbank-Struktur

### companies Tabelle
- `main_location` (text) - Text-Darstellung: "PLZ Ort"
- `location_id` (bigint) - FK zu `locations` Tabelle
- `latitude` (double precision)
- `longitude` (double precision)
- `geog` (geography) - PostGIS Spalte (automatisch aktualisiert)

### locations Tabelle
- `id` (bigint) - Primary Key
- `postal_code` (text)
- `city` (text)
- `state` (text) - Bundesland
- `country_code` (text)
- `lat`, `lon` (double precision)
- `geog` (geography) - PostGIS Spalte

### postal_codes Tabelle
- `plz` (varchar) - 5-stellige PLZ
- `ort` (text) - Stadt
- `bundesland` (text)
- `latitude`, `longitude` (double precision)
- `geog` (geography) - PostGIS Spalte

## RPC Funktionen

1. **get_location_coordinates**
   - Input: PLZ, Stadt, Straße (optional)
   - Output: Koordinaten, location_id, Quelle (cache/postal_codes/locations)

2. **upsert_location_with_coords**
   - Input: PLZ, Stadt, Bundesland, Land, Lat, Lon
   - Output: location_id (neu oder vorhanden)

3. **search_profiles_within_radius**
   - Input: Koordinaten oder location_id, Radius (km)
   - Output: Profile-IDs innerhalb des Radius

## Nächste Schritte

1. **Migration ausführen**:
   ```bash
   supabase db push
   ```

2. **Testen**:
   - Settings → Hauptsitz eingeben
   - Prüfe `companies.location_id`, `latitude`, `longitude`
   - Prüfe `locations` Tabelle

3. **CompanySignup aktualisieren** (optional):
   - LocationAutocomplete auch im Signup verwenden
   - Standort beim Signup speichern

## Wichtige Hinweise

- **geog Spalte**: Wird automatisch via Trigger aktualisiert
- **Koordinaten**: Werden aus `postal_codes` Tabelle geholt (falls vorhanden)
- **Fallback**: Wenn keine Koordinaten gefunden werden, wird nur Text gespeichert
- **Radius-Suche**: Funktioniert nur wenn `location_id` oder `latitude`/`longitude` gesetzt sind

