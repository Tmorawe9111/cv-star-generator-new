-- ============================================
-- STEP 5: Cron Job für monatliche Token-Gutschrift
-- ============================================

-- 5.1: Function zum Gewähren monatlicher Tokens für alle aktiven Subscriptions
CREATE OR REPLACE FUNCTION public.grant_monthly_tokens_for_all_active_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company RECORD;
  v_tokens_to_grant INTEGER;
BEGIN
  -- Iteriere über alle Companies mit aktiven Subscriptions
  FOR v_company IN
    SELECT 
      c.id,
      c.active_plan_id,
      c.last_token_grant_at,
      c.next_billing_date,
      s.current_period_end
    FROM public.companies c
    INNER JOIN public.subscriptions s ON c.subscription_id = s.id
    WHERE s.status = 'active'
      AND c.active_plan_id != 'free'
      AND (
        -- Erste Token-Gutschrift (noch nie gewährt)
        c.last_token_grant_at IS NULL
        OR
        -- Monatliche Gutschrift (letzte Gutschrift war vor mehr als 28 Tagen)
        (c.last_token_grant_at < now() - interval '28 days' AND s.interval = 'month')
        OR
        -- Jährliche Gutschrift (letzte Gutschrift war vor mehr als 365 Tagen)
        (c.last_token_grant_at < now() - interval '365 days' AND s.interval = 'year')
      )
  LOOP
    -- Gewähre Tokens basierend auf Plan
    PERFORM public.grant_monthly_tokens(v_company.id, v_company.active_plan_id);
    
    -- Log
    RAISE NOTICE 'Granted monthly tokens for company % (plan: %)', v_company.id, v_company.active_plan_id;
  END LOOP;
END;
$$;

-- 5.2: Function zum Prüfen und Aktualisieren von Subscriptions
CREATE OR REPLACE FUNCTION public.check_and_update_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  -- Finde Subscriptions, deren Period abgelaufen ist
  FOR v_subscription IN
    SELECT 
      s.id,
      s.company_id,
      s.stripe_subscription_id,
      s.current_period_end,
      s.status
    FROM public.subscriptions s
    WHERE s.status = 'active'
      AND s.current_period_end < now()
  LOOP
    -- Markiere als past_due (wird später durch Webhook aktualisiert)
    UPDATE public.subscriptions
    SET status = 'past_due', updated_at = now()
    WHERE id = v_subscription.id;
    
    -- Deaktiviere Features für diese Company
    UPDATE public.company_features
    SET enabled = false, updated_at = now()
    WHERE company_id = v_subscription.company_id;
    
    RAISE NOTICE 'Subscription % expired, features disabled', v_subscription.id;
  END LOOP;
END;
$$;

-- 5.3: Cron Job Setup (wird von Supabase Cron ausgeführt)
-- Diese Funktionen können über pg_cron oder Supabase Cron aufgerufen werden
-- Beispiel: SELECT cron.schedule('grant-monthly-tokens', '0 0 1 * *', 'SELECT public.grant_monthly_tokens_for_all_active_subscriptions()');

-- 5.4: Helper Function zum manuellen Ausführen (für Tests)
CREATE OR REPLACE FUNCTION public.run_monthly_token_grant()
RETURNS TABLE(company_id UUID, plan_key TEXT, tokens_granted INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company RECORD;
  v_tokens INTEGER;
BEGIN
  -- Führe Token-Gutschrift aus
  PERFORM public.grant_monthly_tokens_for_all_active_subscriptions();
  
  -- Prüfe Subscriptions
  PERFORM public.check_and_update_subscriptions();
  
  -- Return summary (optional)
  RETURN QUERY
  SELECT 
    c.id,
    c.active_plan_id,
    CASE 
      WHEN c.active_plan_id = 'basic' THEN 30
      WHEN c.active_plan_id = 'growth' THEN 150
      ELSE 0
    END as tokens_granted
  FROM public.companies c
  WHERE c.active_plan_id != 'free'
    AND c.last_token_grant_at >= now() - interval '1 hour';
END;
$$;

