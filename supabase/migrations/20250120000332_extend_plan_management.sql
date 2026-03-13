-- Extend Plan Management System
-- Adds locations, token pricing, AI levels, and additional features to subscription_plans
-- Extends company_plan_assignments with custom locations and token pricing
-- Updates existing functions to support new fields

-- 1. Extend subscription_plans table with new fields
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS included_locations INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT NULL, -- NULL = unlimited
ADD COLUMN IF NOT EXISTS token_price_cents INTEGER DEFAULT 1800, -- 18€ default (1800 cents)
ADD COLUMN IF NOT EXISTS max_additional_tokens_per_month INTEGER DEFAULT NULL, -- NULL = unlimited
ADD COLUMN IF NOT EXISTS ai_level TEXT DEFAULT 'none' CHECK (ai_level IN ('none', 'standard', 'advanced', 'enterprise')),
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS highlight BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id_yearly TEXT,
ADD COLUMN IF NOT EXISTS max_active_jobs INTEGER DEFAULT NULL; -- NULL = unlimited, -1 also means unlimited

-- 2. Extend company_plan_assignments table with new custom fields
ALTER TABLE public.company_plan_assignments
ADD COLUMN IF NOT EXISTS custom_locations INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_token_price_cents INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_max_additional_tokens_per_month INTEGER DEFAULT NULL;

-- 3. Update existing plans with data from plans.ts
-- Note: We use the plan IDs from plans.ts: free, basic, growth, bevisiblle, enterprise
-- But we also need to handle existing plans: starter, professional (if they exist)

-- First, ensure the plans from plans.ts exist
INSERT INTO public.subscription_plans (id, name, price_monthly_cents, price_yearly_cents, included_tokens, included_jobs, included_seats)
VALUES
  ('free', 'Free', 0, 0, 3, 0, 1),
  ('basic', 'Basic', 37900, 379000, 60, 10, 3),
  ('growth', 'Growth', 76900, 769000, 150, 20, 5),
  ('bevisiblle', 'BeVisiblle', 124900, 1249000, 500, 50, 10),
  ('enterprise', 'Enterprise', 0, 0, 0, -1, 0) -- -1 for jobs means unlimited
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  price_yearly_cents = EXCLUDED.price_yearly_cents,
  included_tokens = EXCLUDED.included_tokens,
  included_jobs = EXCLUDED.included_jobs,
  included_seats = EXCLUDED.included_seats;

-- Now update all plans with the new fields
UPDATE public.subscription_plans SET
  included_locations = CASE
    WHEN id = 'free' THEN 1
    WHEN id = 'basic' THEN 3
    WHEN id = 'growth' THEN 5
    WHEN id = 'bevisiblle' THEN 15
    WHEN id = 'enterprise' THEN NULL -- unlimited
    ELSE COALESCE(included_locations, 1)
  END,
  max_locations = CASE
    WHEN id = 'free' THEN 1
    WHEN id = 'basic' THEN 3
    WHEN id = 'growth' THEN 5
    WHEN id = 'bevisiblle' THEN 15
    WHEN id = 'enterprise' THEN NULL -- unlimited
    ELSE COALESCE(max_locations, 1)
  END,
  token_price_cents = COALESCE(token_price_cents, 1800), -- 18€ default
  max_additional_tokens_per_month = CASE
    WHEN id = 'free' THEN NULL -- unlimited durch Nachkauf
    WHEN id = 'basic' THEN 50
    WHEN id = 'growth' THEN 50
    WHEN id = 'bevisiblle' THEN NULL -- unlimited
    WHEN id = 'enterprise' THEN NULL -- unlimited
    ELSE COALESCE(max_additional_tokens_per_month, NULL)
  END,
  max_active_jobs = CASE
    WHEN id = 'free' THEN 0
    WHEN id = 'basic' THEN 10
    WHEN id = 'growth' THEN 20
    WHEN id = 'bevisiblle' THEN 50
    WHEN id = 'enterprise' THEN -1 -- unlimited
    ELSE COALESCE(max_active_jobs, 0)
  END,
  ai_level = CASE
    WHEN id = 'free' THEN 'none'
    WHEN id = 'basic' THEN 'none'
    WHEN id = 'growth' THEN 'standard'
    WHEN id = 'bevisiblle' THEN 'enterprise'
    WHEN id = 'enterprise' THEN 'enterprise'
    ELSE COALESCE(ai_level, 'none')
  END,
  sort_order = CASE
    WHEN id = 'free' THEN 0
    WHEN id = 'basic' THEN 1
    WHEN id = 'growth' THEN 2
    WHEN id = 'bevisiblle' THEN 3
    WHEN id = 'enterprise' THEN 4
    ELSE COALESCE(sort_order, 0)
  END,
  highlight = CASE
    WHEN id = 'growth' THEN true
    ELSE COALESCE(highlight, false)
  END
