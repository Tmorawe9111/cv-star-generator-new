-- Drop and recreate use_company_token to fix token balance check
DROP FUNCTION IF EXISTS public.use_company_token(uuid, uuid, integer, text);

CREATE FUNCTION public.use_company_token(
  p_company_id uuid,
  p_profile_id uuid,
  p_token_cost integer,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
BEGIN
  -- Get current active_tokens balance
  SELECT active_tokens INTO v_current_balance
  FROM companies
  WHERE id = p_company_id
  FOR UPDATE;

  -- Check if company exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Firma nicht gefunden'
    );
  END IF;

  -- Check if sufficient tokens
  IF v_current_balance < p_token_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nicht genügend Tokens verfügbar'
    );
  END IF;

  -- Deduct tokens from active_tokens
  UPDATE companies
  SET 
    active_tokens = active_tokens - p_token_cost,
    updated_at = now()
  WHERE id = p_company_id;

  -- Log the transaction in tokens_used table
  INSERT INTO tokens_used (
    company_id,
    profile_id,
    tokens,
    reason,
    created_at
  )
  VALUES (
    p_company_id,
    p_profile_id,
    p_token_cost,
    p_reason,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_current_balance - p_token_cost
  );
END;
$$;