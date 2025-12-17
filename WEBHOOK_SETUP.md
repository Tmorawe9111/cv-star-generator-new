# 🔗 Stripe Webhook Setup - Konfiguration

## 📋 Webhook Secrets

Du hast zwei Webhook Secrets von Stripe erhalten:

1. **Secret 1**: `whsec_O0cfUmcFm5klcGLtvIGREYcHInohyF1M`
2. **Secret 2**: `whsec_zmVCkp58PD5X2WokAEAuGqdYSvp7JD0o`

## 🔧 Environment Variables Setup

### Für Next.js / Vercel / Netlify

Setze die folgenden Environment Variables in deinem Deployment:

```bash
# Primary Webhook Secret (für /api/billing-v2/webhook)
STRIPE_WEBHOOK_SECRET=whsec_O0cfUmcFm5klcGLtvIGREYcHInohyF1M

# Alternative Webhook Secret (für /api/stripe/webhook oder Test)
STRIPE_WEBHOOK_SECRET_ALT=whsec_zmVCkp58PD5X2WokAEAuGqdYSvp7JD0o
```

### Für lokale Entwicklung

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```bash
STRIPE_WEBHOOK_SECRET=whsec_O0cfUmcFm5klcGLtvIGREYcHInohyF1M
STRIPE_WEBHOOK_SECRET_ALT=whsec_zmVCkp58PD5X2WokAEAuGqdYSvp7JD0o
```

## 🌐 Webhook Endpoint URLs

### Production (empfohlen)

**Hauptendpoint (billing-v2):**
```
https://deine-domain.de/api/billing-v2/webhook
```

**Alternativer Endpoint (legacy):**
```
https://deine-domain.de/api/stripe/webhook
```

### Lokale Tests mit Stripe CLI

```bash
# Terminal 1: Starte Stripe CLI
stripe listen --forward-to localhost:8080/api/billing-v2/webhook

# Terminal 2: Starte deine App
npm run dev
```

Die Stripe CLI gibt dir einen temporären Webhook Secret für lokale Tests.

## 📝 Stripe Dashboard Konfiguration

### Webhook Endpoint 1 (billing-v2)

1. Gehe zu **Stripe Dashboard** → **Developers** → **Webhooks**
2. Klicke **Add endpoint**
3. **Endpoint URL**: `https://deine-domain.de/api/billing-v2/webhook`
4. **Description**: "Billing V2 - Plan Upgrades & Token Purchases"
5. **Events auswählen**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
6. **Webhook Secret**: `whsec_O0cfUmcFm5klcGLtvIGREYcHInohyF1M`

### Webhook Endpoint 2 (legacy/stripe)

1. Gehe zu **Stripe Dashboard** → **Developers** → **Webhooks**
2. Klicke **Add endpoint**
3. **Endpoint URL**: `https://deine-domain.de/api/stripe/webhook`
4. **Description**: "Legacy Stripe Webhook"
5. **Events auswählen**:
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
6. **Webhook Secret**: `whsec_zmVCkp58PD5X2WokAEAuGqdYSvp7JD0o`

## ✅ Verifikation

Nach dem Setup kannst du die Webhooks testen:

1. **Stripe Dashboard** → **Webhooks** → Klicke auf einen Endpoint
2. Klicke **Send test webhook**
3. Wähle ein Event (z.B. `checkout.session.completed`)
4. Prüfe die Logs in deiner App

## 🔍 Troubleshooting

### "Webhook signature verification failed"

- Prüfe, ob `STRIPE_WEBHOOK_SECRET` korrekt gesetzt ist
- Prüfe, ob der Secret im Stripe Dashboard mit dem in deiner App übereinstimmt
- Stelle sicher, dass der Request-Body nicht modifiziert wurde (z.B. durch Middleware)

### "STRIPE_WEBHOOK_SECRET not configured"

- Stelle sicher, dass die Environment Variable gesetzt ist
- Für Vercel: Prüfe **Settings** → **Environment Variables**
- Für Netlify: Prüfe **Site settings** → **Environment variables**

### Webhook wird nicht empfangen

- Prüfe, ob die URL öffentlich erreichbar ist (nicht localhost)
- Für lokale Tests: Verwende Stripe CLI (`stripe listen`)
- Prüfe die Logs in Stripe Dashboard → **Webhooks** → **Recent deliveries**

## 📌 Wichtige Hinweise

1. **Niemals** die Webhook Secrets im Code committen
2. **Immer** HTTPS für Production verwenden (Stripe erlaubt kein HTTP)
3. **Test-Modus**: Verwende Test-Keys und Test-Webhook Secrets
4. **Live-Modus**: Verwende Live-Keys und Live-Webhook Secrets

## 🎯 Empfehlung

- **Verwende `/api/billing-v2/webhook`** als Hauptendpoint (unterstützt Plan-Upgrades)
- **Verwende `/api/stripe/webhook`** nur für Legacy-Support oder als Backup

