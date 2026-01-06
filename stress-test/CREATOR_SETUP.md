# 🎯 Creator Management Setup - Anleitung

## 📋 Schritt 1: Migration ausführen

### In Supabase Dashboard:

1. **Gehe zu:** Supabase Dashboard > SQL Editor
2. **Öffne die Datei:** `supabase/migrations/20250121000004_create_creators_table.sql`
3. **Kopiere den gesamten Inhalt**
4. **Füge ihn in den SQL Editor ein**
5. **Klicke auf "Run"**

Die Migration erstellt:
- ✅ `creators` Tabelle
- ✅ Indexes für Performance
- ✅ RLS Policies
- ✅ Trigger für `updated_at`

---

## 🎨 Schritt 2: Creators erstellen

### Im Admin-Panel:

1. **Gehe zu:** `/admin/creators`
2. **Klicke auf:** "Neuer Creator"
3. **Fülle die Felder aus:**
   - **Creator Code**: `nakam` (wird in URL verwendet)
   - **Creator Name**: `Nakam` (wird für Tracking verwendet)
   - **Platform**: `Instagram`, `Facebook`, oder `Beide`
   - **Weiterleitung zu**: `CV Generator` oder `Gesundheitswesen Landing`
   - **UTM Campaign**: `january2024` (optional)
4. **Klicke auf:** "Erstellen"

### Beispiel:

| Feld | Wert |
|------|------|
| Creator Code | `nakam` |
| Creator Name | `Nakam` |
| Platform | `Beide` |
| Weiterleitung zu | `Gesundheitswesen Landing` |
| UTM Campaign | `january2024` |

---

## 🔗 Schritt 3: Links verwenden

Nach dem Erstellen werden automatisch die Links generiert:

### Instagram:
```
https://bevisiblle.de/ig?c=nakam
```

### Facebook:
```
https://bevisiblle.de/fb?c=nakam
```

### Link-Format:
- **Basis-Link**: `bevisiblle.de/ig` oder `bevisiblle.de/fb`
- **Creator-Parameter**: `?c=CREATOR_CODE`
- **Vollständig**: `bevisiblle.de/ig?c=nakam`

---

## 📊 Schritt 4: Analytics ansehen

### Creator-spezifische Analytics:

1. **Gehe zu:** `/admin/referral-analytics`
2. **Filter nach:**
   - `utm_source`: `instagram` oder `facebook`
   - `referral_code`: `NAKAM_IG`, `NAKAM_FB`, etc.

### Metriken:
- Total Clicks
- Registrierungen
- Vollständige Profile
- CV-Erstellungen
- Conversion Rates

---

## 🗄️ Datenbank-Struktur

### Tabelle: `creators`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | uuid | Eindeutige ID |
| `code` | text | Creator-Code (z.B. `nakam`) |
| `name` | text | Creator-Name (z.B. `Nakam`) |
| `platform` | text | `instagram`, `facebook`, oder `both` |
| `utm_campaign` | text | Optional: UTM Campaign |
| `redirect_to` | text | `cv-generator` oder `gesundheitswesen` |
| `is_active` | boolean | Ob Creator aktiv ist |
| `created_at` | timestamp | Erstellungsdatum |
| `updated_at` | timestamp | Letztes Update |

---

## ✅ Checkliste

- [ ] Migration ausgeführt
- [ ] Creator erstellt (`/admin/creators`)
- [ ] Links getestet (`bevisiblle.de/ig?c=nakam`)
- [ ] Analytics geprüft (`/admin/referral-analytics`)

---

## 💡 Tipps

1. **Eindeutige Codes**: Verwende eindeutige Creator-Codes (z.B. `nakam`, nicht `nakam1`)
2. **Platform**: Wähle `Beide`, wenn der Creator auf Instagram und Facebook aktiv ist
3. **UTM Campaigns**: Nutze UTM Campaigns für bessere Analyse (z.B. `january2024`)
4. **Weiterleitung**: Wähle `Gesundheitswesen Landing` für Gesundheitswesen-Creators

---

## 🚀 Beispiel-Workflow

1. **Migration ausführen** → Supabase SQL Editor
2. **Creator erstellen** → `/admin/creators`
3. **Link kopieren** → `bevisiblle.de/ig?c=nakam`
4. **Link teilen** → Instagram/Facebook Bio
5. **Performance tracken** → `/admin/referral-analytics`

