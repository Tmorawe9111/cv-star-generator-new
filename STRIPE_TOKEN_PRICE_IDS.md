# Stripe Token Price IDs Konfiguration

## Token Price IDs aus Stripe

Basierend auf dem Stripe Dashboard sind die folgenden Token Price IDs verfügbar:

### Token Bundle 50
- **Price ID**: `price_1SUSkbEn7Iw8aL2bWSfxgfeV`
- **Preis**: 980€ (98.000 Cent)

### Token Bundle 150
- **Price ID**: `price_1SUSl8En7Iw8aL2bQhWLdho3`
- **Preis**: 2.600€ (260.000 Cent)

### Token Bundle 300
- **Price ID**: `price_1SUSoJEn7Iw8aL2bIeX7QI8b`
- **Preis**: 5.000€ (500.000 Cent)

## In Supabase Secrets konfigurieren

1. Gehe zu [Supabase Secrets](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets)
2. Füge die folgenden Secrets hinzu (oder bearbeite die bestehenden):

```
STRIPE_PRICE_TOKENS_50 = price_1SUSkbEn7Iw8aL2bWSfxgfeV
STRIPE_PRICE_TOKENS_150 = price_1SUSl8En7Iw8aL2bQhWLdho3
STRIPE_PRICE_TOKENS_300 = price_1SUSoJEn7Iw8aL2bIeX7QI8b
```

## Nach dem Konfigurieren

1. Warte 10-30 Sekunden (Secrets werden asynchron geladen)
2. Die Edge Function `stripe-token-checkout` wurde bereits deployed
3. Teste den Token-Kauf im Frontend

## Wichtig

- Die Price IDs müssen exakt mit denen in Stripe übereinstimmen
- Keine Leerzeichen vor/nach den Price IDs
- Stelle sicher, dass du im **Test Mode** bist (für Test-Umgebung)

