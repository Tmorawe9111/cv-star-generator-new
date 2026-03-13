-- Fix unlock system issues

-- 1. Ensure company has token wallet
INSERT INTO public.company_token_wallets (company_id, balance)
SELECT 
  cu.company_id,
  100 -- Start with 100 tokens
FROM public.company_users cu
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de'
  AND cu.accepted_at IS NOT NULL
ON CONFLICT (company_id) DO UPDATE SET
  balance = GREATEST(company_token_wallets.balance, 100);

-- 2. Ensure company has default pipeline
INSERT INTO public.company_pipelines (company_id, name)
SELECT 
  cu.company_id,
  'Standard Pipeline'
FROM public.company_users cu
JOIN auth.users u ON cu.user_id = u.id
WHERE u.email = 'team@ausbildungsbasis.de'
  AND cu.accepted_at IS NOT NULL
ON CONFLICT (company_id) DO NOTHING;

-- 3. Create default pipeline stages if they don't exist
INSERT INTO public.pipeline_stages (pipeline_id, name, position, color)
SELECT 
  cp.id,
  stage_data.name,
  stage_data.position,
  stage_data.color
FROM public.company_pipelines cp
JOIN public.company_users cu ON cp.company_id = cu.company_id
JOIN auth.users u ON cu.user_id = u.id
CROSS JOIN (
  VALUES 
    ('Neu', 1, '#3B82F6'),
    ('Kontaktiert', 2, '#10B981'),
    ('Interview', 3, '#F59E0B'),
    ('Angebot', 4, '#8B5CF6'),
    ('Abgelehnt', 5, '#EF4444')
) AS stage_data(name, position, color)
WHERE u.email = 'team@ausbildungsbasis.de'
  AND cu.accepted_at IS NOT NULL
ON CONFLICT (pipeline_id, position) DO NOTHING;

-- 4. Fix rpc_get_company_id function to handle edge cases
CREATE OR REPLACE FUNCTION public.rpc_get_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Get company_id for authenticated user
  SELECT company_id INTO v_company_id
  FROM public.company_users
  WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL -- Only accepted company users
  ORDER BY created_at ASC -- Get first company if user has multiple
  LIMIT 1;
  
  -- Return null if no company found (will trigger 'no_company' error in unlock functions)
  RETURN v_company_id;
END;
$$;

-- 5. Add better error handling to unlock functions
CREATE OR REPLACE FUNCTION public.rpc_unlock_basic(p_profile uuid, p_idem text, p_job uuid, p_general boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company uuid;
  v_has_basic boolean;
  v_has_contact boolean;
  v_wallet_balance integer;
BEGIN
  -- Get company ID
  SELECT public.rpc_get_company_id() INTO v_company;
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'no_company' USING HINT = 'User is not associated with any company or company access not accepted';
  END IF;

  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM public.profile_unlocks 
    WHERE company_id = v_company 
      AND profile_id = p_profile 
      AND level IN ('basic', 'contact')
  ) INTO v_has_basic;
  
  IF v_has_basic THEN
    RETURN 'already_basic';
  END IF;

  -- Check wallet balance
  SELECT balance INTO v_wallet_balance
  FROM public.company_token_wallets 
  WHERE company_id = v_company;
  
  IF v_wallet_balance IS NULL OR v_wallet_balance < 1 THEN
    RETURN 'insufficient_funds';
  END IF;

  -- Perform transaction with better error handling
  BEGIN
    -- Lock for idempotency
    PERFORM pg_advisory_xact_lock(hashtext(COALESCE(p_idem, '')));
    
    -- Update wallet
    UPDATE public.company_token_wallets 
    SET balance = balance - 1 
    WHERE company_id = v_company;
    
    -- Insert transaction record
    INSERT INTO public.token_transactions(
      company_id, 
      delta, 
      reason, 
      profile_id, 
      idempotency_key
    ) VALUES (
      v_company, 
      -1, 
      'unlock_basic', 
      p_profile, 
      p_idem
    );
    
    -- Insert unlock record
    INSERT INTO public.profile_unlocks(
      company_id, 
      profile_id, 
      level, 
      job_posting_id, 
      general_interest
    ) VALUES (
      v_company, 
      p_profile, 
      'basic', 
      p_job, 
      COALESCE(p_general, false)
    );
    
    RETURN 'unlocked_basic';
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- Rollback wallet update
      UPDATE public.company_token_wallets 
      SET balance = balance + 1 
      WHERE company_id = v_company;
      RETURN 'idempotent_duplicate';
    WHEN OTHERS THEN
      -- Rollback wallet update
      UPDATE public.company_token_wallets 
      SET balance = balance + 1 
      WHERE company_id = v_company;
      RAISE;
  END;
END;
$$;
