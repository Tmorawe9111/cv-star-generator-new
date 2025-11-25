# 🚀 Deployment - Einfache Anleitung

## ✅ Voraussetzungen (bereits erfüllt)

- ✅ Supabase CLI installiert (v2.47.2)
- ✅ Projekt verlinkt (koymmvuhcxlvcuoyjnvv - "Ausbildungsbasis")

## 📋 Deployment in 3 Schritten

### Schritt 1: Stripe Secret Key hinzufügen

**Im Supabase Dashboard:**
1. Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/functions
2. Klicke auf **Secrets** Tab
3. Klicke **Add new secret**
4. Name: `STRIPE_SECRET_KEY`
5. Value: Dein Stripe Secret Key (`sk_test_...` für Test)
6. Klicke **Save**

**Oder via Terminal:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_dein_key_hier
```

### Schritt 2: Edge Functions deployen

**Option A: Automatisch (Empfohlen)**
```bash
cd /Users/toddmorawe/cv-star-generator
./DEPLOY_NOW.sh
```

**Option B: Manuell**
```bash
cd /Users/toddmorawe/cv-star-generator

# Deploye beide Functions
supabase functions deploy stripe-checkout
supabase functions deploy stripe-token-checkout
```

### Schritt 3: Fertig! 🎉

Die Functions sind jetzt deployed. Du kannst sie testen:

1. **Plan-Kauf testen**: Onboarding → Plan auswählen
2. **Token-Kauf testen**: Billing-V2 → "Tokens kaufen"

## 🔧 Stripe Price IDs konfigurieren (Optional)

Falls deine Stripe Price IDs anders sind:

**Via Dashboard:**
- Gehe zu Edge Functions → Secrets
- Füge die Price IDs hinzu (siehe `QUICK_START_STRIPE.md`)

**Oder direkt in den Functions:**
- `supabase/functions/stripe-checkout/index.ts` (Zeile 13-28)
- `supabase/functions/stripe-token-checkout/index.ts` (Zeile 10-14)

## ✅ Verifizierung

```bash
# Liste alle Functions
supabase functions list

# Prüfe Logs
supabase functions logs stripe-checkout
supabase functions logs stripe-token-checkout
```

## 🐛 Probleme?

**"STRIPE_SECRET_KEY not configured"**
→ Prüfe Supabase Dashboard → Edge Functions → Secrets

**"Function not found"**
→ Prüfe, ob die Functions deployed wurden: `supabase functions list`

**"Deployment failed"**
→ Prüfe die Logs: `supabase functions logs stripe-checkout --debug`