WHERE id IN ('free', 'basic', 'growth', 'bevisiblle', 'enterprise', 'starter', 'professional');

-- 4. Drop and recreate get_active_company_plan function to include new fields
-- We need to drop it first because the return type changed
DROP FUNCTION IF EXISTS public.get_active_company_plan(uuid);

CREATE OR REPLACE FUNCTION public.get_active_company_plan(p_company_id uuid)
RETURNS TABLE (
  plan_id text,
  plan_name text,
  tokens integer,
  jobs integer,
  seats integer,
  locations integer,
  price_monthly_cents integer,
  price_yearly_cents integer,
  token_price_cents integer,
  max_additional_tokens_per_month integer,
  ai_level text,
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
    COALESCE(cpa.custom_locations, sp.included_locations) as locations,
    COALESCE(cpa.custom_price_monthly_cents, sp.price_monthly_cents) as price_monthly_cents,
    COALESCE(cpa.custom_price_yearly_cents, sp.price_yearly_cents) as price_yearly_cents,
    COALESCE(cpa.custom_token_price_cents, sp.token_price_cents) as token_price_cents,
    COALESCE(cpa.custom_max_additional_tokens_per_month, sp.max_additional_tokens_per_month) as max_additional_tokens_per_month,
    sp.ai_level,
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

-- 5. Update admin_assign_plan function to support new fields
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
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Nur Admins können Pläne zuweisen';
  END IF;

  -- Validate billing_cycle
  IF p_billing_cycle NOT IN ('monthly', 'yearly', 'custom') THEN
    RAISE EXCEPTION 'Ungültiger billing_cycle. Erlaubt: monthly, yearly, custom';
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
    updated_at = now()
  WHERE id = p_company_id;

  RETURN v_assignment_id;
END;
$$;

-- 6. Add comments for documentation
COMMENT ON COLUMN public.subscription_plans.included_locations IS 'Number of locations included in the plan';
COMMENT ON COLUMN public.subscription_plans.max_locations IS 'Maximum number of locations allowed (NULL = unlimited)';
COMMENT ON COLUMN public.subscription_plans.token_price_cents IS 'Price per token in cents (default: 1800 = 18€)';
COMMENT ON COLUMN public.subscription_plans.max_additional_tokens_per_month IS 'Maximum additional tokens that can be purchased per month (NULL = unlimited)';
COMMENT ON COLUMN public.subscription_plans.ai_level IS 'AI level: none, standard, advanced, enterprise';
COMMENT ON COLUMN public.subscription_plans.sort_order IS 'Order for displaying plans (lower = first)';
COMMENT ON COLUMN public.subscription_plans.highlight IS 'Whether to highlight this plan (e.g., "Most Popular")';
COMMENT ON COLUMN public.subscription_plans.description IS 'Description of the plan';
COMMENT ON COLUMN public.subscription_plans.stripe_price_id_monthly IS 'Stripe Price ID for monthly billing';
COMMENT ON COLUMN public.subscription_plans.stripe_price_id_yearly IS 'Stripe Price ID for yearly billing';
COMMENT ON COLUMN public.subscription_plans.max_active_jobs IS 'Maximum active jobs allowed (-1 or NULL = unlimited)';

COMMENT ON COLUMN public.company_plan_assignments.custom_locations IS 'Custom location limit override for this company';
COMMENT ON COLUMN public.company_plan_assignments.custom_token_price_cents IS 'Custom token price override for this company';
COMMENT ON COLUMN public.company_plan_assignments.custom_max_additional_tokens_per_month IS 'Custom max additional tokens per month override for this company';

