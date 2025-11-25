# ✅ Price ID Validierung entfernt

## Was wurde geändert

Die Platzhalter-Validierung wurde entfernt. Jetzt wird Stripe die Price IDs direkt validieren. Wenn eine Price ID falsch ist, gibt Stripe eine detaillierte Fehlermeldung zurück.

## Nächste Schritte

### 1. Prüfe, ob die Secrets gesetzt sind

Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets

Stelle sicher, dass alle Secrets gesetzt sind:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_BASIC_MONTH`
- `STRIPE_PRICE_BASIC_YEAR`
- `STRIPE_PRICE_GROWTH_MONTH`
- `STRIPE_PRICE_GROWTH_YEAR`
- `STRIPE_PRICE_ENTERPRISE_MONTH`
- `STRIPE_PRICE_ENTERPRISE_YEAR`
- `STRIPE_PRICE_TOKENS_50`
- `STRIPE_PRICE_TOKENS_150`
- `STRIPE_PRICE_TOKENS_300`

### 2. Prüfe die Price IDs

Die Price IDs müssen:
- ✅ Im Stripe Dashboard existieren
- ✅ Im **Live-Modus** sein (nicht Test-Modus)
- ✅ Die richtigen Beträge haben (379€, 769€, 1.249€ für monatlich / 3.790€, 7.690€, 12.490€ für jährlich)

### 3. Testen

Nach dem Deploy:
1. Warte 1-2 Minuten, bis die Edge Function aktualisiert ist
2. Teste erneut den Plan-Kauf
3. Falls ein Fehler auftritt, wird Stripe jetzt eine detaillierte Fehlermeldung zurückgeben

## Falls weiterhin Fehler auftreten

Die Fehlermeldung sollte jetzt von Stripe kommen und genau sagen, was falsch ist:
- "No such price: price_xxxxx" → Price ID existiert nicht
- "Invalid price" → Price ID ist ungültig
- Andere Stripe-Fehlermeldungen

Diese Fehlermeldungen werden jetzt in der UI angezeigt.

