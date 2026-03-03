# ✅ Onboarding-Daten werden gespeichert

## Gespeicherte Daten

Alle Onboarding-Daten werden jetzt korrekt in der `companies`-Tabelle gespeichert:

### 1. Branche (Step 0)
- **Feld**: `industry` (text)
- **Gespeichert in**: `BrancheSelector` → `CompanyLayout` → `updateStep`
- **Format**: Lesbarer Name (z.B. "Handwerk", "IT", "Gesundheit")

### 2. Zielgruppen (Step 1)
- **Feld**: `target_groups` (text[])
- **Gespeichert in**: `TargetGroupSelector` → `CompanyLayout` → `updateStep`
- **Format**: Array von Zielgruppen (z.B. ["Azubis", "Praktikanten"])

### 3. Plan (Step 2)
- **Felder**: 
  - `selected_plan_id` (text) - z.B. "basic", "growth", "enterprise"
  - `plan_interval` (text) - "month" oder "year"
- **Gespeichert in**: 
  - `PlanSelector` → Direkt in DB vor Stripe Checkout
  - `updateStep` → Auch über Onboarding-Hook
- **Hinweis**: Plan wird gespeichert, auch wenn der Benutzer zu Stripe weitergeleitet wird

### 4. Logo/Titelbild (Step 3)
- **Feld**: `logo_url` (text)
- **Gespeichert in**: `ProfileCompletion` → Direkt in DB beim Upload
- **Storage**: Supabase Storage Bucket `company-assets` → `company-logos/`
- **Größenbeschränkung**: **KEINE** (Benutzer hat angefordert, dass Dateien größer als 5MB erlaubt sind)
- **Erlaubte Formate**: JPG, PNG, SVG, WEBP

### 5. Beschreibung (Step 3)
- **Feld**: `description` (text)
- **Gespeichert in**: `ProfileCompletion` → Direkt in DB beim Speichern
- **Validierung**: Mindestens 20 Zeichen empfohlen

## Datenfluss

```
BrancheSelector
  → onNext(industryKey)
  → CompanyLayout.handleNext({ industry })
  → useCompanyOnboarding.updateStep({ industry })
  → companies.industry ✅

TargetGroupSelector
  → onNext(targetGroups)
  → CompanyLayout.handleNext({ targetGroups })
  → useCompanyOnboarding.updateStep({ targetGroups })
  → companies.target_groups ✅

PlanSelector
  → handleSelectPlan(planKey, selectedInterval)
  → Direkt: companies.selected_plan_id + plan_interval ✅
  → Dann: Stripe Checkout Redirect

ProfileCompletion
  → handleLogoUpload() → companies.logo_url ✅
  → handleSave() → companies.description ✅
```

## Wichtige Änderungen

1. **Logo-Upload**: Keine Größenbeschränkung mehr (war 5MB, jetzt unbegrenzt)
2. **Plan-Speicherung**: Plan wird gespeichert, bevor zu Stripe weitergeleitet wird
3. **Plan-Interval**: Wird jetzt auch gespeichert (`plan_interval`)

## Datenbank-Felder

Stelle sicher, dass diese Felder in der `companies`-Tabelle existieren:
- `industry` (text)
- `target_groups` (text[])
- `selected_plan_id` (text)
- `plan_interval` (text)
- `logo_url` (text)
- `description` (text)
- `onboarding_completed_steps` (integer[])
- `onboarding_skipped_steps` (integer[])

## Testen

1. **Branche auswählen** → Prüfe `companies.industry`
2. **Zielgruppen auswählen** → Prüfe `companies.target_groups`
3. **Plan auswählen** → Prüfe `companies.selected_plan_id` und `plan_interval`
4. **Logo hochladen** → Prüfe `companies.logo_url` und Supabase Storage
5. **Beschreibung eingeben** → Prüfe `companies.description`

Alle Daten sollten jetzt korrekt gespeichert werden! ✅

