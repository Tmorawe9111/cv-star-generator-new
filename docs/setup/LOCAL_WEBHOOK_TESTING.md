# Lokale Webhook-Tests mit Stripe

## 🚀 Setup für lokale Tests

### Option 1: Stripe CLI (Empfohlen)

Die Stripe CLI leitet Webhooks von Stripe zu deinem lokalen Server weiter.

#### 1. Stripe CLI installieren

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Andere Systeme:**
- [Stripe CLI Download](https://stripe.com/docs/stripe-cli)

#### 2. Stripe CLI authentifizieren

```bash
stripe login
```

#### 3. Lokalen Webhook-Listener starten

```bash
# Leite Webhooks zu deinem lokalen Supabase weiter
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

**Oder wenn du Supabase lokal laufen hast:**
```bash
# Prüfe deine lokale Supabase URL
supabase status

# Dann:
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

#### 4. Webhook Secret kopieren

Nach dem Start von `stripe listen` wird ein **Webhook Secret** angezeigt, z.B.:
```
> Ready! Your webhook signing secret is whsec_xxxxx
```

**Dieses Secret in deine lokale `.env` oder Supabase Secrets speichern:**
```bash
# In Supabase lokal
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 5. Test-Event senden

In einem **neuen Terminal**:
```bash
# Teste checkout.session.completed
stripe trigger checkout.session.completed

# Teste invoice.payment_succeeded
stripe trigger invoice.payment_succeeded

# Teste customer.subscription.updated
stripe trigger customer.subscription.updated
```

### Option 2: Lokale Supabase Edge Function testen

#### 1. Supabase lokal starten

```bash
supabase start
```

#### 2. Edge Function lokal deployen

```bash
supabase functions serve stripe-webhook
```

#### 3. Stripe CLI mit lokaler URL

```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

## 🔧 Webhook Secret für lokale Tests

**Wichtig:** Für lokale Tests brauchst du ein **anderes** Webhook Secret als für Production!

1. **Lokal**: Verwende das Secret von `stripe listen` (beginnt mit `whsec_`)
2. **Production**: Verwende das Secret aus dem Stripe Dashboard

## 📋 Lokale Test-Checkliste

- [ ] Stripe CLI installiert
- [ ] `stripe login` ausgeführt
- [ ] Supabase lokal gestartet (`supabase start`)
- [ ] `stripe listen` läuft
- [ ] Webhook Secret in lokale Secrets gespeichert
- [ ] Test-Event gesendet (`stripe trigger`)
- [ ] Edge Function Logs geprüft

## 🧪 Test-Szenarien

### Test 1: Plan-Upgrade simulieren

```bash
# 1. Erstelle Test-Checkout Session
stripe trigger checkout.session.completed

# 2. Prüfe in Supabase ob Subscription erstellt wurde
# (In Supabase SQL Editor)
SELECT * FROM public.subscriptions ORDER BY created_at DESC LIMIT 1;
```

### Test 2: Monatliche Token-Gutschrift simulieren

```bash
# 1. Simuliere erfolgreiche Rechnung
stripe trigger invoice.payment_succeeded

# 2. Prüfe ob Tokens gutgeschrieben wurden
SELECT active_tokens, last_token_grant_at FROM public.companies WHERE id = 'DEINE_COMPANY_ID';
```

## 🐛 Troubleshooting

### Problem: "Webhook signing secret not found"
- ✅ Prüfe ob `STRIPE_WEBHOOK_SECRET` in Supabase Secrets gespeichert ist
- ✅ Verwende das Secret von `stripe listen` (nicht das aus Stripe Dashboard)

### Problem: "Connection refused"
- ✅ Prüfe ob Supabase lokal läuft: `supabase status`
- ✅ Prüfe ob Edge Function läuft: `supabase functions serve stripe-webhook`
- ✅ Prüfe ob Port korrekt ist (standardmäßig 54321)

### Problem: Webhook wird nicht empfangen
- ✅ Prüfe ob `stripe listen` läuft
- ✅ Prüfe Edge Function Logs: `supabase functions logs stripe-webhook`
- ✅ Prüfe ob URL in `stripe listen` korrekt ist

## 📝 Wichtige Unterschiede: Lokal vs. Production

| Aspekt | Lokal | Production |
|--------|-------|------------|
| Webhook URL | `http://localhost:54321/...` | `https://koymmvuhcxlvcuoyjnvv.supabase.co/...` |
| Webhook Secret | Von `stripe listen` | Von Stripe Dashboard |
| Stripe Mode | Test Mode | Test/Production Mode |
| Supabase | Lokal (`supabase start`) | Cloud (Supabase Dashboard) |

## ✅ Nächste Schritte

1. **Lokal testen** mit Stripe CLI
2. **Wenn alles funktioniert**: Webhook in Stripe Dashboard für Production konfigurieren
3. **Production Webhook Secret** in Supabase Cloud Secrets speichern

