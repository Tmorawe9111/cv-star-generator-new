# Token-Kauf Debugging

## ✅ Was ich behoben habe:

Die Token-Gutschrift-Logik wurde in `stripe-webhook/index.ts` hinzugefügt. Bei erfolgreichem Token-Kauf werden jetzt automatisch die Tokens gutgeschrieben.

## 🔍 So prüfst du ob es funktioniert:

### 1. Webhook wird empfangen?

**Prüfe Edge Function Logs:**
1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/functions)
2. Klicke auf `stripe-webhook`
3. Prüfe die Logs nach:
   - `Received Stripe event: checkout.session.completed`
   - `Token purchase completed: { companyId, packageId }`
   - `Added X tokens to company...`

### 2. Webhook Secret korrekt?

**Prüfe ob Webhook Secret gesetzt ist:**
```bash
# Lokal
supabase secrets list

# Sollte enthalten:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Tokens werden gutgeschrieben?

**Prüfe in Supabase SQL Editor:**
```sql
-- Prüfe aktuelle Token-Balance
SELECT id, name, active_tokens 
FROM public.companies 
WHERE id = 'DEINE_COMPANY_ID';

-- Prüfe ob Webhook Event empfangen wurde (in Logs)
-- Gehe zu Supabase Dashboard → Functions → stripe-webhook → Logs
```

## 🧪 Manueller Test

### Option 1: Stripe CLI (Lokal)

```bash
# 1. Starte Webhook Listener
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# 2. In neuem Terminal: Teste Token-Kauf Event
stripe trigger checkout.session.completed
```

### Option 2: Echter Test-Kauf

1. Gehe zum Dashboard
2. Klicke "Tokens nachkaufen"
3. Wähle ein Paket (z.B. 50 Tokens)
4. Führe Checkout durch
5. **Prüfe sofort:**
   - Edge Function Logs
   - Token-Balance in Datenbank

## 🐛 Häufige Probleme

### Problem: Webhook wird nicht empfangen

**Lösung:**
- ✅ Prüfe ob Webhook in Stripe Dashboard aktiv ist
- ✅ Prüfe ob URL korrekt ist: `https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/stripe-webhook`
- ✅ Prüfe ob `STRIPE_WEBHOOK_SECRET` in Supabase Secrets gesetzt ist
- ✅ Prüfe Webhook Logs in Stripe Dashboard (ob Event gesendet wurde)

### Problem: Webhook empfangen, aber Tokens nicht gutgeschrieben

**Lösung:**
- ✅ Prüfe Edge Function Logs auf Fehler
- ✅ Prüfe ob `companyId` und `packageId` in Metadata vorhanden sind
- ✅ Prüfe ob `active_tokens` Spalte in `companies` Tabelle existiert
- ✅ Prüfe ob Company existiert

### Problem: Falsche Token-Menge

**Lösung:**
- ✅ Prüfe ob `packageId` korrekt ist (t50, t150, t300)
- ✅ Prüfe Token-Mapping in Webhook-Funktion

## 📋 Debug-Checkliste

- [ ] Webhook ist in Stripe Dashboard aktiv
- [ ] Webhook URL ist korrekt
- [ ] `STRIPE_WEBHOOK_SECRET` ist in Supabase Secrets gesetzt
- [ ] Edge Function `stripe-webhook` ist deployed
- [ ] Test-Kauf durchgeführt
- [ ] Edge Function Logs geprüft
- [ ] Token-Balance in Datenbank geprüft

## 🔧 SQL Queries zum Debuggen

```sql
-- 1. Prüfe Company Token-Balance
SELECT id, name, active_tokens, stripe_customer_id
FROM public.companies
WHERE id = 'DEINE_COMPANY_ID';

-- 2. Prüfe ob Purchase gespeichert wurde (falls purchases_v2 Tabelle existiert)
SELECT * FROM public.purchases_v2
WHERE company_id = 'DEINE_COMPANY_ID'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Prüfe Subscription (falls vorhanden)
SELECT * FROM public.subscriptions
WHERE company_id = 'DEINE_COMPANY_ID';
```

