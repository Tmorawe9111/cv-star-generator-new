# Stripe Price IDs Konfiguration

## Problem
Die Stripe Price IDs müssen in Supabase Secrets konfiguriert werden, damit die Edge Function `stripe-checkout` funktioniert.

## Schritt 1: Price IDs im Stripe Dashboard erstellen

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigiere zu **Products** → **Add Product**
3. Erstelle für jeden Plan (Basic, Growth, Enterprise) und jedes Intervall (Monatlich, Jährlich) ein Product mit Price:

### Basic Plan - Monatlich
- **Name**: Basic Plan (Monthly)
- **Price**: 379€
- **Billing period**: Monthly (recurring)
- **Price ID**: Kopiere die Price ID (beginnt mit `price_`)

### Basic Plan - Jährlich
- **Name**: Basic Plan (Yearly)
- **Price**: 3790€
- **Billing period**: Yearly (recurring)
- **Price ID**: Kopiere die Price ID (beginnt mit `price_`)

### Growth Plan - Monatlich
- **Name**: Growth Plan (Monthly)
- **Price**: 769€
- **Billing period**: Monthly (recurring)
- **Price ID**: Kopiere die Price ID (beginnt mit `price_`)

### Growth Plan - Jährlich
- **Name**: Growth Plan (Yearly)
- **Price**: 7690€
- **Billing period**: Yearly (recurring)
- **Price ID**: Kopiere die Price ID (beginnt mit `price_`)

### Enterprise Plan - Monatlich
- **Name**: Enterprise Plan (Monthly)
- **Price**: 1249€
- **Billing period**: Monthly (recurring)
- **Price ID**: Kopiere die Price ID (beginnt mit `price_`)

### Enterprise Plan - Jährlich
- **Name**: Enterprise Plan (Yearly)
- **Price**: 12490€
- **Billing period**: Yearly (recurring)
- **Price ID**: Kopiere die Price ID (beginnt mit `price_`)

## Schritt 2: Price IDs in Supabase Secrets konfigurieren

1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets)
2. Klicke auf **Add Secret**
3. Füge die folgenden Secrets hinzu:

```
STRIPE_PRICE_BASIC_MONTH = price_xxxxx (deine Basic Monthly Price ID)
STRIPE_PRICE_BASIC_YEAR = price_xxxxx (deine Basic Yearly Price ID)
STRIPE_PRICE_GROWTH_MONTH = price_xxxxx (deine Growth Monthly Price ID)
STRIPE_PRICE_GROWTH_YEAR = price_xxxxx (deine Growth Yearly Price ID)
STRIPE_PRICE_ENTERPRISE_MONTH = price_xxxxx (deine Enterprise Monthly Price ID)
STRIPE_PRICE_ENTERPRISE_YEAR = price_xxxxx (deine Enterprise Yearly Price ID)
```

## Schritt 3: Edge Function neu deployen (optional)

Nach dem Hinzufügen der Secrets sollte die Edge Function automatisch die neuen Werte verwenden. Falls nicht:

```bash
supabase functions deploy stripe-checkout
```

## Schritt 4: Testen

1. Versuche einen Plan im Frontend auszuwählen
2. Prüfe die Browser-Konsole auf Fehler
3. Die Checkout-Session sollte erfolgreich erstellt werden

## Wichtige Hinweise

- **Price IDs müssen mit `price_` beginnen**
- **Jede Price ID muss eindeutig sein**
- **Die Price IDs müssen im Stripe Dashboard aktiv sein**
- **Nach dem Hinzufügen der Secrets kann es einige Sekunden dauern, bis sie verfügbar sind**

## Troubleshooting

### Fehler: "Stripe Price ID nicht gefunden"
- Prüfe, ob die Price ID im Stripe Dashboard existiert
- Prüfe, ob die Price ID in Supabase Secrets korrekt konfiguriert ist
- Prüfe, ob der Secret-Name korrekt ist (Groß-/Kleinschreibung beachten)

### Fehler: "Stripe Price ID nicht konfiguriert"
- Die Price ID ist leer oder nicht gesetzt
- Prüfe Supabase Secrets auf korrekte Konfiguration
- Stelle sicher, dass der Secret-Name exakt übereinstimmt
