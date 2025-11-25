# 🔍 Edge Function Fehler debuggen

## Fehler: "Edge Function returned a non-2xx status code"

Dieser Fehler bedeutet, dass die Edge Function einen Fehler zurückgibt. Hier sind die Schritte zum Debuggen:

## 1. Browser-Konsole prüfen

Öffne die Browser-Konsole (F12) und schaue nach:
- **Rote Fehlermeldungen** mit Details
- **Network-Tab**: Prüfe die Response der Edge Function

## 2. Supabase Function Logs prüfen

1. Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/functions
2. Klicke auf `stripe-checkout` oder `stripe-token-checkout`
3. Prüfe die **Logs** für Fehlermeldungen

## 3. Häufige Fehlerursachen

### ❌ Secret nicht gesetzt
**Fehler**: `STRIPE_SECRET_KEY not configured` oder `STRIPE_PRICE_XXX not configured`

**Lösung**: 
- Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets
- Stelle sicher, dass alle Secrets gesetzt sind:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_BASIC_MONTH` / `STRIPE_PRICE_BASIC_YEAR`
  - `STRIPE_PRICE_GROWTH_MONTH` / `STRIPE_PRICE_GROWTH_YEAR`
  - `STRIPE_PRICE_ENTERPRISE_MONTH` / `STRIPE_PRICE_ENTERPRISE_YEAR`
  - `STRIPE_PRICE_TOKENS_50` / `STRIPE_PRICE_TOKENS_150` / `STRIPE_PRICE_TOKENS_300`

### ❌ Falsche Price ID
**Fehler**: `Stripe Price ID nicht gefunden` oder `resource_missing`

**Lösung**:
- Prüfe im Stripe Dashboard, ob die Price IDs existieren
- Stelle sicher, dass die Price IDs in den Secrets korrekt sind
- Prüfe, ob die Price IDs im **Live-Modus** sind (nicht Test-Modus)

### ❌ Company nicht gefunden
**Fehler**: `company not found`

**Lösung**:
- Stelle sicher, dass die `companyId` korrekt ist
- Prüfe, ob die Company in der Datenbank existiert

### ❌ Stripe API Fehler
**Fehler**: `Stripe-Fehler beim Erstellen der Checkout-Session`

**Lösung**:
- Prüfe die Stripe Dashboard Logs
- Stelle sicher, dass der Stripe Secret Key korrekt ist
- Prüfe, ob der Stripe Account aktiv ist

## 4. Verbesserte Fehlerbehandlung

Die Komponenten wurden aktualisiert, um detailliertere Fehlermeldungen anzuzeigen:
- `PlanSelector.tsx` - zeigt jetzt vollständige Fehlermeldungen
- `BillingWorkspaceV2.tsx` - zeigt jetzt vollständige Fehlermeldungen

## 5. Testen

Nach dem Beheben der Fehler:
1. **Token-Kauf testen**: `/company/billing-v2` → "Tokens kaufen"
2. **Plan-Upgrade testen**: Onboarding oder `/company/billing-v2` → "Plan upgraden"

## 6. Logs lokal prüfen

Falls du lokal testest:
```bash
supabase functions serve stripe-checkout --no-verify-jwt
```

Dann in einem anderen Terminal:
```bash
curl -X POST http://localhost:54321/functions/v1/stripe-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"companyId": "YOUR_COMPANY_ID", "plan": "basic", "interval": "month"}'
```

## 7. Support

Falls der Fehler weiterhin besteht:
1. Kopiere die **komplette Fehlermeldung** aus der Browser-Konsole
2. Kopiere die **Function Logs** aus Supabase
3. Prüfe, ob alle **Secrets korrekt gesetzt** sind

