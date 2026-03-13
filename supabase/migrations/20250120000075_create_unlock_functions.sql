-- Create unlock system functions

-- 1. Create rpc_get_company_id function
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

-- 2. Create rpc_unlock_basic function
CREATE OR REPLACE FUNCTION public.rpc_unlock_basic(p_profile uuid, p_idem text, p_job uuid, p_general boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company uuid;
  v_has_basic boolean;
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

-- 3. Create rpc_unlock_contact function
CREATE OR REPLACE FUNCTION public.rpc_unlock_contact(p_profile uuid, p_idem text, p_job uuid, p_general boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company uuid;
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
      AND level = 'contact'
  ) INTO v_has_contact;
  
  IF v_has_contact THEN
    RETURN 'already_contact';
  END IF;

  -- Check wallet balance (needs 2 tokens)
  SELECT balance INTO v_wallet_balance
  FROM public.company_token_wallets 
  WHERE company_id = v_company;
  
  IF v_wallet_balance IS NULL OR v_wallet_balance < 2 THEN
    RETURN 'insufficient_funds';
  END IF;

  -- Perform transaction with better error handling
  BEGIN
    -- Lock for idempotency
    PERFORM pg_advisory_xact_lock(hashtext(COALESCE(p_idem, '')));
    
    -- Update wallet
    UPDATE public.company_token_wallets 
    SET balance = balance - 2 
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
      -2, 
      'unlock_contact', 
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
      'contact', 
      p_job, 
      COALESCE(p_general, false)
    );
    
    RETURN 'unlocked_contact';
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- Rollback wallet update
      UPDATE public.company_token_wallets 
      SET balance = balance + 2 
      WHERE company_id = v_company;
      RETURN 'idempotent_duplicate';
    WHEN OTHERS THEN
      -- Rollback wallet update
      UPDATE public.company_token_wallets 
      SET balance = balance + 2 
      WHERE company_id = v_company;
      RAISE;
  END;
END;
$$;

-- 4. Create rpc_is_unlocked function
CREATE OR REPLACE FUNCTION public.rpc_is_unlocked(p_profile uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company uuid;
  v_basic boolean := false;
  v_contact boolean := false;
BEGIN
  -- Get company ID
  SELECT public.rpc_get_company_id() INTO v_company;
  IF v_company IS NULL THEN
    RETURN jsonb_build_object('basic', false, 'contact', false);
  END IF;

  -- Check basic unlock
  SELECT EXISTS(
    SELECT 1 FROM public.profile_unlocks 
    WHERE company_id = v_company 
      AND profile_id = p_profile 
      AND level = 'basic'
  ) INTO v_basic;
  
  -- Check contact unlock
  SELECT EXISTS(
    SELECT 1 FROM public.profile_unlocks 
    WHERE company_id = v_company 
      AND profile_id = p_profile 
      AND level = 'contact'
  ) INTO v_contact;

  RETURN jsonb_build_object('basic', v_basic, 'contact', v_contact);
END;
$$;

-- 5. Create rpc_log_access function
CREATE OR REPLACE FUNCTION public.rpc_log_access(p_profile uuid, p_object_type text, p_object_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company uuid;
BEGIN
  -- Get company ID
  SELECT public.rpc_get_company_id() INTO v_company;
  IF v_company IS NULL THEN
    RETURN;
  END IF;

  -- Insert access log
  INSERT INTO public.data_access_log(
    company_id,
    profile_id,
    object_type,
    object_id,
    action
  ) VALUES (
    v_company,
    p_profile,
    p_object_type,
    p_object_id,
    'view'
  );
END;
$$;
