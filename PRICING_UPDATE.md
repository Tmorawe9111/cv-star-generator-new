# ✅ Pricing-Strategie aktualisiert

## 📋 Neue Pläne

### Basic
- **Monatlich**: 379€
- **Jährlich**: 3.790€
- **Features**:
  - 30 Tokens inklusive (10 pro Monat)
  - 3 Branchen auswählbar
  - 3 Stellenanzeigen inklusive
  - Token-Nachkauf: 18€ pro Token
  - Max. 50 zusätzliche Tokens pro Monat kaufbar
  - CRM & Export-Funktion
  - 1 Standort
  - 1 Seat

### Growth
- **Monatlich**: 769€
- **Jährlich**: 7.690€
- **Features**:
  - 150 Tokens pro Monat inklusive
  - 10 Stellenanzeigen inklusive
  - Token-Nachkauf: 18€ pro Token
  - Max. 50 zusätzliche Tokens pro Monat kaufbar
  - Mehrere Branchen möglich
  - Mehrere Seats möglich
  - Mehrere Standorte möglich
  - CRM, Export, Team-Zugänge

### Enterprise
- **Monatlich**: 1.249€
- **Jährlich**: 12.490€
- **Features**:
  - Alles aus Growth
  - Unlimitierte Seats
  - Unlimitierte Standorte
  - Token pro Standort individuell steuerbar
  - 10+ Stellenanzeigen pro Standort
  - CRM, Teamrechte, Rollen
  - Export, Reporting
  - API & SSO optional

## 🔄 Änderungen

1. **BeVis & BeVis Pro entfernt** → Nur noch Basic, Growth, Enterprise
2. **Preise aktualisiert** → Neue Preise gemäß deiner Angaben
3. **Features überarbeitet** → Klarere, professionellere Formulierungen
4. **Wording verbessert** → Konsistente, verständliche Texte
5. **Token-Pakete** → 50/150/300 Tokens (statt 15/45/100)

## 📝 Nächste Schritte

### Stripe Price IDs zuordnen

Du hast noch **6 Price IDs** für die Pläne. Bitte im Stripe Dashboard prüfen:

1. Gehe zu: https://dashboard.stripe.com/products
2. Klicke auf jede Price ID und prüfe:
   - **Betrag** (379€, 769€, 1.249€ für monatlich / 3.790€, 7.690€, 12.490€ für jährlich)
   - **Abrechnungsperiode** (Monthly, Yearly)

Dann füge diese Secrets in Supabase hinzu:
```
STRIPE_PRICE_BASIC_MONTH = price_xxxxx
STRIPE_PRICE_BASIC_YEAR = price_xxxxx
STRIPE_PRICE_GROWTH_MONTH = price_xxxxx
STRIPE_PRICE_GROWTH_YEAR = price_xxxxx
STRIPE_PRICE_ENTERPRISE_MONTH = price_xxxxx
STRIPE_PRICE_ENTERPRISE_YEAR = price_xxxxx
```

## ✅ Bereits konfiguriert

- ✅ Token-Pakete: 50/150/300 Tokens mit Price IDs
- ✅ Plans-Struktur aktualisiert
- ✅ Alle Komponenten aktualisiert
- ✅ Edge Functions deployed
- ✅ Wording verbessert

## 🧪 Testen

1. **Onboarding**: `/signup/company` → Plan-Auswahl sollte Basic/Growth/Enterprise zeigen
2. **Billing Page**: `/company/billing-v2` → Alle Pläne sollten korrekt angezeigt werden
3. **Token-Kauf**: Sollte jetzt mit 50/150/300 Tokens funktionieren

