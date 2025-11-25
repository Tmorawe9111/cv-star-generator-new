-- ============================================
-- STEP 1: Datenbankstruktur für Subscription System
-- ============================================

-- 1.1: Prüfe ob alte subscriptions Tabelle existiert und lösche sie falls nötig
DO $$
BEGIN
  -- Prüfe ob subscriptions Tabelle existiert
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions'
  ) THEN
    -- Prüfe ob stripe_subscription_id Spalte existiert
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'subscriptions' 
      AND column_name = 'stripe_subscription_id'
    ) THEN
      -- Alte Tabelle löschen (nur wenn keine stripe_subscription_id Spalte)
      DROP TABLE IF EXISTS public.subscriptions CASCADE;
    END IF;
  END IF;
END $$;

-- 1.2: Subscriptions Tabelle erstellen (neu oder falls gelöscht)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  plan_key TEXT NOT NULL CHECK (plan_key IN ('basic', 'growth', 'enterprise', 'free')),
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3: Falls Tabelle bereits existiert, fehlende Spalten hinzufügen
DO $$
BEGIN
  -- Füge stripe_subscription_id hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN stripe_subscription_id TEXT UNIQUE;
  END IF;

  -- Füge stripe_customer_id hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN stripe_customer_id TEXT NOT NULL DEFAULT '';
  END IF;

  -- Füge plan_key hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'plan_key'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN plan_key TEXT NOT NULL DEFAULT 'free' 
    CHECK (plan_key IN ('basic', 'growth', 'enterprise', 'free'));
  END IF;

  -- Füge interval hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'interval'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN interval TEXT NOT NULL DEFAULT 'month' 
    CHECK (interval IN ('month', 'year'));
  END IF;

  -- Füge status hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing'));
  END IF;

  -- Füge current_period_start hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'current_period_start'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN current_period_start TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Füge current_period_end hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN current_period_end TIMESTAMPTZ NOT NULL DEFAULT now() + interval '1 month';
  END IF;

  -- Füge weitere Spalten hinzu falls nicht vorhanden
  ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

-- 1.4: Company Features Tabelle
CREATE TABLE IF NOT EXISTS public.company_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  limit_value INTEGER, -- NULL = unlimited
  current_usage INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ, -- Wann wird das Limit zurückgesetzt (monatlich/jährlich)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, feature_key)
);

-- 1.5: Erweitere companies Tabelle
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS active_plan_id TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_interval TEXT DEFAULT 'month' CHECK (plan_interval IN ('month', 'year')),
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id),
  ADD COLUMN IF NOT EXISTS last_token_grant_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_industries INTEGER DEFAULT 1;

-- 1.6: Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_company_features_company_id ON public.company_features(company_id);
CREATE INDEX IF NOT EXISTS idx_company_features_feature_key ON public.company_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_companies_next_billing_date ON public.companies(next_billing_date);

-- 1.7: RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_features ENABLE ROW LEVEL SECURITY;

-- Companies können ihre eigenen Subscriptions sehen
CREATE POLICY "subscriptions_company_select" ON public.subscriptions
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE id IN (
        SELECT company_id FROM public.company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Companies können ihre eigenen Features sehen
CREATE POLICY "company_features_company_select" ON public.company_features
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE id IN (
        SELECT company_id FROM public.company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Service Role kann alles
CREATE POLICY "subscriptions_service_all" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "company_features_service_all" ON public.company_features
  FOR ALL USING (auth.role() = 'service_role');

-- 1.8: Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_features_updated_at
  BEFORE UPDATE ON public.company_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

