-- Add total_tokens_ever column to track all tokens ever granted/purchased
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS total_tokens_ever INTEGER DEFAULT 0;

-- Update existing companies: set total_tokens_ever to current active_tokens (as baseline)
UPDATE public.companies
SET total_tokens_ever = COALESCE(active_tokens, 0)
WHERE total_tokens_ever IS NULL OR total_tokens_ever = 0;

-- Update grant_monthly_tokens to track total_tokens_ever
CREATE OR REPLACE FUNCTION public.grant_monthly_tokens(
  p_company_id UUID,
  p_plan_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tokens_to_grant INTEGER;
  v_current_tokens INTEGER;
BEGIN
  -- Bestimme Token-Anzahl basierend auf Plan
  CASE p_plan_key
    WHEN 'basic' THEN
      v_tokens_to_grant := 30;
    WHEN 'growth' THEN
      v_tokens_to_grant := 100;
    WHEN 'enterprise' THEN
      v_tokens_to_grant := 500;
    ELSE
      v_tokens_to_grant := 0;
  END CASE;

  IF v_tokens_to_grant > 0 THEN
    -- Hole aktuelle Token
    SELECT COALESCE(active_tokens, 0) INTO v_current_tokens
    FROM public.companies
    WHERE id = p_company_id;

    -- Füge Tokens hinzu und tracke in total_tokens_ever
    UPDATE public.companies
    SET 
      active_tokens = COALESCE(active_tokens, 0) + v_tokens_to_grant,
      total_tokens_ever = COALESCE(total_tokens_ever, 0) + v_tokens_to_grant,
      last_token_grant_at = now(),
      updated_at = now()
    WHERE id = p_company_id;
  END IF;
END;
$$;

-- Update stripe-webhook to track total_tokens_ever when tokens are purchased
-- This will be handled in the Edge Function, but we add a helper function here

-- Function to add purchased tokens and track total
CREATE OR REPLACE FUNCTION public.add_purchased_tokens(
  p_company_id UUID,
  p_token_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies
  SET 
    active_tokens = COALESCE(active_tokens, 0) + p_token_amount,
    total_tokens_ever = COALESCE(total_tokens_ever, 0) + p_token_amount,
    updated_at = now()
  WHERE id = p_company_id;
END;
$$;

-- Update free token grant trigger to track total_tokens_ever
DROP TRIGGER IF EXISTS ensure_free_tokens_trigger ON public.companies;
DROP FUNCTION IF EXISTS public.set_free_tokens_on_insert();

CREATE OR REPLACE FUNCTION public.set_free_tokens_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set if active_tokens is NULL or 0 (don't override if already set)
  IF (NEW.active_tokens IS NULL OR NEW.active_tokens = 0) THEN
    NEW.active_tokens := 10;
    NEW.total_tokens_ever := 10;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_free_tokens_trigger
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_free_tokens_on_insert();

-- Update trigger for plan changes to track total_tokens_ever
DROP TRIGGER IF EXISTS set_free_tokens_on_plan_change_trigger ON public.companies;
DROP FUNCTION IF EXISTS public.set_free_tokens_on_plan_change();

CREATE OR REPLACE FUNCTION public.set_free_tokens_on_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Wenn Plan auf 'free' geändert wird und active_tokens NULL oder 0 ist
  IF (NEW.active_plan_id = 'free' OR NEW.plan_name = 'free') 
     AND (NEW.active_tokens IS NULL OR NEW.active_tokens = 0) THEN
    NEW.active_tokens := 10;
    NEW.total_tokens_ever := COALESCE(OLD.total_tokens_ever, 0) + 10;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_free_tokens_on_plan_change_trigger
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  WHEN (
    (OLD.active_plan_id IS DISTINCT FROM NEW.active_plan_id OR OLD.plan_name IS DISTINCT FROM NEW.plan_name)
    AND (NEW.active_plan_id = 'free' OR NEW.plan_name = 'free')
  )
  EXECUTE FUNCTION public.set_free_tokens_on_plan_change();


