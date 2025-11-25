-- ============================================
-- STEP 2: Feature-Definitionen und Management Functions
-- ============================================

-- 2.1: Feature-Definitionen als JSONB (kann später in Tabelle verschoben werden)
-- Features pro Plan:
-- Basic: 30 tokens/month, 3 industries, 5 jobs, 1 seat, 1 location
-- Growth: 150 tokens/month, unlimited industries, 20 jobs, unlimited seats, unlimited locations
-- Enterprise: unlimited everything

-- 2.2: Function zum Aktivieren eines Subscriptions
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_company_id UUID,
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_plan_key TEXT,
  p_interval TEXT,
  p_current_period_start TIMESTAMPTZ,
  p_current_period_end TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_id UUID;
  v_old_plan_key TEXT;
  v_purchase_date DATE;
  v_next_billing_date TIMESTAMPTZ;
BEGIN
  -- Hole aktuellen Plan
  SELECT active_plan_id INTO v_old_plan_key
  FROM public.companies
  WHERE id = p_company_id;

  -- Erstelle oder aktualisiere Subscription
  INSERT INTO public.subscriptions (
    company_id,
    stripe_subscription_id,
    stripe_customer_id,
    plan_key,
    interval,
    status,
    current_period_start,
    current_period_end
  )
  VALUES (
    p_company_id,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_plan_key,
    p_interval,
    'active',
    p_current_period_start,
    p_current_period_end
  )
  ON CONFLICT (stripe_subscription_id) 
  DO UPDATE SET
    plan_key = EXCLUDED.plan_key,
    interval = EXCLUDED.interval,
    status = 'active',
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now()
  RETURNING id INTO v_subscription_id;

  -- Berechne next_billing_date basierend auf Kaufdatum und Intervall
  -- Für monatlich: gleicher Tag im nächsten Monat
  -- Für jährlich: gleicher Tag im nächsten Jahr
  -- Nutze current_period_start als Kaufdatum
  v_purchase_date := DATE(p_current_period_start);
  
  IF p_interval = 'month' THEN
    -- Gleicher Tag im nächsten Monat
    v_next_billing_date := (v_purchase_date + INTERVAL '1 month')::TIMESTAMPTZ;
  ELSE
    -- Gleicher Tag im nächsten Jahr
    v_next_billing_date := (v_purchase_date + INTERVAL '1 year')::TIMESTAMPTZ;
  END IF;
  
  -- Aktualisiere Company
  UPDATE public.companies
  SET 
    active_plan_id = p_plan_key,
    plan_interval = p_interval,
    subscription_id = v_subscription_id,
    next_billing_date = v_next_billing_date,
    updated_at = now()
  WHERE id = p_company_id;

  -- Features freischalten
  PERFORM public.grant_plan_features(p_company_id, p_plan_key);

  -- Token-Gutschrift bei Planwechsel (nur wenn Upgrade)
  IF v_old_plan_key IS DISTINCT FROM p_plan_key AND p_plan_key != 'free' THEN
    PERFORM public.grant_monthly_tokens(p_company_id, p_plan_key);
  END IF;

  RETURN v_subscription_id;
END;
$$;

