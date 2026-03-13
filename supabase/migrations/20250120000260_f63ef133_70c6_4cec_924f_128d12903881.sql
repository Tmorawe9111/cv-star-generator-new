-- Check if subscription_plans exists and modify it if needed
DO $$ 
BEGIN
  -- Drop table if exists to recreate with correct schema
  DROP TABLE IF EXISTS public.company_plan_assignments CASCADE;
  DROP TABLE IF EXISTS public.subscription_plans CASCADE;
END $$;

-- Create subscription plans table with correct schema
CREATE TABLE public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly_cents integer NOT NULL DEFAULT 0,
  price_yearly_cents integer NOT NULL DEFAULT 0,
  included_tokens integer NOT NULL DEFAULT 0,
  included_jobs integer NOT NULL DEFAULT 0,
  included_seats integer NOT NULL DEFAULT 1,
  features jsonb DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (active = true);

-- Admins can manage plans
CREATE POLICY "Admins can manage plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default plans (without description column)
INSERT INTO public.subscription_plans (id, name, price_monthly_cents, price_yearly_cents, included_tokens, included_jobs, included_seats)
VALUES
  ('free', 'Free', 0, 0, 10, 1, 1),
  ('starter', 'Starter', 4900, 49000, 50, 5, 3),
  ('professional', 'Professional', 9900, 99000, 150, 15, 10),
  ('enterprise', 'Enterprise', 19900, 199000, 500, 50, 50);

-- Create company plan assignments table
CREATE TABLE public.company_plan_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id),
  custom_price_monthly_cents integer,
  custom_price_yearly_cents integer,
  custom_tokens integer,
  custom_jobs integer,
  custom_seats integer,
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly', 'custom')),
  valid_from timestamp with time zone NOT NULL DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, plan_id, valid_from)
);

-- Enable RLS
ALTER TABLE public.company_plan_assignments ENABLE ROW LEVEL SECURITY;

-- Company members can view their assignments
CREATE POLICY "Company members can view their assignments"
ON public.company_plan_assignments
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM company_users
    WHERE user_id = auth.uid()
  )
);

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments"
ON public.company_plan_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create function to get active plan for a company
CREATE OR REPLACE FUNCTION public.get_active_company_plan(p_company_id uuid)
RETURNS TABLE (
  plan_id text,
  plan_name text,
  tokens integer,
  jobs integer,
  seats integer,
  price_monthly_cents integer,
  price_yearly_cents integer,
  billing_cycle text,
  valid_until timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cpa.plan_id,
    sp.name as plan_name,
    COALESCE(cpa.custom_tokens, sp.included_tokens) as tokens,
    COALESCE(cpa.custom_jobs, sp.included_jobs) as jobs,
    COALESCE(cpa.custom_seats, sp.included_seats) as seats,
    COALESCE(cpa.custom_price_monthly_cents, sp.price_monthly_cents) as price_monthly_cents,
    COALESCE(cpa.custom_price_yearly_cents, sp.price_yearly_cents) as price_yearly_cents,
    cpa.billing_cycle,
    cpa.valid_until
  FROM company_plan_assignments cpa
  JOIN subscription_plans sp ON cpa.plan_id = sp.id
  WHERE cpa.company_id = p_company_id
    AND cpa.is_active = true
    AND cpa.valid_from <= now()
    AND (cpa.valid_until IS NULL OR cpa.valid_until > now())
  ORDER BY cpa.created_at DESC
  LIMIT 1;
$$;

-- Create function to assign plan to company
CREATE OR REPLACE FUNCTION public.admin_assign_plan(
  p_company_id uuid,
  p_plan_id text,
  p_custom_price_monthly_cents integer DEFAULT NULL,
  p_custom_price_yearly_cents integer DEFAULT NULL,
  p_custom_tokens integer DEFAULT NULL,
  p_custom_jobs integer DEFAULT NULL,
  p_custom_seats integer DEFAULT NULL,
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
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Nur Admins können Pläne zuweisen';
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
    p_billing_cycle,
    p_valid_from,
    p_valid_until,
    p_notes,
    v_admin_id
  ) RETURNING id INTO v_assignment_id;

  -- Update company table
  UPDATE companies
  SET 
    plan_type = p_plan_id,
    seats = COALESCE(p_custom_seats, (SELECT included_seats FROM subscription_plans WHERE id = p_plan_id)),
    updated_at = now()
  WHERE id = p_company_id;

  RETURN v_assignment_id;
END;
$$;

-- Create function to add tokens to company
CREATE OR REPLACE FUNCTION public.admin_add_tokens(
  p_company_id uuid,
  p_amount integer,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Check if user is admin
  v_admin_id := auth.uid();
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_admin_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Nur Admins können Tokens hinzufügen';
  END IF;

  -- Update wallet
  INSERT INTO company_token_wallets (company_id, balance)
  VALUES (p_company_id, p_amount)
  ON CONFLICT (company_id) 
  DO UPDATE SET 
    balance = company_token_wallets.balance + p_amount,
    updated_at = now();

  -- Log activity
  INSERT INTO company_activity (
    company_id,
    actor_user_id,
    type,
    payload
  ) VALUES (
    p_company_id,
    v_admin_id,
    'tokens_adjusted',
    jsonb_build_object(
      'amount', p_amount,
      'reason', p_reason,
      'admin_id', v_admin_id
    )
  );
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION update_company_plan_assignment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_company_plan_assignment_updated_at
BEFORE UPDATE ON company_plan_assignments
FOR EACH ROW
EXECUTE FUNCTION update_company_plan_assignment_updated_at();