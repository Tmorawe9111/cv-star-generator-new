-- Migration 3: company_plans table with plan tiers and quotas

-- Create company_plans table
CREATE TABLE IF NOT EXISTS public.company_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  
  -- Pricing
  monthly_price_cents integer NOT NULL DEFAULT 0,
  yearly_price_cents integer NOT NULL DEFAULT 0,
  
  -- Quotas
  monthly_views_quota integer NOT NULL DEFAULT 0,
  monthly_unlocks_quota integer NOT NULL DEFAULT 0,
  included_seats integer NOT NULL DEFAULT 1,
  included_tokens integer NOT NULL DEFAULT 0,
  
  -- Features
  features jsonb DEFAULT '[]'::jsonb,
  
  -- Status
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert initial plan tiers
INSERT INTO public.company_plans (id, name, code, monthly_price_cents, yearly_price_cents, monthly_views_quota, monthly_unlocks_quota, included_seats, included_tokens, sort_order, features) VALUES
  ('free', 'Free', 'free', 0, 0, 50, 5, 1, 0, 1, '["Basic candidate search", "Limited unlocks"]'::jsonb),
  ('starter', 'Starter', 'starter', 9900, 99000, 200, 20, 2, 100, 2, '["Extended candidate search", "20 unlocks/month", "2 seats", "100 tokens"]'::jsonb),
  ('growth', 'Growth', 'growth', 29900, 299000, 1000, 100, 5, 500, 3, '["Full candidate search", "100 unlocks/month", "5 seats", "500 tokens", "Priority support"]'::jsonb),
  ('enterprise', 'Enterprise', 'enterprise', 99900, 999000, -1, -1, 20, 2000, 4, '["Unlimited search & unlocks", "20 seats", "2000 tokens", "Dedicated support", "Custom integrations"]'::jsonb);

-- Enable RLS
ALTER TABLE public.company_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Plans are viewable by everyone"
  ON public.company_plans
  FOR SELECT
  USING (active = true);

-- Create updated_at trigger
CREATE TRIGGER set_company_plans_updated_at
  BEFORE UPDATE ON public.company_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();