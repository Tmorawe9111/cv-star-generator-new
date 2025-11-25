# ✅ Onboarding-Daten werden im Profil angezeigt

## Was wird im Profil angezeigt

Alle Onboarding-Daten werden jetzt im Unternehmensprofil angezeigt:

### 1. Logo/Titelbild (logo_url)
- **Anzeige**: Im `CompanyProfileHeader` als Avatar
- **Speicherort**: `companies.logo_url`
- **Status**: ✅ Wird angezeigt

### 2. Beschreibung (description)
- **Anzeige**: 
  - Im `CompanyProfileHeader` als Tagline (erste 150 Zeichen)
  - Im `CompanyAboutTab` als vollständige Beschreibung
- **Speicherort**: `companies.description`
- **Status**: ✅ Wird angezeigt

### 3. Branche (industry)
- **Anzeige**: 
  - Im `CompanyProfileHeader` unter dem Namen
  - Im `CompanyAboutTab` im "Branche & Zielgruppen" Card
- **Speicherort**: `companies.industry`
- **Status**: ✅ Wird angezeigt

### 4. Zielgruppen (target_groups)
- **Anzeige**: 
  - Im `CompanyProfileHeader` unter dem Namen (wenn vorhanden)
  - Im `CompanyAboutTab` im "Branche & Zielgruppen" Card
- **Speicherort**: `companies.target_groups` (text[])
- **Status**: ✅ Wird jetzt angezeigt (neu hinzugefügt)

### 5. Plan (selected_plan_id + plan_interval)
- **Anzeige**: Nicht im öffentlichen Profil (nur intern in Billing)
- **Speicherort**: `companies.selected_plan_id` und `companies.plan_interval`
- **Status**: ✅ Wird gespeichert, aber nicht im Profil angezeigt (sinnvoll)

## Änderungen

1. **CompanyProfileHeader**: Zeigt jetzt auch `target_groups` an
2. **CompanyAboutTab**: Neues "Branche & Zielgruppen" Card mit `industry` und `target_groups`
3. **Company Interface**: `target_groups`, `selected_plan_id`, `plan_interval` hinzugefügt
4. **Profile.tsx**: Übergibt `target_groups` an beide Komponenten

## Datenfluss

```
Onboarding
  → Daten werden in companies-Tabelle gespeichert
  → useCompany Hook lädt alle Daten
  → Profile.tsx übergibt Daten an Komponenten
  → CompanyProfileHeader zeigt Logo, Beschreibung, Branche, Zielgruppen
  → CompanyAboutTab zeigt vollständige Beschreibung, Branche, Zielgruppen
```

## Testen

1. **Onboarding durchführen** → Alle Daten eingeben
2. **Profil öffnen** → `/company/profile`
3. **Prüfen**:
   - Logo wird angezeigt ✅
   - Beschreibung wird angezeigt ✅
   - Branche wird angezeigt ✅
   - Zielgruppen werden angezeigt ✅

Alle Onboarding-Daten werden jetzt im Profil angezeigt! ✅

