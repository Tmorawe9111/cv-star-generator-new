# Stripe Edge Functions - Übersicht

## ✅ Implementierte Functions

### 1. `stripe-checkout` - Plan-Upgrades
**Datei**: `supabase/functions/stripe-checkout/index.ts`

**Zweck**: Erstellt Stripe Checkout Sessions für Plan-Abonnements (Basic, Growth, BeVisiblle)

**Verwendung**:
- Onboarding: Plan-Auswahl
- Billing-V2: Plan-Upgrade

**Parameter**:
```json
{
  "companyId": "uuid",
  "plan": "basic" | "growth" | "bevis",
  "interval": "month" | "year"
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### 2. `stripe-token-checkout` - Token-Käufe
**Datei**: `supabase/functions/stripe-token-checkout/index.ts`

**Zweck**: Erstellt Stripe Checkout Sessions für einmalige Token-Käufe

**Verwendung**:
- Billing-V2: Token-Kauf Modal
- Dashboard: "Tokens kaufen" Button

**Parameter**:
```json
{
  "companyId": "uuid",
  "packageId": "t15" | "t45" | "t100"
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

## 🚀 Deployment

### Beide Functions deployen:

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-token-checkout
```

### Oder beide auf einmal:

```bash
supabase functions deploy stripe-checkout stripe-token-checkout
```

## 🔧 Konfiguration

### Erforderliche Secrets:

```
STRIPE_SECRET_KEY=sk_test_... (oder sk_live_...)
```

### Optionale Secrets (für Price IDs):

**Plans:**
```
STRIPE_PRICE_BASIC_MONTH=price_...
STRIPE_PRICE_BASIC_YEAR=price_...
STRIPE_PRICE_GROWTH_MONTH=price_...
STRIPE_PRICE_GROWTH_YEAR=price_...
STRIPE_PRICE_BEVIS_MONTH=price_...
STRIPE_PRICE_BEVIS_YEAR=price_...
```

**Tokens:**
```
STRIPE_PRICE_TOKENS_15=price_...
STRIPE_PRICE_TOKENS_45=price_...
STRIPE_PRICE_TOKENS_100=price_...
```

## 📋 Verwendete Komponenten

### Plan-Kauf:
- `src/components/company/onboarding/PlanSelector.tsx` ✅ Aktualisiert
- `src/components/billing-v2/UpgradePlanModalV2.tsx` (falls vorhanden)

### Token-Kauf:
- `src/components/billing-v2/TokenPurchaseModalV2.tsx` ✅ Aktualisiert

## 🔍 Unterschiede

| Feature | stripe-checkout | stripe-token-checkout |
|---------|----------------|----------------------|
| **Mode** | `subscription` | `payment` |
| **Zahlung** | Wiederkehrend | Einmalig |
| **Verwendung** | Plans | Tokens |
| **Metadata** | `kind: "plan"` | `kind: "tokens"` |

## ✅ Status

- ✅ `stripe-checkout` erstellt und bereit
- ✅ `stripe-token-checkout` erstellt und bereit
- ✅ `PlanSelector` aktualisiert
- ✅ `TokenPurchaseModalV2` aktualisiert
- ⏳ Deployment erforderlich
- ⏳ Stripe Price IDs konfigurieren

## 📝 Nächste Schritte

1. **Deploye beide Functions**
2. **Konfiguriere Stripe Price IDs** (via Secrets oder direkt in Code)
3. **Teste Plan-Kauf** im Onboarding
4. **Teste Token-Kauf** in Billing-V2
5. **Richte Webhooks ein** für automatische Updates

