# Subscription System - Vollständige Implementierung

## ✅ Alle Schritte implementiert

### Schritt 1: Datenbankstruktur ✅
**Datei**: `supabase/migrations/20250201000001_create_subscription_system.sql`

- ✅ `subscriptions` Tabelle für aktive Abonnements
- ✅ `company_features` Tabelle für Feature-Status
- ✅ Erweiterte `companies` Tabelle mit Plan-Management Spalten
- ✅ RLS Policies für Sicherheit
- ✅ Indexes für Performance

### Schritt 2: Feature-Definitionen ✅
**Datei**: `supabase/migrations/20250201000002_create_feature_functions.sql`

- ✅ `activate_subscription()` - Aktiviert Subscription nach Zahlung
- ✅ `grant_plan_features()` - Freischaltet Features basierend auf Plan
- ✅ `grant_monthly_tokens()` - Gewährt monatliche Token-Gutschrift
- ✅ `has_feature()` - Prüft ob Feature verfügbar ist
- ✅ `check_feature_limit()` - Prüft ob Limit erreicht ist

**Feature-Mapping:**
- **Basic**: 30 tokens/month, 3 industries, 5 jobs, 1 seat, 1 location, CRM/Export
- **Growth**: 150 tokens/month, unlimited industries, 20 jobs, unlimited seats/locations, CRM/Export/Team
- **Enterprise**: unlimited everything, API/SSO optional

### Schritt 3: Stripe Webhook Handler ✅
**Datei**: `supabase/functions/stripe-webhook/index.ts`

- ✅ `checkout.session.completed` → Aktiviert Subscription
- ✅ `customer.subscription.updated` → Aktualisiert Subscription
- ✅ `invoice.payment_succeeded` → Gewährt monatliche Tokens

### Schritt 4: Subscription Management Functions ✅
**Bereits in Schritt 2 implementiert:**
- ✅ `activate_subscription` - Aktiviert Plan nach Zahlung
- ✅ `grant_plan_features` - Features freischalten
- ✅ `grant_monthly_tokens` - Token-Gutschrift

### Schritt 5: Cron Job / Scheduled Function ✅
**Datei**: `supabase/migrations/20250201000003_create_monthly_token_cron.sql`

- ✅ `grant_monthly_tokens_for_all_active_subscriptions()` - Gewährt Tokens für alle aktiven Subscriptions
- ✅ `check_and_update_subscriptions()` - Prüft abgelaufene Subscriptions
- ✅ `run_monthly_token_grant()` - Manuelle Ausführung für Tests

**Cron Setup:**
```sql
-- Monatlich am 1. Tag des Monats um 00:00
SELECT cron.schedule(
  'grant-monthly-tokens',
  '0 0 1 * *',
  'SELECT public.grant_monthly_tokens_for_all_active_subscriptions()'
);
```

### Schritt 6: Frontend Integration ✅
**Dateien**: 
- `src/lib/features.ts` - Feature-Check Funktionen
- `src/hooks/useCompanyFeatures.ts` - React Hook für Features

- ✅ `hasFeature()` - Prüft ob Feature aktiviert ist
- ✅ `checkFeatureLimit()` - Prüft ob Limit erreicht ist
- ✅ `getFeatureStatus()` - Holt Feature-Status
- ✅ `getAllFeatures()` - Holt alle Features
- ✅ `useCompanyFeatures()` - React Hook für Feature-Checks

## 🚀 Deployment Schritte

### 1. Migrationen ausführen
```bash
supabase db push
```

Oder manuell in Supabase SQL Editor:
1. `20250201000001_create_subscription_system.sql`
2. `20250201000002_create_feature_functions.sql`
3. `20250201000003_create_monthly_token_cron.sql`

### 2. Stripe Webhook Edge Function deployen
```bash
supabase functions deploy stripe-webhook
```

### 3. Stripe Webhook konfigurieren
1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Klicke **Add endpoint**
3. URL: `https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/stripe-webhook`
4. Events auswählen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Webhook Secret kopieren und als `STRIPE_WEBHOOK_SECRET` in Supabase Secrets speichern

