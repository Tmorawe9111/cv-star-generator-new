-- 1. Add next_refill_date to company_plan_assignments
ALTER TABLE company_plan_assignments 
ADD COLUMN IF NOT EXISTS next_refill_date DATE;

-- 2. Function to refill tokens based on active plan
CREATE OR REPLACE FUNCTION refill_monthly_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment RECORD;
  v_plan RECORD;
  v_tokens_to_add INTEGER;
BEGIN
  -- Find all active plans that need token refill today
  FOR v_assignment IN
    SELECT 
      cpa.id,
      cpa.company_id,
      cpa.plan_id,
      cpa.custom_tokens,
      cpa.next_refill_date,
      cpa.valid_from
    FROM company_plan_assignments cpa
    WHERE cpa.is_active = true
      AND cpa.next_refill_date <= CURRENT_DATE
      AND (cpa.valid_until IS NULL OR cpa.valid_until >= CURRENT_DATE)
  LOOP
    -- Get plan details
    SELECT * INTO v_plan
    FROM subscription_plans
    WHERE id = v_assignment.plan_id;
    
    -- Determine how many tokens to add
    v_tokens_to_add := COALESCE(v_assignment.custom_tokens, v_plan.included_tokens);
    
    -- Skip if no tokens to add
    IF v_tokens_to_add > 0 THEN
      -- Ensure wallet exists
      PERFORM ensure_company_wallet(v_assignment.company_id);
      
      -- Add tokens
      UPDATE company_token_wallets
      SET 
        balance = balance + v_tokens_to_add,
        updated_at = now()
      WHERE company_id = v_assignment.company_id;
      
      -- Update companies table for backwards compatibility
      UPDATE companies
      SET 
        token_balance = (SELECT balance FROM company_token_wallets WHERE company_id = v_assignment.company_id),
        active_tokens = (SELECT balance FROM company_token_wallets WHERE company_id = v_assignment.company_id)
      WHERE id = v_assignment.company_id;
      
      -- Log the refill
      INSERT INTO company_activity (
        company_id,
        actor_user_id,
        type,
        payload
      ) VALUES (
        v_assignment.company_id,
        '00000000-0000-0000-0000-000000000000', -- System user
        'tokens_adjusted',
        jsonb_build_object(
          'amount', v_tokens_to_add,
          'new_balance', (SELECT balance FROM company_token_wallets WHERE company_id = v_assignment.company_id),
          'reason', 'Monthly token refill for plan: ' || v_plan.name,
          'plan_id', v_assignment.plan_id,
          'refill_date', CURRENT_DATE
        )
      );
      
      RAISE NOTICE 'Refilled % tokens for company %', v_tokens_to_add, v_assignment.company_id;
    END IF;
    
    -- Update next refill date (add 1 month)
    UPDATE company_plan_assignments
    SET next_refill_date = next_refill_date + INTERVAL '1 month'
    WHERE id = v_assignment.id;
  END LOOP;
END;
$$;

-- 3. Drop and recreate admin_assign_plan function
DROP FUNCTION IF EXISTS public.admin_assign_plan(uuid,text,integer,integer,integer,integer,integer,text,timestamp with time zone,timestamp with time zone,text);

CREATE OR REPLACE FUNCTION public.admin_assign_plan(
  p_company_id UUID,
  p_plan_id TEXT,
  p_custom_price_monthly_cents INTEGER DEFAULT NULL,
  p_custom_price_yearly_cents INTEGER DEFAULT NULL,
  p_custom_tokens INTEGER DEFAULT NULL,
  p_custom_jobs INTEGER DEFAULT NULL,
  p_custom_seats INTEGER DEFAULT NULL,
  p_billing_cycle TEXT DEFAULT 'monthly',
  p_valid_from TIMESTAMPTZ DEFAULT now(),
  p_valid_until TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan RECORD;
  v_tokens_to_add INTEGER;
  v_next_refill DATE;
BEGIN
  -- Get plan details
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = p_plan_id;
  
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Plan not found: %', p_plan_id;
  END IF;
  
  -- Deactivate existing active plans
  UPDATE company_plan_assignments
  SET is_active = false
  WHERE company_id = p_company_id
    AND is_active = true;
  
  -- Calculate next refill date (1 month from valid_from)
  v_next_refill := (p_valid_from + INTERVAL '1 month')::DATE;
  
  -- Insert new plan assignment
  INSERT INTO company_plan_assignments (
    company_id,
    plan_id,
    custom_price_monthly_cents,
    custom_price_yearly_cents,
    custom_tokens,
    custom_jobs,
    custom_seats,
    billing_cycle,
    valid_from,
    valid_until,
    notes,
    assigned_by,
    is_active,
    next_refill_date
  ) VALUES (
    p_company_id,
    p_plan_id,
    p_custom_price_monthly_cents,
    p_custom_price_yearly_cents,
    p_custom_tokens,
    p_custom_jobs,
    p_custom_seats,
    p_billing_cycle,
    p_valid_from,
    p_valid_until,
    p_notes,
    auth.uid(),
    true,
    v_next_refill
  );
  
  -- Add initial tokens
  v_tokens_to_add := COALESCE(p_custom_tokens, v_plan.included_tokens);
  
  IF v_tokens_to_add > 0 THEN
    -- Ensure wallet exists
    PERFORM ensure_company_wallet(p_company_id);
    
    -- Add tokens
    UPDATE company_token_wallets
    SET 
      balance = balance + v_tokens_to_add,
      updated_at = now()
    WHERE company_id = p_company_id;
    
    -- Update companies table
    UPDATE companies
    SET 
      token_balance = (SELECT balance FROM company_token_wallets WHERE company_id = p_company_id),
      active_tokens = (SELECT balance FROM company_token_wallets WHERE company_id = p_company_id)
    WHERE id = p_company_id;
    
    -- Log the initial token grant
    INSERT INTO company_activity (
      company_id,
      actor_user_id,
      type,
      payload
    ) VALUES (
      p_company_id,
      auth.uid(),
      'tokens_adjusted',
      jsonb_build_object(
        'amount', v_tokens_to_add,
        'new_balance', (SELECT balance FROM company_token_wallets WHERE company_id = p_company_id),
        'reason', 'Initial tokens for plan: ' || v_plan.name,
        'plan_id', p_plan_id
      )
    );
  END IF;
  
  -- Log plan assignment
  INSERT INTO company_activity (
    company_id,
    actor_user_id,
    type,
    payload
  ) VALUES (
    p_company_id,
    auth.uid(),
    'plan_assigned',
    jsonb_build_object(
      'plan_id', p_plan_id,
      'plan_name', v_plan.name,
      'tokens', v_tokens_to_add,
      'billing_cycle', p_billing_cycle,
      'next_refill', v_next_refill
    )
  );
END;
$$;

-- 4. Schedule the cron job to run daily at 00:00 UTC
SELECT cron.schedule(
  'monthly-token-refill',
  '0 0 * * *', -- Daily at midnight UTC
  $$
  SELECT refill_monthly_tokens();
  $$
);