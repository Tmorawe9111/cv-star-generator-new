# Stripe Secrets in Supabase konfigurieren

## Wichtige Secrets, die konfiguriert werden müssen:

### 1. Stripe Secret Key (Test)
```
STRIPE_SECRET_KEY = sk_test_51SUSWXEn7Iw8aL2bRSt92aCoy2y55NaJbssxoRBc0t8rui2xOsAcA5kuFXZVmP1FnwVO9d0ccWuWP9bYQzrgzuiS00qj3lcvse
```

### 2. Stripe Price IDs (aus Stripe Dashboard kopieren)

Gehe zu [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products) und kopiere die Price IDs:

**BeVisiblle Basic:**
```
STRIPE_PRICE_BASIC_MONTH = price_xxxxx (379€ monatlich)
STRIPE_PRICE_BASIC_YEAR = price_xxxxx (3790€ jährlich)
```

**BeVisiblle Growth:**
```
STRIPE_PRICE_GROWTH_MONTH = price_xxxxx (769€ monatlich)
STRIPE_PRICE_GROWTH_YEAR = price_xxxxx (7690€ jährlich)
```

**BeVisiblle Enterprise:**
```
STRIPE_PRICE_ENTERPRISE_MONTH = price_xxxxx (1249€ monatlich)
STRIPE_PRICE_ENTERPRISE_YEAR = price_xxxxx (12490€ jährlich)
```

## So findest du die Price IDs:

1. Gehe zu [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Klicke auf "BeVisiblle Basic"
3. Du siehst die Preise für dieses Produkt
4. Klicke auf einen Preis
5. Die **Price ID** steht oben rechts (z.B. `price_1SUShuEn7Iw8aL2b1VLd5bzm`)
6. Kopiere die komplette Price ID

## In Supabase Secrets eintragen:

1. Gehe zu [Supabase Secrets](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets)
2. Für jedes Secret:
   - Klicke auf **Add Secret** (oder bearbeite das bestehende)
   - **Name**: z.B. `STRIPE_SECRET_KEY`
   - **Value**: Den Wert einfügen
   - Klicke auf **Save**

## Nach dem Konfigurieren:

1. Warte 10-30 Sekunden (Secrets werden asynchron geladen)
2. Teste die Edge Function erneut
3. Prüfe die Logs in Supabase Dashboard → Edge Functions → stripe-checkout → Logs

## Troubleshooting:

### "Stripe Price ID nicht gefunden"
- Prüfe, ob die Price ID im Stripe Dashboard existiert
- Prüfe, ob du im **Test Mode** bist (Toggle oben rechts)
- Prüfe, ob die Price ID korrekt in Supabase Secrets eingetragen ist

### "STRIPE_SECRET_KEY not configured"
- Stelle sicher, dass `STRIPE_SECRET_KEY` in Supabase Secrets ist
- Verwende den Test Key: `sk_test_...` (nicht `sk_live_...`)

### Price ID wird nicht erkannt
- Prüfe die exakte Schreibweise (Groß-/Kleinschreibung)
- Stelle sicher, dass keine Leerzeichen vor/nach der Price ID sind
- Warte 30 Sekunden nach dem Speichern
