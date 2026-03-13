-- Fix renewal date calculation: should be same day next month/year based on purchase date
-- Update the activate_subscription function to calculate next_billing_date correctly

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

