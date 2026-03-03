# Stripe Price IDs finden und konfigurieren

## Schritt 1: Price IDs im Stripe Dashboard finden

1. Gehe zu [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Klicke auf ein Produkt (z.B. "BeVisiblle Basic")
3. Du siehst alle Preise für dieses Produkt
4. Klicke auf einen Preis, um die Details zu sehen
5. Die **Price ID** findest du oben rechts oder in den Details (beginnt mit `price_`)

### Für jedes Produkt benötigst du 2 Price IDs:

**BeVisiblle Basic:**
- Monatlich: `price_xxxxx` (379€)
- Jährlich: `price_xxxxx` (3790€)

**BeVisiblle Growth:**
- Monatlich: `price_xxxxx` (769€)
- Jährlich: `price_xxxxx` (7690€)

**BeVisiblle Enterprise:**
- Monatlich: `price_xxxxx` (1249€)
- Jährlich: `price_xxxxx` (12490€)

## Schritt 2: Price IDs in Supabase Secrets eintragen

1. Gehe zu [Supabase Secrets](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets)
2. Für jede Price ID:
   - Klicke auf **Add Secret** (oder bearbeite das bestehende Secret)
   - **Name**: `STRIPE_PRICE_BASIC_MONTH` (oder entsprechend)
   - **Value**: Die Price ID aus Stripe (z.B. `price_1SUShuEn7Iw8aL2b1VLd5bzm`)
   - Klicke auf **Save**

### Benötigte Secrets:

```
STRIPE_PRICE_BASIC_MONTH = price_xxxxx (aus BeVisiblle Basic - Monatlich)
STRIPE_PRICE_BASIC_YEAR = price_xxxxx (aus BeVisiblle Basic - Jährlich)
STRIPE_PRICE_GROWTH_MONTH = price_xxxxx (aus BeVisiblle Growth - Monatlich)
STRIPE_PRICE_GROWTH_YEAR = price_xxxxx (aus BeVisiblle Growth - Jährlich)
STRIPE_PRICE_ENTERPRISE_MONTH = price_xxxxx (aus BeVisiblle Enterprise - Monatlich)
STRIPE_PRICE_ENTERPRISE_YEAR = price_xxxxx (aus BeVisiblle Enterprise - Jährlich)
```

## Schritt 3: Testen

Nach dem Speichern der Secrets:
1. Warte 10-30 Sekunden (Secrets werden asynchron geladen)
2. Versuche erneut, einen Plan im Frontend auszuwählen
3. Die Checkout-Session sollte jetzt funktionieren

## Wichtig für Test-Umgebung

- Stelle sicher, dass du im **Stripe Test Mode** bist (Toggle oben rechts im Dashboard)
- Verwende **Test Price IDs** (nicht Live Price IDs)
- Die Edge Function verwendet automatisch die Test-Umgebung, wenn der `STRIPE_SECRET_KEY` ein Test-Key ist

## Troubleshooting

### Price ID wird nicht gefunden
- Prüfe, ob die Price ID korrekt kopiert wurde (keine Leerzeichen)
- Prüfe, ob die Price ID im Stripe Dashboard aktiv ist
- Prüfe, ob du im Test Mode bist (für Test-Umgebung)

### Secret wird nicht erkannt
- Prüfe die exakte Schreibweise (Groß-/Kleinschreibung beachten)
- Warte 30 Sekunden nach dem Speichern
- Prüfe, ob das Secret in der Liste erscheint
