# Radius-Suche Infrastruktur - Plan

## 🎯 Ziel

Eine vollständige Infrastruktur für Radius-Suche mit:
- PLZ/Postleitzahlen
- Städte
- Straßen (optional)
- Geocoding (Koordinaten)
- Radius-Suche basierend auf Entfernung

## 🆓 Kostenlose APIs

### Option 1: Nominatim (OpenStreetMap) - **100% KOSTENLOS**
- **URL**: https://nominatim.openstreetmap.org/
- **Limit**: 1 Request/Sekunde (kostenlos)
- **Features**: 
  - Geocoding (Adresse → Koordinaten)
  - Reverse Geocoding (Koordinaten → Adresse)
  - PLZ-Suche
  - Stadt-Suche
- **Keine API-Key erforderlich**
- **Nutzungsbedingungen**: Attribution erforderlich, fair use

### Option 2: Google Maps Geocoding API
- **Kostenlos**: $200/Monat Credit (≈ 40.000 Requests)
- **Danach**: $5 pro 1.000 Requests
- **API-Key erforderlich**

### Option 3: Mapbox Geocoding API
- **Kostenlos**: 100.000 Requests/Monat
- **Danach**: $0.75 pro 1.000 Requests
- **API-Key erforderlich**

## 📋 Empfehlung: Nominatim (OpenStreetMap)

**Warum Nominatim?**
- ✅ 100% kostenlos
- ✅ Keine API-Key erforderlich
- ✅ Gute Datenqualität für Deutschland
- ✅ Keine Limits für private Nutzung (fair use)
- ✅ Open Source

## 🗄️ Datenbank-Struktur

### Benötigte Tabellen:

1. **`postal_codes`** (bereits vorhanden?)
   - PLZ, Stadt, Bundesland
   - Koordinaten (lat, lon)

2. **`locations`** (bereits vorhanden?)
   - PLZ, Stadt, Bundesland, Land
   - Koordinaten (lat, lon)
   - Vollständige Adressen

3. **`streets`** (neu)
   - Straßenname
   - PLZ
   - Koordinaten (lat, lon)

4. **Geocoding Cache** (neu)
   - Adresse → Koordinaten Cache
   - Reduziert API-Calls

## 🔧 Implementierung

### 1. Supabase Edge Function: Geocoding
- Verwendet Nominatim API
- Cached Ergebnisse in Datenbank
- Reverse Geocoding Support

### 2. Supabase RPC Function: Radius Search
- Berechnet Entfernung zwischen Koordinaten
- Filtert Ergebnisse nach Radius
- Unterstützt PLZ, Stadt, Straße

### 3. Frontend Integration
- Autocomplete für PLZ/Stadt
- Radius-Slider
- Karte mit Radius-Visualisierung (optional)

## 📊 Datenquellen

### PLZ-Daten (Deutschland):
- **GitHub**: https://github.com/WZBSocialScienceCenter/plz_geocoord
- **CSV**: PLZ + Koordinaten
- Bereits in `seed-locations-de` verwendet

### Stadt-Daten:
- Via Nominatim API
- Oder eigene Datenbank

### Straßen-Daten:
- Via Nominatim API (on-demand)
- Oder eigene Datenbank (größer)

## 🚀 Nächste Schritte

1. ✅ Prüfe bestehende Tabellen
2. ⏳ Erstelle Migration für fehlende Tabellen
3. ⏳ Erstelle Geocoding Edge Function
4. ⏳ Erstelle Radius-Search RPC Function
5. ⏳ Integriere in Search-Seite
6. ⏳ Teste mit echten Daten

