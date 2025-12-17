-- Ensure admin_assign_plan function exists with all required parameters
-- This migration ensures the function works correctly for admin plan assignments

-- First, drop all existing versions of the function
-- Use CASCADE to drop all overloaded versions
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop all versions of admin_assign_plan
  FOR r IN 
    SELECT oid::regprocedure 
    FROM pg_proc 
    WHERE proname = 'admin_assign_plan' 
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
  END LOOP;
END $$;

-- Now create the new version with all parameters
CREATE OR REPLACE FUNCTION public.admin_assign_plan(
  p_company_id uuid,
  p_plan_id text,
  p_custom_price_monthly_cents integer DEFAULT NULL,
  p_custom_price_yearly_cents integer DEFAULT NULL,
  p_custom_tokens integer DEFAULT NULL,
  p_custom_jobs integer DEFAULT NULL,
  p_custom_seats integer DEFAULT NULL,
  p_custom_locations integer DEFAULT NULL,
  p_custom_token_price_cents integer DEFAULT NULL,
  p_custom_max_additional_tokens_per_month integer DEFAULT NULL,
  p_billing_cycle text DEFAULT 'monthly',
  p_valid_from timestamp with time zone DEFAULT now(),
  p_valid_until timestamp with time zone DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment_id uuid;
  v_admin_id uuid;
BEGIN
  -- Check if user is admin
  v_admin_id := auth.uid();
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_admin_id
    AND role = 'admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Nur Admins können Pläne zuweisen';
  END IF;

  -- Check if admin has access to this company (via access code)
  IF NOT public.admin_has_company_access(v_admin_id, p_company_id) THEN
    RAISE EXCEPTION 'Sie benötigen einen Freigabe-Code, um Pläne für dieses Unternehmen zu ändern. Bitte geben Sie den Code im Unternehmensprofil ein.';
  END IF;

  -- Validate billing_cycle
  IF p_billing_cycle NOT IN ('monthly', 'yearly', 'custom') THEN
    RAISE EXCEPTION 'Ungültiger billing_cycle. Erlaubt: monthly, yearly, custom';
  END IF;

  -- Validate plan exists
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE id = p_plan_id AND active = true) THEN
    RAISE EXCEPTION 'Plan nicht gefunden oder inaktiv: %', p_plan_id;
  END IF;

  -- Deactivate current active assignments
  UPDATE company_plan_assignments
  SET is_active = false,
      updated_at = now()
  WHERE company_id = p_company_id
    AND is_active = true;

  -- Insert new assignment
  INSERT INTO company_plan_assignments (
    company_id,
    plan_id,
    custom_price_monthly_cents,
    custom_price_yearly_cents,
    custom_tokens,
    custom_jobs,
    custom_seats,
    custom_locations,
    custom_token_price_cents,
    custom_max_additional_tokens_per_month,
    billing_cycle,
    valid_from,
    valid_until,
    notes,
    assigned_by
  ) VALUES (
    p_company_id,
    p_plan_id,
    p_custom_price_monthly_cents,
    p_custom_price_yearly_cents,
    p_custom_tokens,
    p_custom_jobs,
    p_custom_seats,
    p_custom_locations,
    p_custom_token_price_cents,
    p_custom_max_additional_tokens_per_month,
    p_billing_cycle,
    p_valid_from,
    p_valid_until,
    p_notes,
    v_admin_id
  ) RETURNING id INTO v_assignment_id;

  -- Update company table
  UPDATE companies
  SET 
    selected_plan_id = p_plan_id,
    plan_type = p_plan_id,
    updated_at = now()
  WHERE id = p_company_id;

  -- Add tokens if custom_tokens is set
  IF p_custom_tokens IS NOT NULL AND p_custom_tokens > 0 THEN
    INSERT INTO company_token_wallets (company_id, balance)
    VALUES (p_company_id, p_custom_tokens)
    ON CONFLICT (company_id) 
    DO UPDATE SET 
      balance = company_token_wallets.balance + p_custom_tokens,
      updated_at = now();
  END IF;

  RETURN v_assignment_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_assign_plan TO authenticated;

