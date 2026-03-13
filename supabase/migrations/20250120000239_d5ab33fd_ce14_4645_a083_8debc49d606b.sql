-- Add subscription and billing tables for company onboarding
CREATE TABLE public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the subscription plans
INSERT INTO public.subscription_plans (id, name, price_cents, features) VALUES
('free', 'Free', 0, '{"requirement_profiles": 0, "tokens_per_month": 2, "discount_percentage": 0, "recruiter_seats": 1, "locations": 1}'),
('starter', 'Starter', 29900, '{"requirement_profiles": 5, "tokens_per_month": 40, "discount_percentage": 15, "recruiter_seats": 1, "locations": 3}'),
('premium', 'Premium', 88900, '{"requirement_profiles": 15, "tokens_per_month": 120, "discount_percentage": 25, "recruiter_seats": 5, "locations": 8}');

-- Add token packages table
CREATE TABLE public.token_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert token packages
INSERT INTO public.token_packages (credits, price_cents) VALUES
(30, 34000),
(90, 120000),
(240, 300000);

-- Update companies table for onboarding
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS current_plan_id TEXT DEFAULT 'free';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription plans (public read)
CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans
FOR SELECT USING (active = true);

-- Create policies for token packages (public read)
CREATE POLICY "token_packages_public_read" ON public.token_packages
FOR SELECT USING (active = true);

-- Create function to get user's company token balance
CREATE OR REPLACE FUNCTION public.get_company_token_balance(company_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(token_balance, 0)
  FROM companies 
  WHERE id = company_uuid;
$$;

-- Create function to deduct tokens
CREATE OR REPLACE FUNCTION public.deduct_company_tokens(company_uuid UUID, token_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT token_balance INTO current_balance
  FROM companies 
  WHERE id = company_uuid;
  
  -- Check if sufficient balance
  IF current_balance >= token_amount THEN
    -- Deduct tokens
    UPDATE companies 
    SET token_balance = token_balance - token_amount,
        updated_at = now()
    WHERE id = company_uuid;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;