### 4. Cron Job einrichten (Optional)
In Supabase SQL Editor:
```sql
-- Prüfe ob pg_cron verfügbar ist
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Falls nicht verfügbar, installiere es (nur für Supabase Pro/Team)
-- Für Free Tier: Manuell über Supabase Dashboard → Database → Cron Jobs

-- Monatliche Token-Gutschrift
SELECT cron.schedule(
  'grant-monthly-tokens',
  '0 0 1 * *', -- Jeden 1. des Monats um 00:00
  'SELECT public.grant_monthly_tokens_for_all_active_subscriptions()'
);
```

### 5. stripe-checkout Funktion aktualisieren
Die `stripe-checkout` Funktion wurde bereits angepasst, um `subscription_data.metadata` zu senden.

## 📋 Feature-Limits pro Plan

### Basic Plan
- ✅ 30 Token pro Monat
- ✅ 3 Branchen auswählbar
- ✅ 5 Stellenanzeigen inklusive
- ✅ Token-Nachkauf: 18€ pro Token
- ✅ CRM & Export-Funktion
- ✅ 1 Standort
- ✅ 1 Seat

### Growth Plan
- ✅ 150 Tokens pro Monat
- ✅ 20 Stellenanzeigen inklusive
- ✅ Token-Nachkauf: 18€ pro Token
- ✅ Mehrere Branchen möglich
- ✅ Mehrere Seats möglich
- ✅ Mehrere Standorte möglich
- ✅ CRM, Export, Team-Zugänge

### Enterprise Plan
- ✅ Alles aus Growth
- ✅ Unlimitierte Seats
- ✅ Unlimitierte Standorte
- ✅ Token pro Standort individuell steuerbar
- ✅ Unbegrenzte Stellenanzeigen
- ✅ CRM, Teamrechte, Rollen
- ✅ Export, Reporting
- ✅ API & SSO optional

## 🔄 Workflow nach erfolgreicher Zahlung

1. **User wählt Plan** → `stripe-checkout` Edge Function erstellt Checkout Session
2. **User zahlt** → Stripe sendet `checkout.session.completed` Webhook
3. **Webhook Handler** → Ruft `activate_subscription()` auf
4. **activate_subscription()** → 
   - Erstellt/aktualisiert Subscription
   - Ruft `grant_plan_features()` auf
   - Ruft `grant_monthly_tokens()` auf (bei Upgrade)
5. **Features freigeschaltet** → Company kann Features nutzen
6. **Monatlich/Jährlich** → `invoice.payment_succeeded` Webhook gewährt neue Tokens

## 🧪 Testing

### Manuelle Tests
```sql
-- Test: Subscription aktivieren
SELECT public.activate_subscription(
  'COMPANY_ID_HIER',
  'sub_test123',
  'cus_test123',
  'basic',
  'month',
  now(),
  now() + interval '1 month'
);

-- Test: Features prüfen
SELECT * FROM public.company_features WHERE company_id = 'COMPANY_ID_HIER';

-- Test: Monatliche Token-Gutschrift
SELECT public.run_monthly_token_grant();
```

## ⚠️ Wichtige Hinweise

1. **Token-Gutschrift**: Wird automatisch bei:
   - Plan-Upgrade (sofort)
   - Monatlicher Zahlung (via `invoice.payment_succeeded`)
   - Jährlicher Zahlung (via `invoice.payment_succeeded`)

2. **Feature-Deaktivierung**: Wenn Subscription abläuft (`current_period_end < now()`), werden Features automatisch deaktiviert.

3. **Cron Job**: Für Free Tier muss der Cron Job manuell über Supabase Dashboard eingerichtet werden oder regelmäßig manuell ausgeführt werden.

4. **Webhook Secret**: Muss in Supabase Secrets als `STRIPE_WEBHOOK_SECRET` gespeichert werden.

