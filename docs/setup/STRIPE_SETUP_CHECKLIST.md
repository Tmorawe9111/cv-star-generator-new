# Stripe Setup Checkliste

## ✅ Schritt 1: STRIPE_SECRET_KEY konfigurieren

1. Gehe zu [Supabase Secrets](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets)
2. Prüfe, ob `STRIPE_SECRET_KEY` existiert
3. Falls nicht vorhanden oder falsch:
   - Klicke auf **Add Secret** (oder bearbeite das bestehende)
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: `sk_test_51SUSWXEn7Iw8aL2bRSt92aCoy2y55NaJbssxoRBc0t8rui2xOsAcA5kuFXZVmP1FnwVO9d0ccWuWP9bYQzrgzuiS00qj3lcvse`
   - Klicke auf **Save**

## ✅ Schritt 2: Price IDs aus Stripe Dashboard kopieren

1. Gehe zu [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Für jedes Produkt:

### BeVisiblle Basic:
- Klicke auf "BeVisiblle Basic"
- Klicke auf den **Monatlich** Preis (379€)
- Kopiere die **Price ID** (z.B. `price_1SUShuEn7Iw8aL2b1VLd5bzm`)
- Klicke auf den **Jährlich** Preis (3790€)
- Kopiere die **Price ID**

### BeVisiblle Growth:
- Klicke auf "BeVisiblle Growth"
- Klicke auf den **Monatlich** Preis (769€)
- Kopiere die **Price ID**
- Klicke auf den **Jährlich** Preis (7690€)
- Kopiere die **Price ID**

### BeVisiblle Enterprise:
- Klicke auf "BeVisiblle Enterprise"
- Klicke auf den **Monatlich** Preis (1249€)
- Kopiere die **Price ID**
- Klicke auf den **Jährlich** Preis (12490€)
- Kopiere die **Price ID**

## ✅ Schritt 3: Price IDs in Supabase Secrets eintragen

1. Gehe zu [Supabase Secrets](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets)
2. Für jede Price ID:

**STRIPE_PRICE_BASIC_MONTH**
- Name: `STRIPE_PRICE_BASIC_MONTH`
- Value: Price ID von Basic Monatlich (aus Schritt 2)

**STRIPE_PRICE_BASIC_YEAR**
- Name: `STRIPE_PRICE_BASIC_YEAR`
- Value: Price ID von Basic Jährlich (aus Schritt 2)

**STRIPE_PRICE_GROWTH_MONTH**
- Name: `STRIPE_PRICE_GROWTH_MONTH`
- Value: Price ID von Growth Monatlich (aus Schritt 2)

**STRIPE_PRICE_GROWTH_YEAR**
- Name: `STRIPE_PRICE_GROWTH_YEAR`
- Value: Price ID von Growth Jährlich (aus Schritt 2)

**STRIPE_PRICE_ENTERPRISE_MONTH**
- Name: `STRIPE_PRICE_ENTERPRISE_MONTH`
- Value: Price ID von Enterprise Monatlich (aus Schritt 2)

**STRIPE_PRICE_ENTERPRISE_YEAR**
- Name: `STRIPE_PRICE_ENTERPRISE_YEAR`
- Value: Price ID von Enterprise Jährlich (aus Schritt 2)

## ✅ Schritt 4: Edge Function neu deployen (optional)

Nach dem Konfigurieren der Secrets:

```bash
supabase functions deploy stripe-checkout
```

Oder warte 10-30 Sekunden, bis die Secrets automatisch geladen werden.

## ✅ Schritt 5: Testen

1. Versuche einen Plan im Frontend auszuwählen
2. Prüfe die Browser-Konsole auf Fehler
3. Prüfe die Logs in [Supabase Dashboard → Edge Functions → stripe-checkout → Logs](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/functions/stripe-checkout/logs)

## 🔍 Debugging

Falls es immer noch nicht funktioniert:

1. **Prüfe die Logs:**
   - Gehe zu Supabase Dashboard → Edge Functions → stripe-checkout → Logs
   - Suche nach den Debug-Logs, die ich hinzugefügt habe
   - Sie zeigen, welche Price IDs geladen werden

2. **Prüfe die Secrets:**
   - Stelle sicher, dass alle Secrets korrekt geschrieben sind
   - Keine Leerzeichen vor/nach den Werten
   - Exakte Groß-/Kleinschreibung beachten

3. **Prüfe Stripe:**
   - Stelle sicher, dass du im **Test Mode** bist
   - Prüfe, ob die Price IDs im Stripe Dashboard aktiv sind
   - Prüfe, ob die Preise korrekt sind (379€, 769€, etc.)

