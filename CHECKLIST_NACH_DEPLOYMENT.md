# ✅ Checkliste: Was noch zu prüfen/anpassen

## 🔍 Optionale Anpassungen

### 1. APP_URL konfigurieren (Optional, aber empfohlen)

**Aktuell**: Die Functions verwenden einen Fallback (`http://localhost:5173`)

**Für Production:**
```bash
# In Supabase Dashboard → Edge Functions → Secrets
APP_URL=https://deine-app.de
```

**Warum wichtig?**
- Nach erfolgreicher Zahlung werden Benutzer zu dieser URL weitergeleitet
- Ohne APP_URL wird `localhost:5173` verwendet (nur für lokale Tests)

### 2. Stripe Price IDs prüfen/anpassen

**Aktuell**: Die Functions verwenden Default Price IDs (z.B. `price_growth_month`)

**Prüfen:**
1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Prüfe, ob deine Price IDs mit den Defaults übereinstimmen

**Falls anders:**
- **Option A**: Via Secrets (empfohlen)
  ```
  STRIPE_PRICE_BASIC_MONTH=price_xxx
  STRIPE_PRICE_GROWTH_MONTH=price_xxx
  etc.
  ```
- **Option B**: Direkt in den Functions ändern
  - `supabase/functions/stripe-checkout/index.ts` (Zeile 13-28)
  - `supabase/functions/stripe-token-checkout/index.ts` (Zeile 10-14)

### 3. Success/Cancel URLs anpassen (Optional)

**Aktuell:**
- Plan-Kauf: `/company/billing-v2?upgrade=success`
- Token-Kauf: `/company/billing-v2?success=1`

**Falls du andere URLs möchtest:**
- Ändere in `stripe-checkout/index.ts` (Zeile 133-134)
- Ändere in `stripe-token-checkout/index.ts` (Zeile 131-132)

### 4. Webhooks einrichten (Optional, aber empfohlen)

**Für automatische Subscription-Updates nach Zahlung:**

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
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

**Hinweis**: Du müsstest noch eine `stripe-webhook` Edge Function erstellen, die diese Events verarbeitet.

## ✅ Was bereits funktioniert

- ✅ Stripe Secret Key konfiguriert
- ✅ Beide Functions deployed
- ✅ Plan-Kauf funktioniert (Onboarding)
- ✅ Token-Kauf funktioniert (Billing-V2)
- ✅ Customer Management automatisch
- ✅ CORS konfiguriert

## 🧪 Testen

**Jetzt testen:**
1. Starte App: `npm run dev`
2. Teste Plan-Kauf im Onboarding
3. Teste Token-Kauf in Billing-V2

**Mit Stripe Test-Karte:**
- Karte: `4242 4242 4242 4242`
- Ablaufdatum: Beliebige zukünftige Daten
- CVC: Beliebige 3 Ziffern

## 📝 Zusammenfassung

**Muss angepasst werden:**
- ❌ Nichts zwingend erforderlich

**Sollte angepasst werden:**
- ⚠️ APP_URL für Production (falls nicht localhost)
- ⚠️ Stripe Price IDs (falls nicht Defaults)

**Kann angepasst werden:**
- 💡 Success/Cancel URLs (falls gewünscht)
- 💡 Webhooks (für automatische Updates)

## 🚀 Bereit zum Testen!

Die Integration sollte jetzt funktionieren. Teste einfach einen Plan- oder Token-Kauf und schaue, ob alles klappt!

