-- Fix use_company_token function to use correct column name
CREATE OR REPLACE FUNCTION public.use_company_token(
  p_company_id UUID,
  p_profile_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Token-Balance prüfen (korrigierte Spalte: balance statt tokens_available)
  SELECT balance INTO v_available
  FROM company_token_wallets
  WHERE company_id = p_company_id;
  
  -- Wenn keine Tokens verfügbar, Fehler zurückgeben
  IF v_available IS NULL OR v_available < 1 THEN
    RAISE EXCEPTION 'Nicht genügend Tokens verfügbar';
  END IF;
  
  -- Token abziehen
  UPDATE company_token_wallets
  SET 
    balance = balance - 1,
    tokens_used = tokens_used + 1,
    updated_at = now()
  WHERE company_id = p_company_id;
  
  RETURN jsonb_build_object('success', true, 'tokens_remaining', v_available - 1);
END;
$$;