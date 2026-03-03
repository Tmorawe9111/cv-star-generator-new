# Quick Start: Stripe Edge Functions deployen

## 🚀 Schnellstart (5 Minuten)

### 1. Stripe Secret Key hinzufügen

```bash
# In Supabase Dashboard:
# Project Settings → Edge Functions → Secrets
# Füge hinzu: STRIPE_SECRET_KEY=sk_test_...
```

### 2. Edge Functions deployen

```bash
cd /Users/toddmorawe/cv-star-generator

# Login (falls noch nicht geschehen)
supabase login

# Link zum Projekt
supabase link --project-ref koymmvuhcxlvcuoyjnvv

# Deploye beide Functions
supabase functions deploy stripe-checkout
supabase functions deploy stripe-token-checkout
```

### 3. Stripe Price IDs konfigurieren

**Option A: Via Secrets (Empfohlen)**
```bash
# In Supabase Dashboard → Edge Functions → Secrets

# Für Plans (stripe-checkout):
STRIPE_PRICE_BASIC_MONTH=price_xxx
STRIPE_PRICE_BASIC_YEAR=price_xxx
STRIPE_PRICE_GROWTH_MONTH=price_xxx
STRIPE_PRICE_GROWTH_YEAR=price_xxx
STRIPE_PRICE_BEVIS_MONTH=price_xxx
STRIPE_PRICE_BEVIS_YEAR=price_xxx

# Für Tokens (stripe-token-checkout):
STRIPE_PRICE_TOKENS_15=price_xxx
STRIPE_PRICE_TOKENS_45=price_xxx
STRIPE_PRICE_TOKENS_100=price_xxx
```

**Option B: Direkt in den Functions**
- `supabase/functions/stripe-checkout/index.ts` (Zeile 13-28) - Plans
- `supabase/functions/stripe-token-checkout/index.ts` (Zeile 10-14) - Tokens

### 4. Fertig! 🎉

Die Stripe-Integration ist jetzt aktiv. Wenn ein Benutzer im Onboarding einen Plan auswählt, wird er zu Stripe Checkout weitergeleitet.

## 📝 Stripe Price IDs finden

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com)
2. **Products** → Wähle ein Produkt
3. Kopiere die **Price ID** (beginnt mit `price_...`)

## ✅ Testen

1. Starte deine App: `npm run dev`
2. **Plan-Kauf testen:**
   - Gehe durch das Onboarding
   - Wähle einen Plan aus
   - Du solltest zu Stripe Checkout weitergeleitet werden
3. **Token-Kauf testen:**
   - Gehe zu `/company/billing-v2`
   - Klicke auf "Tokens kaufen"
   - Wähle ein Token-Paket
   - Du solltest zu Stripe Checkout weitergeleitet werden

## 🔧 Troubleshooting

**"Function not found"**
- Prüfe, ob die Functions deployed wurden: `supabase functions list`
- Prüfe, ob die Namen korrekt sind: `stripe-checkout` und `stripe-token-checkout`

**"STRIPE_SECRET_KEY not configured"**
- Prüfe Supabase Dashboard → Edge Functions → Secrets
- Stelle sicher, dass der Secret Name exakt `STRIPE_SECRET_KEY` ist

**"plan not supported"**
- Prüfe, ob der Plan-Key korrekt ist (basic, growth, bevis)
- Prüfe die Logs: `supabase functions logs stripe-checkout`

## 📚 Weitere Infos

Siehe `STRIPE_EDGE_FUNCTION_SETUP.md` für detaillierte Anleitung.

