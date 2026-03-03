# Stripe Webhook Konfiguration - Prüfung

## ✅ Was ich sehe:

Du hast **2 Webhook-Endpunkte** konfiguriert:

1. **"memorable-radiance-thin"** - 15 Ereignisse
2. **"BeVisiblle"** - 18 Ereignisse

Beide zeigen auf die gleiche URL:
```
https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/stripe-webhook
```

## ⚠️ Empfehlung:

**Du brauchst nur EINEN Webhook-Endpunkt!**

Da beide auf die gleiche URL zeigen, solltest du einen davon löschen, um Verwirrung zu vermeiden.

**Empfehlung:** Behalte "BeVisiblle" (18 Ereignisse) und lösche "memorable-radiance-thin"

## ✅ Prüfe ob die Events korrekt sind:

Der Webhook sollte folgende Events überwachen:

### WICHTIGE Events (müssen vorhanden sein):
- ✅ `checkout.session.completed` - Für Plan-Upgrades
- ✅ `customer.subscription.updated` - Für Subscription-Updates
- ✅ `invoice.payment_succeeded` - Für monatliche Token-Gutschrift

### Optionale Events:
- `customer.subscription.deleted` - Für Kündigungen
- `invoice.payment_failed` - Für fehlgeschlagene Zahlungen

## 🔍 So prüfst du die Events:

1. Klicke auf den Webhook "BeVisiblle"
2. Scrolle zu "Ereignisse" oder "Events"
3. Prüfe ob diese Events ausgewählt sind:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`

## 📋 Checkliste:

- [x] Webhook URL ist korrekt: `https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/stripe-webhook`
- [x] Status ist "Aktiv"
- [ ] Nur EIN Webhook-Endpunkt (einen löschen)
- [ ] Events sind korrekt konfiguriert
- [ ] Webhook Secret in Supabase Secrets gespeichert als `STRIPE_WEBHOOK_SECRET`

## 🧪 Testen:

Nach der Konfiguration kannst du testen:

1. **Test Event senden:**
   - Im Stripe Webhook-Detail → "Test senden"
   - Wähle `checkout.session.completed`
   - Prüfe ob die Edge Function aufgerufen wird

2. **Echten Plan-Upgrade testen:**
   - Im Dashboard → "Plan upgraden"
   - Führe Checkout durch
   - Prüfe in Supabase ob Subscription erstellt wurde