-- 2.3: Function zum Freischalten von Features basierend auf Plan
CREATE OR REPLACE FUNCTION public.grant_plan_features(
  p_company_id UUID,
  p_plan_key TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tokens_per_month INTEGER;
  v_max_industries INTEGER;
  v_max_jobs INTEGER;
  v_max_seats INTEGER;
  v_max_locations INTEGER;
BEGIN
  -- Feature-Limits basierend auf Plan
  CASE p_plan_key
    WHEN 'basic' THEN
      v_tokens_per_month := 30;
      v_max_industries := 3;
      v_max_jobs := 5;
      v_max_seats := 1;
      v_max_locations := 1;
    WHEN 'growth' THEN
      v_tokens_per_month := 150;
      v_max_industries := -1; -- unlimited
      v_max_jobs := 20;
      v_max_seats := -1; -- unlimited
      v_max_locations := -1; -- unlimited
    WHEN 'enterprise' THEN
      v_tokens_per_month := -1; -- unlimited (individuell steuerbar)
      v_max_industries := -1;
      v_max_jobs := -1;
      v_max_seats := -1;
      v_max_locations := -1;
    ELSE -- free
      v_tokens_per_month := 0;
      v_max_industries := 0;
      v_max_jobs := 0;
      v_max_seats := 1;
      v_max_locations := 1;
  END CASE;

  -- Aktualisiere Company Limits
  UPDATE public.companies
  SET 
    max_seats = CASE WHEN v_max_seats = -1 THEN 999999 ELSE v_max_seats END,
    max_locations = CASE WHEN v_max_locations = -1 THEN 999999 ELSE v_max_locations END,
    max_industries = CASE WHEN v_max_industries = -1 THEN 999999 ELSE v_max_industries END,
    updated_at = now()
  WHERE id = p_company_id;

  -- Features in company_features Tabelle speichern
  INSERT INTO public.company_features (company_id, feature_key, enabled, limit_value, reset_at)
  VALUES 
    (p_company_id, 'tokens_per_month', true, v_tokens_per_month, date_trunc('month', now() + interval '1 month')),
    (p_company_id, 'max_industries', true, v_max_industries, NULL),
    (p_company_id, 'max_active_jobs', true, v_max_jobs, NULL),
    (p_company_id, 'max_seats', true, v_max_seats, NULL),
    (p_company_id, 'max_locations', true, v_max_locations, NULL),
    (p_company_id, 'crm_export', true, NULL, NULL),
    (p_company_id, 'team_access', CASE WHEN p_plan_key IN ('growth', 'enterprise') THEN true ELSE false END, NULL, NULL),
    (p_company_id, 'api_sso', CASE WHEN p_plan_key = 'enterprise' THEN true ELSE false END, NULL, NULL)
  ON CONFLICT (company_id, feature_key)
  DO UPDATE SET
    enabled = EXCLUDED.enabled,
    limit_value = EXCLUDED.limit_value,
    reset_at = EXCLUDED.reset_at,
    updated_at = now();
END;
$$;

-- 2.4: Function zum Gewähren monatlicher Tokens
CREATE OR REPLACE FUNCTION public.grant_monthly_tokens(
  p_company_id UUID,
  p_plan_key TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tokens_to_grant INTEGER;
  v_current_tokens INTEGER;
BEGIN
  -- Token-Menge basierend auf Plan
  CASE p_plan_key
    WHEN 'basic' THEN
      v_tokens_to_grant := 30;
    WHEN 'growth' THEN
      v_tokens_to_grant := 150;
    WHEN 'enterprise' THEN
      -- Enterprise: Individuell steuerbar, hier erstmal 0 (wird später konfiguriert)
      v_tokens_to_grant := 0;
    ELSE
      v_tokens_to_grant := 0;
  END CASE;

  IF v_tokens_to_grant > 0 THEN
    -- Hole aktuelle Token
    SELECT COALESCE(active_tokens, 0) INTO v_current_tokens
    FROM public.companies
    WHERE id = p_company_id;

    -- Füge Tokens hinzu
    UPDATE public.companies
    SET 
      active_tokens = COALESCE(active_tokens, 0) + v_tokens_to_grant,
      last_token_grant_at = now(),
      updated_at = now()
    WHERE id = p_company_id;

    -- Log in Token Ledger (falls vorhanden)
    -- INSERT INTO token_ledger (company_id, delta, reason, created_at)
    -- VALUES (p_company_id, v_tokens_to_grant, 'monthly_grant:' || p_plan_key, now());
  END IF;
END;
$$;

-- 2.5: Function zum Prüfen ob Feature verfügbar ist
CREATE OR REPLACE FUNCTION public.has_feature(
  p_company_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT enabled INTO v_enabled
  FROM public.company_features
  WHERE company_id = p_company_id
    AND feature_key = p_feature_key;

  RETURN COALESCE(v_enabled, false);
END;
$$;

-- 2.6: Function zum Prüfen ob Limit erreicht ist
CREATE OR REPLACE FUNCTION public.check_feature_limit(
  p_company_id UUID,
  p_feature_key TEXT,
  p_current_usage INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit_value INTEGER;
  v_usage INTEGER;
BEGIN
  SELECT limit_value, current_usage INTO v_limit_value, v_usage
  FROM public.company_features
  WHERE company_id = p_company_id
    AND feature_key = p_feature_key;

  -- NULL limit = unlimited
  IF v_limit_value IS NULL OR v_limit_value = -1 THEN
    RETURN false; -- Limit nicht erreicht
  END IF;

  -- Verwende übergebenen Wert oder aktuellen Usage
  IF p_current_usage IS NOT NULL THEN
    v_usage := p_current_usage;
  END IF;

  RETURN COALESCE(v_usage, 0) >= v_limit_value;
END;
$$;

