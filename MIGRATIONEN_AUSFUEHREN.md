# Migrationen ausführen - Schritt für Schritt

## 📋 Übersicht der neuen Migrationen

Du musst **4 Migrationen** in dieser Reihenfolge ausführen:

### 1. Token-Preise aktualisieren
**Datei**: `20250201000000_update_token_packages_prices.sql`
- Aktualisiert die Token-Preise in der `token_packages` Tabelle
- 50 Tokens = 980€
- 150 Tokens = 2.600€
- 300 Tokens = 5.000€

### 2. Subscription System Datenbankstruktur
**Datei**: `20250201000001_create_subscription_system.sql`
- Erstellt `subscriptions` Tabelle
- Erstellt `company_features` Tabelle
- Erweitert `companies` Tabelle mit Plan-Management Spalten
- RLS Policies und Indexes

### 3. Feature-Definitionen und Functions
**Datei**: `20250201000002_create_feature_functions.sql`
- Erstellt `activate_subscription()` Function
- Erstellt `grant_plan_features()` Function
- Erstellt `grant_monthly_tokens()` Function
- Erstellt `has_feature()` und `check_feature_limit()` Functions

### 4. Cron Job Functions
**Datei**: `20250201000003_create_monthly_token_cron.sql`
- Erstellt `grant_monthly_tokens_for_all_active_subscriptions()` Function
- Erstellt `check_and_update_subscriptions()` Function
- Erstellt `run_monthly_token_grant()` Function

## 🚀 Ausführung

### Option 1: Via Supabase CLI (Empfohlen)
```bash
cd /Users/toddmorawe/cv-star-generator
supabase db push
```

Dies führt alle neuen Migrationen automatisch in der richtigen Reihenfolge aus.

### Option 2: Manuell im Supabase SQL Editor

1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/editor)
2. Öffne den **SQL Editor**
3. Führe die Migrationen **nacheinander** in dieser Reihenfolge aus:

#### Schritt 1: Token-Preise
```sql
-- Kopiere den Inhalt von: supabase/migrations/20250201000000_update_token_packages_prices.sql
```

#### Schritt 2: Subscription System
```sql
-- Kopiere den Inhalt von: supabase/migrations/20250201000001_create_subscription_system.sql
```

#### Schritt 3: Feature Functions
```sql
-- Kopiere den Inhalt von: supabase/migrations/20250201000002_create_feature_functions.sql
```

#### Schritt 4: Cron Job Functions
```sql
-- Kopiere den Inhalt von: supabase/migrations/20250201000003_create_monthly_token_cron.sql
```

## ✅ Nach der Ausführung prüfen

### 1. Tabellen prüfen
```sql
-- Prüfe ob Tabellen erstellt wurden
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('subscriptions', 'company_features');
```

### 2. Functions prüfen
```sql
-- Prüfe ob Functions erstellt wurden
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'activate_subscription',
    'grant_plan_features',
    'grant_monthly_tokens',
    'has_feature',
    'check_feature_limit',
    'grant_monthly_tokens_for_all_active_subscriptions',
    'check_and_update_subscriptions',
    'run_monthly_token_grant'
  );
```

### 3. Token-Preise prüfen
```sql
-- Prüfe Token-Preise
SELECT credits, price_cents, active 
FROM public.token_packages 
WHERE active = true
ORDER BY credits;
```

**Erwartete Werte:**
- 50 Tokens = 98.000 Cent (980€)
- 150 Tokens = 260.000 Cent (2.600€)
- 300 Tokens = 500.000 Cent (5.000€)

## ⚠️ Wichtig

- Führe die Migrationen **in der angegebenen Reihenfolge** aus
- Wenn eine Migration fehlschlägt, prüfe die Fehlermeldung
- Die Migrationen sind **idempotent** (können mehrfach ausgeführt werden, wenn sie `IF NOT EXISTS` verwenden)

## 🐛 Bei Fehlern

Falls eine Migration fehlschlägt:

1. **Prüfe die Fehlermeldung** im SQL Editor
2. **Prüfe ob Tabellen/Functions bereits existieren**:
   ```sql
   -- Prüfe Tabellen
   SELECT * FROM information_schema.tables WHERE table_name = 'subscriptions';
   
   -- Prüfe Functions
   SELECT * FROM information_schema.routines WHERE routine_name = 'activate_subscription';
   ```
3. **Falls bereits vorhanden**: Die Migration kann übersprungen werden oder du musst sie anpassen
4. **Falls nicht vorhanden**: Prüfe die SQL-Syntax und Fehlermeldungen

## 📝 Nächste Schritte nach Migrationen

Nach erfolgreicher Ausführung der Migrationen:

1. ✅ Stripe Webhook konfigurieren (siehe `SUBSCRIPTION_SYSTEM_IMPLEMENTATION.md`)
2. ✅ Cron Job einrichten (optional)
3. ✅ Testen mit einem Plan-Upgrade

