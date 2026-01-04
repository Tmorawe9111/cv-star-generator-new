# 📊 Referral Tracking System - Anleitung

## Übersicht

Das Referral Tracking System ermöglicht es, Influencer-Links und Marketing-Kampagnen zu tracken und deren Performance zu messen.

## Was wird getrackt?

1. **Klicks** - Jeder Klick auf einen Referral-Link
2. **Registrierungen** - Wenn ein User sich registriert
3. **Vollständige Profile** - Wenn ein Profil als "complete" markiert wird
4. **CV-Erstellungen** - Wenn ein CV erstellt wird

## Conversion-Funnel

```
Klick → Registrierung → Vollständiges Profil → CV-Erstellung
```

## Link-Format

### Basis-Format:
```
https://bevisiblle.de/cv-generator?ref=NAKAM2024&ref_name=Nakam&utm_source=influencer&utm_campaign=january2024
```

### Parameter:
- `ref` oder `referral_code` - Eindeutiger Code für den Influencer (z.B. NAKAM2024)
- `ref_name` oder `referral_name` - Name des Influencers (z.B. Nakam)
- `ref_source` oder `utm_source` - Quelle (z.B. influencer, partner, organic)
- `utm_medium` - Medium (z.B. referral, email, social)
- `utm_campaign` - Kampagne (z.B. january2024, launch)
- `utm_term` - Optional: Suchbegriff
- `utm_content` - Optional: Content-Variante

## Beispiel-Links

### Für Nakam:
```
https://bevisiblle.de/cv-generator?ref=NAKAM2024&ref_name=Nakam&utm_source=influencer&utm_campaign=january2024
```

### Für Partner:
```
https://bevisiblle.de/cv-generator?ref=PARTNER123&ref_name=Partner%20Name&utm_source=partner&utm_medium=referral
```

## Admin-Panel

### Zugriff:
1. Gehe zu: `/admin/referral-analytics`
2. Siehst du:
   - Total Clicks
   - Registrierungen
   - Vollständige Profile
   - CV-Erstellungen
   - Conversion Rates

### Link-Generator:
Im Admin-Panel kannst du direkt Links generieren:
1. Referral Code eingeben (z.B. NAKAM2024)
2. Influencer Name (z.B. Nakam)
3. UTM Source (z.B. influencer)
4. UTM Campaign (z.B. january2024)
5. Link generieren und kopieren

## Analytics-Metriken

### Klick-zu-Registrierung Rate
```
Registrierungen / Klicks * 100
```

### Registrierung-zu-Profil Rate
```
Vollständige Profile / Registrierungen * 100
```

### Klick-zu-Profil Rate (Gesamt-Conversion)
```
Vollständige Profile / Klicks * 100
```

## Datenbank-Struktur

### Tabelle: `referral_tracking`
- `id` - Eindeutige ID
- `session_id` - Browser Session ID
- `referral_code` - Code des Influencers
- `referral_name` - Name des Influencers
- `utm_source`, `utm_medium`, `utm_campaign` - UTM Parameter
- `clicked_at` - Wann wurde geklickt
- `registered_at` - Wann wurde registriert
- `profile_completed_at` - Wann wurde Profil vollständig
- `cv_created_at` - Wann wurde CV erstellt
- `user_id` - User ID (nach Registrierung)

### View: `referral_analytics`
Aggregierte Daten für Analytics mit Conversion Rates.

## Automatisches Tracking

Das System trackt automatisch:
1. ✅ Klicks beim Laden der Seite (wenn UTM-Parameter vorhanden)
2. ✅ Registrierung (wenn User sich anmeldet)
3. ✅ Profil-Vollständigkeit (wenn `profile_complete = true`)
4. ✅ CV-Erstellung (wenn CV gespeichert wird)

## Manuelles Tracking

Falls nötig, kannst du auch manuell tracken:

```typescript
import { trackReferralClick } from '@/hooks/useReferralTracking';

trackReferralClick({
  referral_code: 'NAKAM2024',
  referral_name: 'Nakam',
  utm_source: 'influencer',
  utm_campaign: 'january2024'
});
```

## Best Practices

1. **Eindeutige Codes**: Verwende eindeutige Codes für jeden Influencer
2. **Konsistente Namen**: Verwende immer den gleichen Namen für den gleichen Influencer
3. **UTM-Parameter**: Nutze UTM-Parameter für bessere Analyse
4. **Testen**: Teste Links vor dem Versenden

## Cleanup

Test-Links werden automatisch getrackt. Du kannst sie in der Datenbank sehen:
```sql
SELECT * FROM referral_tracking WHERE referral_code LIKE 'TEST%';
```

## Migration ausführen

Die Migration muss in Supabase ausgeführt werden:
1. Gehe zu Supabase Dashboard > SQL Editor
2. Kopiere den Inhalt von `supabase/migrations/20250121000003_create_referral_tracking.sql`
3. Führe die Queries aus

