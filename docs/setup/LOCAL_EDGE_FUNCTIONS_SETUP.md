# Lokale Edge Functions Setup

## 🚀 Edge Functions lokal starten

Für lokale Tests musst du die Edge Functions lokal serven, damit sie `http://localhost:8083` verwenden können.

### 1. Supabase lokal starten

```bash
supabase start
```

### 2. Edge Functions lokal serven

In einem **separaten Terminal**:

```bash
# Alle Functions serven
supabase functions serve

# Oder nur die Stripe Functions
supabase functions serve stripe-checkout stripe-token-checkout stripe-webhook
```

### 3. Frontend anpassen (wenn nötig)

Stelle sicher, dass dein Frontend die **lokale** Supabase URL verwendet:

```typescript
// In deiner Supabase Client Konfiguration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
```

### 4. Lokale Secrets setzen

```bash
# Setze lokale Secrets für Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...  # Von stripe listen
supabase secrets set APP_URL=http://localhost:8083
```

## 📋 Lokale Test-Checkliste

- [ ] `supabase start` ausgeführt
- [ ] `supabase functions serve` läuft
- [ ] Lokale Secrets gesetzt
- [ ] Frontend zeigt auf lokale Supabase URL
- [ ] `stripe listen` läuft (für Webhook-Tests)

## 🔧 Troubleshooting

### Problem: Edge Function verwendet immer noch falsche URL
- ✅ Prüfe ob `supabase functions serve` läuft
- ✅ Prüfe ob lokale Secrets gesetzt sind: `supabase secrets list`
- ✅ Starte Functions neu: `supabase functions serve --no-verify-jwt`

### Problem: Frontend kann Edge Functions nicht erreichen
- ✅ Prüfe ob Functions lokal laufen: `supabase functions list`
- ✅ Prüfe ob Port korrekt ist (standardmäßig 54321)
- ✅ Prüfe ob Frontend die lokale Supabase URL verwendet

