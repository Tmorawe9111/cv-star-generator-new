# ✅ Subscription System - Nächste Schritte

## 🎉 Migrationen erfolgreich ausgeführt!

Alle 4 Migrationen wurden erfolgreich ausgeführt:
- ✅ Token-Preise aktualisiert
- ✅ Subscription System Datenbankstruktur erstellt
- ✅ Feature-Definitionen und Functions erstellt
- ✅ Cron Job Functions erstellt

## 📋 Was jetzt noch zu tun ist

### 1. Stripe Webhook konfigurieren (WICHTIG!)

**Ohne Webhook funktioniert das System nicht!**

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Klicke **Add endpoint**
3. **Endpoint URL**: 
   ```
   https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/stripe-webhook
   ```
4. **Events auswählen**:
   - ✅ `checkout.session.completed` (für Plan-Upgrades)
   - ✅ `customer.subscription.updated` (für Subscription-Updates)
   - ✅ `customer.subscription.deleted` (für Kündigungen)
   - ✅ `invoice.payment_succeeded` (für monatliche Token-Gutschrift)

5. **Webhook Secret kopieren** (wird nach dem Erstellen angezeigt)

6. **In Supabase Secrets speichern**:
   - Gehe zu [Supabase Secrets](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets)
   - Füge hinzu: `STRIPE_WEBHOOK_SECRET` = (dein Webhook Secret)

### 2. Cron Job einrichten (Optional, aber empfohlen)

Für automatische monatliche Token-Gutschrift:

**Option A: Via Supabase Dashboard (Empfohlen für Free Tier)**
1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/database/cron)
2. Erstelle einen neuen Cron Job:
   - **Name**: `grant-monthly-tokens`
   - **Schedule**: `0 0 1 * *` (Jeden 1. des Monats um 00:00)
   - **SQL**: 
     ```sql
     SELECT public.grant_monthly_tokens_for_all_active_subscriptions();
     ```

**Option B: Via SQL (für Pro/Team)**
```sql
SELECT cron.schedule(
  'grant-monthly-tokens',
  '0 0 1 * *',
  'SELECT public.grant_monthly_tokens_for_all_active_subscriptions()'
);
```

### 3. Testen

#### Test 1: Plan-Upgrade testen
1. Gehe zum Dashboard
2. Klicke auf "Plan upgraden"
3. Wähle einen Plan (z.B. Basic)
4. Führe den Checkout durch
5. **Prüfe in Supabase**:
   ```sql
   -- Prüfe Subscription
   SELECT * FROM public.subscriptions ORDER BY created_at DESC LIMIT 1;
   
   -- Prüfe Features
   SELECT * FROM public.company_features WHERE company_id = 'DEINE_COMPANY_ID';
   
   -- Prüfe Company
   SELECT active_plan_id, plan_interval, active_tokens FROM public.companies WHERE id = 'DEINE_COMPANY_ID';
   ```

#### Test 2: Token-Kauf testen
1. Gehe zum Dashboard
2. Klicke auf "Tokens nachkaufen"
3. Wähle ein Token-Paket
4. Führe den Checkout durch
5. **Prüfe**: Tokens sollten automatisch gutgeschrieben werden

#### Test 3: Feature-Checks testen
```sql
-- Prüfe ob Feature verfügbar ist
SELECT public.has_feature('DEINE_COMPANY_ID', 'tokens_per_month');

-- Prüfe Feature-Limit
SELECT public.check_feature_limit('DEINE_COMPANY_ID', 'max_active_jobs', 3);
```

### 4. Frontend Integration prüfen

Die Frontend-Feature-Checks sind bereits implementiert:
- ✅ `src/lib/features.ts` - Feature-Check Funktionen
- ✅ `src/hooks/useCompanyFeatures.ts` - React Hook

**Beispiel-Verwendung im Frontend:**
```typescript
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';

function MyComponent() {
  const { hasFeature, isLimitReached, getFeatureLimit } = useCompanyFeatures();
  
  const canCreateJob = !isLimitReached('max_active_jobs');
  const maxJobs = getFeatureLimit('max_active_jobs');
  
  // ...
}
```

## 🔍 System-Status prüfen

### Prüfe ob alles korrekt eingerichtet ist:

```sql
-- 1. Prüfe Tabellen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('subscriptions', 'company_features')
ORDER BY table_name;

-- 2. Prüfe Functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'activate_subscription',
    'grant_plan_features',
    'grant_monthly_tokens',
    'has_feature',
    'check_feature_limit'
  )
ORDER BY routine_name;

-- 3. Prüfe Token-Preise
SELECT credits, price_cents, active 
FROM public.token_packages 
WHERE active = true
ORDER BY credits;

-- Erwartete Werte:
-- 50 Tokens = 98.000 Cent (980€)
-- 150 Tokens = 260.000 Cent (2.600€)
-- 300 Tokens = 500.000 Cent (5.000€)
```

## ⚠️ Wichtige Hinweise

1. **Webhook ist kritisch**: Ohne Webhook werden keine Subscriptions aktiviert und keine Tokens gutgeschrieben
2. **Cron Job ist optional**: Tokens werden auch bei `invoice.payment_succeeded` Webhook gutgeschrieben
3. **Feature-Limits**: Werden automatisch beim Plan-Upgrade gesetzt
4. **Token-Gutschrift**: 
   - Bei Plan-Upgrade: Sofort
   - Bei monatlicher Zahlung: Via `invoice.payment_succeeded` Webhook
   - Bei jährlicher Zahlung: Via `invoice.payment_succeeded` Webhook

## 🐛 Troubleshooting

### Problem: Subscriptions werden nicht aktiviert
- ✅ Prüfe ob Webhook konfiguriert ist
- ✅ Prüfe Webhook Logs in Stripe Dashboard
- ✅ Prüfe Edge Function Logs in Supabase Dashboard

### Problem: Tokens werden nicht gutgeschrieben
- ✅ Prüfe ob `invoice.payment_succeeded` Webhook Event empfangen wird
- ✅ Prüfe ob `grant_monthly_tokens()` Function korrekt aufgerufen wird
- ✅ Prüfe Company `active_tokens` in Datenbank

### Problem: Features werden nicht freigeschaltet
- ✅ Prüfe ob `grant_plan_features()` Function aufgerufen wird
- ✅ Prüfe `company_features` Tabelle
- ✅ Prüfe ob `active_plan_id` in `companies` Tabelle korrekt gesetzt ist

## 📚 Weitere Dokumentation

- `SUBSCRIPTION_SYSTEM_IMPLEMENTATION.md` - Vollständige Implementierungs-Dokumentation
- `MIGRATIONEN_AUSFUEHREN.md` - Migration-Anleitung

## ✅ Checkliste

- [x] Migrationen ausgeführt
- [ ] Stripe Webhook konfiguriert
- [ ] Webhook Secret in Supabase Secrets gespeichert
- [ ] Cron Job eingerichtet (optional)
- [ ] Plan-Upgrade getestet
- [ ] Token-Kauf getestet
- [ ] Feature-Checks getestet

