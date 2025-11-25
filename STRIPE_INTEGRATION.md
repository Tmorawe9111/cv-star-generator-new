# Stripe Integration für Onboarding - Anleitung

## ✅ Was wurde implementiert

Der `PlanSelector` im Onboarding wurde aktualisiert, um:
- ✅ Die echten Pläne aus `billing-v2/plans.ts` zu verwenden
- ✅ Monatlich/Jährlich Toggle zu haben
- ✅ Plan-Auswahl in der Datenbank zu speichern
- ✅ Vorbereitet für Stripe Checkout zu sein

## 🔧 Aktuelle Implementierung

**Status**: Die Plan-Auswahl wird aktuell in der Datenbank gespeichert (`selected_plan_id`, `plan_interval`), aber die Stripe-Zahlung muss noch integriert werden.

## 🚀 Optionen für Stripe-Integration

Da das Projekt **Vite/React** (nicht Next.js) verwendet, gibt es mehrere Optionen:

### Option 1: Supabase Edge Functions (Empfohlen)

Erstelle eine Supabase Edge Function für Stripe Checkout:

```typescript
// supabase/functions/stripe-checkout/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
})

serve(async (req) => {
  const { companyId, plan, interval } = await req.json()
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    // ... Stripe config
  })
  
  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

Dann im `PlanSelector`:
```typescript
const response = await supabase.functions.invoke('stripe-checkout', {
  body: { companyId, plan, interval }
})
```

### Option 2: Separate API Server

Falls du einen separaten API-Server hast (z.B. Express, FastAPI), kannst du die bestehenden Next.js API Routes dort replizieren.

### Option 3: Stripe.js direkt (Client-side)

Für einfache Zahlungen kannst du Stripe.js direkt im Frontend verwenden:

```typescript
import { loadStripe } from '@stripe/stripe-js'

const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
const { error } = await stripe.redirectToCheckout({
  sessionId: sessionId // Von deinem Backend
})
```

## 📋 Nächste Schritte

1. **Stripe Keys konfigurieren**:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_... (nur im Backend)
   ```

2. **Stripe Price IDs prüfen**:
   - Die Price IDs in `stripe-prices.ts` müssen mit deinen Stripe-Produkten übereinstimmen
   - Erstelle die Produkte/Preise in Stripe Dashboard

3. **Webhook einrichten**:
   - Stripe Webhook für `checkout.session.completed`
   - Aktualisiert `companies` Tabelle nach erfolgreicher Zahlung

4. **Testen**:
   - Verwende Stripe Test-Modus
   - Test-Kreditkarte: `4242 4242 4242 4242`

## 🔍 Aktueller Code

Der `PlanSelector` speichert aktuell:
- `selected_plan_id` → Plan-Key (z.B. "growth", "bevis")
- `plan_interval` → "month" oder "year"

Nach der Stripe-Integration sollte zusätzlich gespeichert werden:
- `stripe_subscription_id` → Stripe Subscription ID
- `stripe_customer_id` → Stripe Customer ID
- `subscription_status` → "active", "canceled", etc.

## 💡 Empfehlung

**Für schnelle Integration**: Verwende **Supabase Edge Functions** (Option 1), da:
- ✅ Kein separater Server nötig
- ✅ Direkt mit Supabase integriert
- ✅ Einfach zu deployen
- ✅ Skaliert automatisch

Soll ich dir eine Supabase Edge Function für Stripe Checkout erstellen?

