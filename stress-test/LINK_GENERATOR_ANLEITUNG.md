# 🔗 Referral Link Generator - Schnellstart

## 📋 Schritt 1: Migration ausführen

### In Supabase Dashboard:

1. **Gehe zu:** Supabase Dashboard > SQL Editor
2. **Öffne die Datei:** `supabase/migrations/20250121000003_create_referral_tracking.sql`
3. **Kopiere den gesamten Inhalt**
4. **Füge ihn in den SQL Editor ein**
5. **Klicke auf "Run"**

Die Migration erstellt:
- ✅ `referral_tracking` Tabelle
- ✅ `referral_analytics` View
- ✅ Trigger für automatisches Tracking
- ✅ Indexes für Performance

---

## 🔗 Schritt 2: Links erstellen

### Option A: Im Admin-Panel (Empfohlen)

1. **Gehe zu:** `/admin/referral-analytics`
2. **Scrolle nach unten** zum "Generate Referral Link" Bereich
3. **Fülle die Felder aus:**
   - Referral Code: `NAKAM2024`
   - Influencer Name: `Nakam`
   - UTM Source: `influencer`
   - UTM Campaign: `january2024`
4. **Klicke auf "Generate Link"**
5. **Kopiere den Link**

### Option B: HTML-Tool (Offline)

1. **Öffne:** `stress-test/generate-referral-link.html` im Browser
2. **Fülle die Felder aus**
3. **Klicke auf "Link generieren"**
4. **Kopiere den Link**

### Option C: Manuell

**Basis-Format:**
```
https://bevisiblle.de/cv-generator?ref=CODE&ref_name=NAME&utm_source=SOURCE&utm_campaign=CAMPAIGN
```

**Beispiel für Nakam:**
```
https://bevisiblle.de/cv-generator?ref=NAKAM2024&ref_name=Nakam&utm_source=influencer&utm_campaign=january2024&utm_medium=referral
```

**Parameter:**
- `ref` - **Pflicht:** Eindeutiger Code (z.B. NAKAM2024)
- `ref_name` - **Pflicht:** Name des Influencers (z.B. Nakam)
- `utm_source` - Quelle (z.B. influencer, partner)
- `utm_campaign` - Kampagne (z.B. january2024)
- `utm_medium` - Medium (z.B. referral, social, email)

---

## 📊 Schritt 3: Analytics ansehen

1. **Gehe zu:** `/admin/referral-analytics`
2. **Siehst du:**
   - Total Clicks
   - Registrierungen
   - Vollständige Profile
   - CV-Erstellungen
   - Conversion Rates

**Filter:**
- Zeitraum: Letzte 7/30/90 Tage oder All time
- Gruppierung: Nach Code, Name oder Campaign

---

## 📝 Beispiel-Links

### Nakam:
```
https://bevisiblle.de/cv-generator?ref=NAKAM2024&ref_name=Nakam&utm_source=influencer&utm_campaign=january2024
```

### Partner XYZ:
```
https://bevisiblle.de/cv-generator?ref=PARTNER123&ref_name=Partner%20XYZ&utm_source=partner&utm_medium=referral
```

### Social Media Kampagne:
```
https://bevisiblle.de/cv-generator?ref=SOCIAL2024&ref_name=Instagram&utm_source=social&utm_medium=instagram&utm_campaign=launch
```

---

## ✅ Was wird automatisch getrackt?

1. **Klick** → Beim Laden der Seite (wenn UTM-Parameter vorhanden)
2. **Registrierung** → Wenn User sich registriert
3. **Vollständiges Profil** → Wenn `profile_complete = true`
4. **CV-Erstellung** → Wenn CV gespeichert wird

---

## 🎯 Conversion-Metriken

- **Click → Registration Rate:** Wie viele Klicks führen zu Registrierungen?
- **Registration → Profile Rate:** Wie viele Registrierungen führen zu vollständigen Profilen?
- **Click → Profile Rate:** Gesamt-Conversion von Klick zu vollständigem Profil

---

## 💡 Tipps

1. **Eindeutige Codes:** Verwende immer eindeutige Codes (z.B. NAKAM2024, nicht nur NAKAM)
2. **Konsistente Namen:** Verwende immer den gleichen Namen für den gleichen Influencer
3. **UTM-Parameter:** Nutze UTM-Parameter für bessere Analyse
4. **Testen:** Teste Links vor dem Versenden

---

## 🚀 Migration-Datei

Die vollständige Migration findest du in:
```
supabase/migrations/20250121000003_create_referral_tracking.sql
```

Kopiere den Inhalt und führe ihn im Supabase SQL Editor aus!

