-- Give free accounts 10 tokens automatically (one-time only)
-- This ensures free accounts can unlock candidates initially
-- After these are used, they must purchase more tokens

-- Step 1: Update existing free accounts that have 0 tokens
UPDATE public.companies
SET active_tokens = 10
WHERE (selected_plan_id = 'free' OR selected_plan_id IS NULL)
  AND (active_tokens IS NULL OR active_tokens = 0);

-- Step 2: Create trigger function to automatically give 10 tokens to new free accounts
CREATE OR REPLACE FUNCTION public.set_free_account_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If new company is a free account (selected_plan_id = 'free' or NULL), give them 10 tokens
  IF (NEW.selected_plan_id = 'free' OR NEW.selected_plan_id IS NULL) THEN
    -- Only set if active_tokens is NULL or 0 (don't override if already set)
    IF (NEW.active_tokens IS NULL OR NEW.active_tokens = 0) THEN
      NEW.active_tokens := 10;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger that runs BEFORE INSERT on companies table
DROP TRIGGER IF EXISTS set_free_tokens_on_insert ON public.companies;
CREATE TRIGGER set_free_tokens_on_insert
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_free_account_tokens();

-- Step 4: Also handle case when selected_plan_id is updated to 'free' after creation
CREATE OR REPLACE FUNCTION public.set_free_tokens_on_plan_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If plan is changed to free and tokens are 0 or NULL, give 10 tokens
  IF (NEW.selected_plan_id = 'free' OR NEW.selected_plan_id IS NULL) THEN
    IF (OLD.selected_plan_id != 'free' AND OLD.selected_plan_id IS NOT NULL) THEN
      -- Plan was changed TO free, give tokens if they don't have any
      IF (NEW.active_tokens IS NULL OR NEW.active_tokens = 0) THEN
        NEW.active_tokens := 10;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger for plan updates
DROP TRIGGER IF EXISTS set_free_tokens_on_plan_change ON public.companies;
CREATE TRIGGER set_free_tokens_on_plan_change
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  WHEN (OLD.selected_plan_id IS DISTINCT FROM NEW.selected_plan_id)
  EXECUTE FUNCTION public.set_free_tokens_on_plan_update();

