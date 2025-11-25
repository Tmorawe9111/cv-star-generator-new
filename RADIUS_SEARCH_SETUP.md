# 🗺️ Radius-Suche Infrastruktur - Setup-Anleitung

## ✅ Was wurde erstellt

### 1. Datenbank-Migration (`20251112000001_radius_search_infrastructure.sql`)
- ✅ Erweitert `locations` Tabelle mit `full_address`, `latitude`, `longitude`
- ✅ Erweitert `postal_codes` Tabelle mit Koordinaten
- ✅ Erweitert `profiles` und `companies` Tabellen mit Koordinaten
- ✅ Erstellt `geocoding_cache` Tabelle (reduziert API-Calls)
- ✅ Erstellt Radius-Suche Funktionen:
  - `search_profiles_within_radius()` - verwendet PostGIS
  - `search_profiles_within_radius_by_coords()` - Fallback für direkte Koordinaten
  - `get_location_coordinates()` - findet Koordinaten für PLZ/Stadt/Straße
  - `cache_geocoding_result()` - speichert Geocoding-Ergebnisse

### 2. Nominatim Geocoding Edge Function (`nominatim-geocode`)
- ✅ **100% kostenlos** (OpenStreetMap)
- ✅ Geocoding: Adresse → Koordinaten
- ✅ Reverse Geocoding: Koordinaten → Adresse
- ✅ Automatisches Caching
- ✅ Prüft zuerst Datenbank, dann API

## 🚀 Setup-Schritte

### Schritt 1: Migration ausführen

```bash
cd /Users/toddmorawe/cv-star-generator
supabase db push
```

Oder manuell im Supabase SQL Editor:
```sql
-- Kopiere Inhalt von:
supabase/migrations/20251112000001_radius_search_infrastructure.sql
```

### Schritt 2: Nominatim Edge Function deployen

```bash
supabase functions deploy nominatim-geocode
```

### Schritt 3: PLZ-Daten mit Koordinaten befüllen

Die bestehende `seed-locations-de` Function kann verwendet werden:

```bash
# Via Supabase Dashboard → Edge Functions → seed-locations-de → Invoke
# Oder via curl:
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/seed-locations-de \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 1000}'
```

### Schritt 4: Frontend-Integration

Erstelle einen Hook für Geocoding und Radius-Suche:

```typescript
// src/hooks/useGeocoding.ts
import { supabase } from '@/integrations/supabase/client';

export async function geocodeAddress(
  postal_code?: string,
  city?: string,
  street?: string,
  country_code = 'DE'
) {
  const { data, error } = await supabase.functions.invoke('nominatim-geocode', {
    body: {
      type: 'geocode',
      postal_code,
      city,
      street,
      country_code,
      use_cache: true
    }
  });

  if (error) throw error;
  return data;
}

export async function searchWithinRadius(
  latitude: number,
  longitude: number,
  radius_km: number = 50
) {
  const { data, error } = await supabase.rpc('search_profiles_within_radius', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: radius_km
  });

  if (error) throw error;
  return data;
}
```

## 📋 Verwendung in Search-Seite

### Beispiel-Integration:

```typescript
// In Search.tsx
const handleLocationSearch = async () => {
  if (!filters.location) return;

  try {
    // 1. Geocode Adresse (PLZ/Stadt)
    const coords = await geocodeAddress(
      extractPLZ(filters.location),
      extractCity(filters.location)
    );

    if (!coords.latitude) {
      toast.error('Standort nicht gefunden');
      return;
    }

    // 2. Suche Profile im Radius
    const radiusResults = await searchWithinRadius(
      coords.latitude,
      coords.longitude,
      filters.radius
    );

    // 3. Lade vollständige Profile-Daten
    const profileIds = radiusResults.map(r => r.profile_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', profileIds)
      .eq('profile_published', true);

    setProfiles(profiles || []);
  } catch (error) {
    console.error('Radius search error:', error);
  }
};
```

## 🎯 Features

### ✅ Unterstützt:
- PLZ-Suche
- Stadt-Suche
- Straßen-Suche (optional)
- Radius-Suche (km)
- Automatisches Caching
- PostGIS für präzise Entfernungsberechnung

### 📊 Datenquellen (in Reihenfolge):
1. **Geocoding Cache** (schnell, bereits geocodiert)
2. **postal_codes Tabelle** (PLZ mit Koordinaten)
3. **locations Tabelle** (PostGIS, vollständige Adressen)
4. **Nominatim API** (OpenStreetMap, kostenlos)

## 🔧 Nächste Schritte

1. ✅ Migration ausführen
2. ✅ Edge Function deployen
3. ⏳ Frontend-Hook erstellen (`useGeocoding.ts`)
4. ⏳ Search-Seite aktualisieren (Radius-Suche integrieren)
5. ⏳ Autocomplete für PLZ/Stadt hinzufügen
6. ⏳ Radius-Slider in UI integrieren

## 📝 Wichtige Hinweise

### Nominatim API Limits:
- **Kostenlos**: 1 Request/Sekunde
- **User-Agent erforderlich**: `BeVisiblle/1.0 (contact@bevisiblle.de)`
- **Attribution erforderlich**: "© OpenStreetMap contributors"

### Performance:
- Cache reduziert API-Calls erheblich
- PostGIS Indizes für schnelle Radius-Suche
- GIST Index auf Koordinaten

### Datenqualität:
- PLZ-Daten: GitHub CSV (WZBSocialScienceCenter/plz_geocoord)
- Stadt-Daten: Via Nominatim API
- Straßen-Daten: On-demand via Nominatim

## 🐛 Troubleshooting

**Problem**: "PostGIS extension not found"
- Lösung: `CREATE EXTENSION IF NOT EXISTS postgis;` in Supabase SQL Editor

**Problem**: "Nominatim API rate limit"
- Lösung: Cache funktioniert, sollte nicht auftreten bei normaler Nutzung

**Problem**: "No coordinates found"
- Lösung: Prüfe ob `seed-locations-de` ausgeführt wurde

