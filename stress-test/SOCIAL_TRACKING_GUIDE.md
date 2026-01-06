# 📱 Social Media Creator Tracking - Anleitung

## Übersicht

Saubere, kurze URLs für Instagram und Facebook Creator Links mit automatischem Tracking.

## URL-Format

### Instagram:
```
https://bevisiblle.de/ig/CREATOR_CODE
https://bevisiblle.de/instagram/CREATOR_CODE
```

### Facebook:
```
https://bevisiblle.de/fb/CREATOR_CODE
https://bevisiblle.de/facebook/CREATOR_CODE
```

## Beispiel-Links

### Für Nakam auf Instagram:
```
https://bevisiblle.de/ig/nakam
```

### Für Nakam auf Facebook:
```
https://bevisiblle.de/fb/nakam
```

## Wie es funktioniert

1. **User klickt auf:** `https://bevisiblle.de/ig/nakam`
2. **System:**
   - Erkennt Platform (`ig` = Instagram)
   - Erkennt Creator (`nakam`)
   - Trackt automatisch im Hintergrund
   - Setzt UTM-Parameter:
     - `utm_source`: `instagram` oder `facebook`
     - `utm_medium`: `social`
     - `utm_campaign`: `creator_nakam`
     - `ref`: `NAKAM_IG` oder `NAKAM_FB`
     - `ref_name`: `Nakam`
   - Leitet weiter zur Zielseite
3. **User sieht:** Die normale Zielseite (keine Parameter sichtbar)
4. **Tracking:** Läuft automatisch im Hintergrund

## Creator Management

### Zugriff:
1. Gehe zu: `/admin/creators`
2. Erstelle neue Creators:
   - Creator Code (z.B. `nakam`)
   - Creator Name (z.B. `Nakam`)
   - Platform (Instagram, Facebook, oder Beide)
   - Weiterleitung zu (CV Generator oder Gesundheitswesen Landing)
   - UTM Campaign (optional)

### Links generieren:
Nach dem Erstellen eines Creators werden automatisch die Links generiert:
- Instagram: `bevisiblle.de/ig/nakam`
- Facebook: `bevisiblle.de/fb/nakam`

## Analytics

### Creator-spezifische Analytics:
1. Gehe zu: `/admin/referral-analytics`
2. Filter nach:
   - `utm_source`: `instagram` oder `facebook`
   - `referral_code`: `NAKAM_IG`, `NAKAM_FB`, etc.

### Metriken pro Creator:
- Total Clicks
- Registrierungen
- Vollständige Profile
- CV-Erstellungen
- Conversion Rates

## Creator hinzufügen

### Option 1: Im Admin-Panel (Empfohlen)
1. Gehe zu: `/admin/creators`
2. Klicke auf "Neuer Creator"
3. Fülle die Felder aus:
   - Creator Code: `nakam`
   - Creator Name: `Nakam`
   - Platform: `Instagram` oder `Beide`
   - Weiterleitung zu: `Gesundheitswesen Landing`
   - UTM Campaign: `january2024` (optional)
4. Klicke auf "Erstellen"
5. Kopiere die generierten Links

### Option 2: Manuell in Code
1. Öffne: `src/pages/SocialRedirect.tsx`
2. Füge einen neuen Eintrag hinzu:

```typescript
'creator_code': {
  referral_code: 'CREATOR_IG',
  referral_name: 'Creator Name',
  utm_source: 'instagram',
  utm_medium: 'social',
  utm_campaign: 'creator_name',
  redirectTo: 'gesundheitswesen', // oder 'cv-generator'
},
```

## Tracking-Daten

Alle Klicks werden automatisch getrackt mit:
- **Referral Code**: `NAKAM_IG` (Instagram) oder `NAKAM_FB` (Facebook)
- **Referral Name**: `Nakam`
- **UTM Source**: `instagram` oder `facebook`
- **UTM Medium**: `social`
- **UTM Campaign**: `creator_nakam`

## Vorteile

✅ **Saubere URLs** - Kurz und merkbar  
✅ **Platform-spezifisch** - Separate Tracking für Instagram & Facebook  
✅ **Creator-spezifisch** - Jeder Creator hat eigene Links  
✅ **Automatisches Tracking** - Läuft im Hintergrund  
✅ **Einfach zu teilen** - Kurze, professionelle Links  
✅ **Analytics-ready** - Vollständige Performance-Metriken

## Best Practices

1. **Eindeutige Codes**: Verwende eindeutige Creator-Codes (z.B. `nakam`, nicht `nakam1`)
2. **Konsistente Namen**: Verwende immer den gleichen Namen für den gleichen Creator
3. **Platform-Trennung**: Erstelle separate Einträge für Instagram und Facebook, wenn du unterschiedliche Campaigns tracken willst
4. **UTM Campaigns**: Nutze UTM Campaigns für bessere Analyse (z.B. `january2024`, `launch`)

## Beispiel-Workflow

1. **Creator erstellen:**
   - Code: `nakam`
   - Name: `Nakam`
   - Platform: `Beide`
   - Weiterleitung: `Gesundheitswesen Landing`

2. **Links teilen:**
   - Instagram: `https://bevisiblle.de/ig/nakam`
   - Facebook: `https://bevisiblle.de/fb/nakam`

3. **Performance tracken:**
   - Gehe zu `/admin/referral-analytics`
   - Filter nach `utm_source: instagram` oder `utm_source: facebook`
   - Filter nach `referral_code: NAKAM_IG` oder `NAKAM_FB`
   - Siehst du alle Metriken für diesen Creator

## Migration

Die Creator-Daten werden aktuell in `localStorage` gespeichert. Für Production sollte eine Datenbank-Tabelle erstellt werden:

```sql
CREATE TABLE public.creators (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  platform text NOT NULL, -- 'instagram', 'facebook', 'both'
  utm_campaign text,
  redirect_to text DEFAULT 'cv-generator',
  created_at timestamp with time zone DEFAULT now()
);
```

