# Stripe Price ID Überprüfung

## Problem
Die Price ID `price_1SUSgMEn7Iw8aL2btlnugoGX` existiert nicht in Stripe.

## Lösung

### Schritt 1: Price ID in Stripe Dashboard prüfen

1. Gehe zu [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Klicke auf das entsprechende Produkt (Basic, Growth oder Enterprise)
3. Klicke auf den Preis (Monatlich oder Jährlich)
4. **Kopiere die komplette Price ID** (sie steht oben rechts)

### Schritt 2: Price ID in Supabase Secrets aktualisieren

1. Gehe zu [Supabase Secrets](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets)
2. Finde das entsprechende Secret (z.B. `STRIPE_PRICE_BASIC_MONTH`)
3. Klicke auf **Edit**
4. **Lösche die alte Price ID komplett**
5. **Füge die neue Price ID aus Stripe ein** (aus Schritt 1)
6. Stelle sicher, dass:
   - Keine Leerzeichen vor/nach der Price ID sind
   - Die komplette Price ID eingetragen ist (nicht abgeschnitten)
   - Die Price ID mit `price_` beginnt
7. Klicke auf **Save**

### Schritt 3: Für alle Price IDs wiederholen

Prüfe **alle 6 Price IDs**:
- `STRIPE_PRICE_BASIC_MONTH`
- `STRIPE_PRICE_BASIC_YEAR`
- `STRIPE_PRICE_GROWTH_MONTH`
- `STRIPE_PRICE_GROWTH_YEAR`
- `STRIPE_PRICE_ENTERPRISE_MONTH`
- `STRIPE_PRICE_ENTERPRISE_YEAR`

### Schritt 4: Edge Function neu deployen

```bash
supabase functions deploy stripe-checkout
```

Oder warte 10-30 Sekunden, bis die Secrets automatisch geladen werden.

### Schritt 5: Testen

1. Versuche erneut, einen Plan auszuwählen
2. Prüfe die Logs in [Supabase Dashboard → Edge Functions → stripe-checkout → Logs](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/functions/stripe-checkout/logs)

## Häufige Fehler

### Price ID existiert nicht
- Die Price ID wurde in Stripe gelöscht oder archiviert
- Die Price ID gehört zu einem anderen Stripe Account
- **Lösung**: Erstelle einen neuen Price in Stripe und kopiere die neue Price ID

### Price ID ist falsch
- Die Price ID wurde falsch kopiert (Leerzeichen, abgeschnitten)
- Die Price ID gehört zu einem anderen Produkt
- **Lösung**: Kopiere die Price ID erneut aus Stripe Dashboard

### Test vs. Live Mode
- Die Price ID ist aus Live Mode, aber du bist im Test Mode (oder umgekehrt)
- **Lösung**: Stelle sicher, dass du im Test Mode bist und Test Price IDs verwendest

