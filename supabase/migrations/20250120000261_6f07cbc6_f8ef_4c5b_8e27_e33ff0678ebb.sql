-- 1. Update subscription plans with correct names and values (using correct column names)
DELETE FROM subscription_plans WHERE id IN ('free', 'base', 'pro', 'custom');

INSERT INTO subscription_plans (
  id, 
  name, 
  price_monthly_cents, 
  price_yearly_cents, 
  included_tokens, 
  included_jobs, 
  included_seats, 
  active
) VALUES
('free', 'Free', 0, 0, 10, 1, 1, true),
('base', 'Base', 4900, 49000, 50, 5, 3, true),
('pro', 'Pro', 9900, 99000, 150, 15, 10, true),
('custom', 'Custom', 0, 0, 0, 0, 0, true);

-- 2. Create function to ensure company has a token wallet
CREATE OR REPLACE FUNCTION public.ensure_company_wallet(p_company_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  SELECT id INTO v_wallet_id
  FROM company_token_wallets
  WHERE company_id = p_company_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO company_token_wallets (company_id, balance)
    VALUES (p_company_id, 0)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  RETURN v_wallet_id;
END;
$$;

-- 3. Create trigger to auto-create wallet for new companies
CREATE OR REPLACE FUNCTION public.auto_create_company_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO company_token_wallets (company_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_create_company_wallet ON companies;
CREATE TRIGGER trigger_auto_create_company_wallet
AFTER INSERT ON companies
FOR EACH ROW
EXECUTE FUNCTION auto_create_company_wallet();

-- 4. Initialize wallets for existing companies
INSERT INTO company_token_wallets (company_id, balance)
SELECT id, COALESCE(token_balance, 0)
FROM companies
WHERE id NOT IN (SELECT company_id FROM company_token_wallets)
ON CONFLICT (company_id) DO NOTHING;

-- 5. Improve admin_add_tokens function
CREATE OR REPLACE FUNCTION public.admin_add_tokens(
  p_company_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance INTEGER;
BEGIN
  v_wallet_id := ensure_company_wallet(p_company_id);
  
  UPDATE company_token_wallets
  SET 
    balance = balance + p_amount,
    updated_at = now()
  WHERE company_id = p_company_id
  RETURNING balance INTO v_new_balance;
  
  UPDATE companies
  SET 
    token_balance = v_new_balance,
    active_tokens = v_new_balance
  WHERE id = p_company_id;
  
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
      'amount', p_amount,
      'new_balance', v_new_balance,
      'reason', p_reason
    )
  );
END;
$$;

-- 6. Enable Realtime for company_token_wallets
ALTER TABLE company_token_wallets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE company_token_wallets;