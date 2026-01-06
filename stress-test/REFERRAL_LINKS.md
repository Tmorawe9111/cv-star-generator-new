# 🔗 Saubere Referral Links - Übersicht

## Kurze URLs für Influencer

Statt langer URLs mit vielen Parametern kannst du jetzt kurze, saubere Links verwenden:

### Format:
```
https://bevisiblle.de/ref/CODE
```

### Beispiel für Nakam:
```
https://bevisiblle.de/ref/nakam
```

Dieser Link:
- ✅ Sieht sauber aus (keine langen Parameter sichtbar)
- ✅ Trackt automatisch im Hintergrund
- ✅ Leitet zur Gesundheitswesen-Landing Page weiter
- ✅ Setzt alle UTM-Parameter automatisch

---

## Verfügbare Codes

### Aktuell verfügbar:

| Code | Link | Weiterleitung zu |
|------|------|------------------|
| `nakam` | `https://bevisiblle.de/ref/nakam` | Gesundheitswesen-Landing Page |
| `nakam2024` | `https://bevisiblle.de/ref/nakam2024` | Gesundheitswesen-Landing Page |
| `partner1` | `https://bevisiblle.de/ref/partner1` | CV-Generator |

---

## Neue Codes hinzufügen

Um einen neuen Influencer-Code hinzuzufügen:

1. **Öffne:** `src/pages/ReferralRedirect.tsx`
2. **Füge einen neuen Eintrag hinzu:**

```typescript
'neuer-code': {
  referral_code: 'NEUERCODE2024',
  referral_name: 'Influencer Name',
  utm_source: 'influencer',
  utm_campaign: 'january2024',
  utm_medium: 'referral',
  redirectTo: 'gesundheitswesen', // oder 'cv-generator'
},
```

3. **Speichere und deploye**

---

## Wie es funktioniert

1. **User klickt auf:** `https://bevisiblle.de/ref/nakam`
2. **System:**
   - Erkennt den Code `nakam`
   - Trackt den Klick automatisch im Hintergrund
   - Setzt UTM-Parameter (`ref=NAKAM2024`, `ref_name=Nakam`, etc.)
   - Leitet weiter zur Gesundheitswesen-Landing Page
3. **User sieht:** Die normale Gesundheitswesen-Seite (keine Parameter sichtbar)
4. **Tracking:** Läuft automatisch im Hintergrund

---

## Tracking-Daten

Alle Klicks werden automatisch getrackt mit:
- Referral Code: `NAKAM2024`
- Referral Name: `Nakam`
- UTM Source: `influencer`
- UTM Campaign: `january2024`
- UTM Medium: `referral`

Siehst du in: `/admin/referral-analytics`

---

## Beispiel-Links für Nakam

### Kurz (Empfohlen):
```
https://bevisiblle.de/ref/nakam
```

### Lang (funktioniert auch):
```
https://bevisiblle.de/cv-generator?ref=NAKAM2024&ref_name=Nakam&utm_source=influencer&utm_campaign=january2024
```

Beide Links funktionieren gleich, aber der kurze Link sieht viel sauberer aus!

---

## Weiterleitung-Optionen

- `redirectTo: 'gesundheitswesen'` → Leitet zur Gesundheitswesen-Landing Page weiter
- `redirectTo: 'cv-generator'` → Leitet direkt zum CV-Generator weiter

---

## Vorteile

✅ **Saubere URLs** - Keine langen Parameter sichtbar  
✅ **Einfach zu teilen** - Kurz und merkbar  
✅ **Automatisches Tracking** - Läuft im Hintergrund  
✅ **Flexibel** - Kann zu verschiedenen Seiten weiterleiten  
✅ **Professionell** - Sieht aus wie eine normale URL

