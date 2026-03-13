-- Fix: public.enforce_company_user_update() should allow OWNER as well (not only ADMIN),
-- and should not block privileged SQL execution contexts.

CREATE OR REPLACE FUNCTION public.enforce_company_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_company_id uuid;
  v_role text;
  v_email text;
  v_primary_email text;
BEGIN
  v_company_id := COALESCE(NEW.company_id, OLD.company_id);

  -- Allow privileged DB roles (migrations/SQL editor)
  IF current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- Allow owner/admin to update freely
  v_role := public.get_user_company_role(auth.uid(), v_company_id);
  IF v_role IN ('owner', 'admin') THEN
    RETURN NEW;
  END IF;

  -- Special case: allow the primary-email account to claim ownership (even if they are not admin yet)
  IF auth.uid() = OLD.user_id AND NEW.role::text = 'owner' AND OLD.role::text <> 'owner' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
    SELECT primary_email INTO v_primary_email FROM public.companies WHERE id = v_company_id;
    IF v_email IS NOT NULL AND v_primary_email IS NOT NULL AND lower(v_email) = lower(v_primary_email) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Allow the user to update their own row with strict constraints
  IF auth.uid() = OLD.user_id THEN
    -- Lock critical fields
    NEW.role := OLD.role;
    NEW.company_id := OLD.company_id;
    NEW.user_id := OLD.user_id;

    -- Only allow accepting invitation: accepted_at can be set once to now()
    IF NEW.accepted_at IS NOT NULL AND OLD.accepted_at IS NULL THEN
      NEW.accepted_at := now();
    ELSE
      NEW.accepted_at := OLD.accepted_at;
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'not authorized';
END;
$$;


