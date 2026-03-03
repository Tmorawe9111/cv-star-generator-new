# Stripe Edge Function Setup - Anleitung

## ✅ Was wurde erstellt

1. **Supabase Edge Function**: `supabase/functions/stripe-checkout/index.ts`
   - Erstellt Stripe Checkout Sessions für Plan-Upgrades
   - Verwaltet Stripe Customers
   - Integriert mit Supabase

2. **PlanSelector aktualisiert**: Verwendet jetzt die Edge Function

## 🚀 Deployment-Schritte

### 1. Stripe Secret Key konfigurieren

In Supabase Dashboard:
1. Gehe zu **Project Settings** → **Edge Functions** → **Secrets**
2. Füge hinzu:
   ```
   STRIPE_SECRET_KEY=sk_test_... (oder sk_live_... für Production)
   ```

### 2. Stripe Price IDs konfigurieren (Optional)

Falls deine Price IDs anders sind als die Defaults, füge diese Secrets hinzu:
```
STRIPE_PRICE_BASIC_MONTH=price_...
STRIPE_PRICE_BASIC_YEAR=price_...
STRIPE_PRICE_GROWTH_MONTH=price_...
STRIPE_PRICE_GROWTH_YEAR=price_...
STRIPE_PRICE_BEVIS_MONTH=price_...
STRIPE_PRICE_BEVIS_YEAR=price_...
```

**Oder** aktualisiere die Price IDs direkt in der Edge Function (`index.ts` Zeile 10-24).

### 3. APP_URL konfigurieren (Optional)

Falls deine App-URL anders ist:
```
APP_URL=https://deine-app.de
```

Standard: Wird automatisch aus `SUPABASE_URL` abgeleitet.

### 4. Edge Function deployen

```bash
cd /Users/toddmorawe/cv-star-generator

# Login zu Supabase (falls noch nicht geschehen)
supabase login

# Link zum Projekt (falls noch nicht geschehen)
supabase link --project-ref koymmvuhcxlvcuoyjnvv

# Deploye die Edge Function
supabase functions deploy stripe-checkout
```

### 5. Testen

Nach dem Deployment kannst du die Function testen:

```bash
# Test mit curl
curl -X POST \
  'https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/stripe-checkout' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "companyId": "your-company-id",
    "plan": "growth",
    "interval": "month"
  }'
```

## 🔧 Lokales Testen

Für lokales Testen:

```bash
# Starte Supabase lokal
supabase start

# Teste die Function lokal
supabase functions serve stripe-checkout

# In einem anderen Terminal:
curl -X POST \
  'http://localhost:54321/functions/v1/stripe-checkout' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "companyId": "test-company-id",
    "plan": "growth",
    "interval": "month"
  }'
```

## 📋 Stripe Dashboard Setup

### 1. Produkte & Preise erstellen

Im Stripe Dashboard:
1. Gehe zu **Products**
2. Erstelle Produkte für jeden Plan:
   - **Basic Plan** (Monatlich & Jährlich)
   - **Growth Plan** (Monatlich & Jährlich)
   - **BeVisiblle Plan** (Monatlich & Jährlich)

3. Kopiere die **Price IDs** und aktualisiere:
   - Entweder die Secrets in Supabase
   - Oder direkt in `stripe-checkout/index.ts`

### 2. Webhook einrichten

Für automatische Subscription-Updates:

1. Gehe zu **Developers** → **Webhooks**
2. Klicke **Add endpoint**
3. URL: `https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/stripe-webhook`
4. Events auswählen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`

5. Webhook Secret kopieren und als Secret speichern:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 🔍 Troubleshooting

### "STRIPE_SECRET_KEY not configured"
- Prüfe, ob der Secret in Supabase Dashboard gesetzt ist
- Prüfe, ob die Function deployed wurde

### "plan not supported"
- Prüfe, ob der Plan-Key korrekt ist (basic, growth, bevis)
- Prüfe, ob die Price IDs in der Function korrekt sind

### "company not found"
- Prüfe, ob die `companyId` korrekt ist
- Prüfe, ob die Company in der Datenbank existiert

### CORS Fehler
- Die Function hat bereits CORS-Header
- Prüfe, ob die Function korrekt deployed wurde

## ✅ Nach erfolgreichem Setup

1. **Teste im Onboarding**: Wähle einen Plan im Onboarding-Flow
2. **Stripe Checkout öffnet sich**: Du wirst zu Stripe weitergeleitet
3. **Nach Zahlung**: Wirst du zurück zu `/company/billing-v2?upgrade=success` geleitet
4. **Subscription wird aktiviert**: Via Webhook (falls eingerichtet)

## 📝 Nächste Schritte

1. **Webhook Function erstellen**: Für automatische Subscription-Updates
2. **Success/Cancel Pages**: Verbessern der Rückkehr-URLs
3. **Error Handling**: Verbessern der Fehlerbehandlung

Soll ich auch eine Webhook-Function erstellen?

