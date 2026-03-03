# Deployment-Anleitung: Stripe Edge Functions

## 📋 Schritt-für-Schritt Anleitung

### Schritt 1: Supabase CLI installieren (falls noch nicht vorhanden)

```bash
# macOS
brew install supabase/tap/supabase

# Oder mit npm
npm install -g supabase

# Prüfe Installation
supabase --version
```

### Schritt 2: Bei Supabase einloggen

```bash
cd /Users/toddmorawe/cv-star-generator
supabase login
```

Dies öffnet einen Browser, wo du dich mit deinem Supabase-Account einloggst.

### Schritt 3: Projekt verlinken

```bash
supabase link --project-ref koymmvuhcxlvcuoyjnvv
```

**Hinweis**: Falls du die Project-Ref nicht kennst:
- Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
- Wähle dein Projekt
- Die Project-Ref findest du in den Project Settings (z.B. `koymmvuhcxlvcuoyjnvv`)

### Schritt 4: Stripe Secret Key konfigurieren

**Im Supabase Dashboard:**
1. Gehe zu **Project Settings** → **Edge Functions** → **Secrets**
2. Klicke auf **Add new secret**
3. Name: `STRIPE_SECRET_KEY`
4. Value: Dein Stripe Secret Key (z.B. `sk_test_...` für Test, `sk_live_...` für Production)
5. Klicke **Save**

**Oder via CLI:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

### Schritt 5: Stripe Price IDs konfigurieren (Optional)

Falls deine Stripe Price IDs anders sind als die Defaults:

**Via Dashboard:**
- Gehe zu **Edge Functions** → **Secrets**
- Füge hinzu:
  - `STRIPE_PRICE_BASIC_MONTH=price_...`
  - `STRIPE_PRICE_BASIC_YEAR=price_...`
  - `STRIPE_PRICE_GROWTH_MONTH=price_...`
  - `STRIPE_PRICE_GROWTH_YEAR=price_...`
  - `STRIPE_PRICE_BEVIS_MONTH=price_...`
  - `STRIPE_PRICE_BEVIS_YEAR=price_...`
  - `STRIPE_PRICE_TOKENS_15=price_...`
  - `STRIPE_PRICE_TOKENS_45=price_...`
  - `STRIPE_PRICE_TOKENS_100=price_...`

**Oder direkt in den Functions:**
- Öffne `supabase/functions/stripe-checkout/index.ts`
- Ersetze die Default Price IDs (Zeile 13-28)
- Öffne `supabase/functions/stripe-token-checkout/index.ts`
- Ersetze die Default Price IDs (Zeile 10-14)

### Schritt 6: Edge Functions deployen

```bash
cd /Users/toddmorawe/cv-star-generator

# Deploye beide Functions
supabase functions deploy stripe-checkout
supabase functions deploy stripe-token-checkout
```

**Oder beide auf einmal:**
```bash
supabase functions deploy stripe-checkout stripe-token-checkout
```

### Schritt 7: Deployment verifizieren

```bash
# Liste alle deployed Functions
supabase functions list

# Prüfe Logs einer Function
supabase functions logs stripe-checkout
supabase functions logs stripe-token-checkout
```

## ✅ Nach dem Deployment

### Testen der Functions

**Plan-Checkout testen:**
1. Starte deine App: `npm run dev`
2. Gehe durch das Onboarding
3. Wähle einen Plan aus
4. Du solltest zu Stripe Checkout weitergeleitet werden

**Token-Checkout testen:**
1. Gehe zu `/company/billing-v2`
2. Klicke auf "Tokens kaufen"
3. Wähle ein Token-Paket
4. Du solltest zu Stripe Checkout weitergeleitet werden

## 🔧 Troubleshooting

### "Command not found: supabase"
- Installiere Supabase CLI (siehe Schritt 1)

### "Not logged in"
- Führe `supabase login` aus

### "Project not linked"
- Führe `supabase link --project-ref YOUR_PROJECT_REF` aus

### "Function deployment failed"
- Prüfe die Logs: `supabase functions logs stripe-checkout`
- Prüfe, ob alle Secrets gesetzt sind
- Prüfe, ob die Function-Dateien existieren

### "STRIPE_SECRET_KEY not configured"
- Prüfe Supabase Dashboard → Edge Functions → Secrets
- Stelle sicher, dass der Secret Name exakt `STRIPE_SECRET_KEY` ist

## 📝 Alternative: Deployment via Supabase Dashboard

Falls die CLI nicht funktioniert, kannst du die Functions auch manuell deployen:

1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt
3. Gehe zu **Edge Functions**
4. Klicke auf **Create a new function**
5. Name: `stripe-checkout`
6. Kopiere den Inhalt von `supabase/functions/stripe-checkout/index.ts`
7. Füge Secrets hinzu (siehe Schritt 4)
8. Klicke **Deploy**
9. Wiederhole für `stripe-token-checkout`

## 🚀 Production Deployment

Für Production:
1. Verwende `sk_live_...` statt `sk_test_...`
2. Stelle sicher, dass alle Price IDs korrekt sind
3. Teste gründlich mit echten Stripe Test-Karten
4. Richte Webhooks ein für automatische Updates

## 📚 Weitere Infos

- Siehe `STRIPE_FUNCTIONS_SUMMARY.md` für Details zu den Functions
- Siehe `QUICK_START_STRIPE.md` für schnellen Überblick

