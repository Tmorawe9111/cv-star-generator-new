-- 1) Harden company_users INSERT policy
DROP POLICY IF EXISTS "Allow user self-insert" ON public.company_users;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='company_users' AND policyname='Admins can insert team members'
  ) THEN
    CREATE POLICY "Admins can insert team members"
    ON public.company_users
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_company_admin(company_id));
  END IF;
END $$;

-- 1b) Enforce safe updates for non-admins via trigger
CREATE OR REPLACE FUNCTION public.enforce_company_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Allow admins to update freely
  IF public.is_company_admin(COALESCE(NEW.company_id, OLD.company_id)) THEN
    RETURN NEW;
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

DROP TRIGGER IF EXISTS trg_enforce_company_user_update ON public.company_users;
CREATE TRIGGER trg_enforce_company_user_update
BEFORE UPDATE ON public.company_users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_company_user_update();

-- 2) Token usage enforcement via secured function
DROP POLICY IF EXISTS "Company users can create token usage" ON public.tokens_used;

CREATE OR REPLACE FUNCTION public.use_token(p_profile_id uuid)
RETURNS TABLE (token_id uuid, remaining_tokens integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_company_id uuid;
  v_remaining integer;
BEGIN
  SELECT public.get_user_company_id() INTO v_company_id;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'NO_COMPANY';
  END IF;

  -- Require published profile or explicit consent
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_profile_id
      AND (p.profile_published = true OR COALESCE(p.einwilligung, false) = true)
  ) THEN
    RAISE EXCEPTION 'NO_CONSENT_OR_NOT_PUBLISHED';
  END IF;

  -- Prevent double usage
  IF EXISTS (
    SELECT 1 FROM public.tokens_used tu
    WHERE tu.company_id = v_company_id
      AND tu.profile_id = p_profile_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_USED';
  END IF;

  -- Check and lock tokens
  SELECT active_tokens INTO v_remaining
  FROM public.companies
  WHERE id = v_company_id
  FOR UPDATE;

  IF COALESCE(v_remaining, 0) <= 0 THEN
    RAISE EXCEPTION 'NO_TOKENS';
  END IF;

  -- Insert usage and decrement counter atomically
  INSERT INTO public.tokens_used (company_id, profile_id)
  VALUES (v_company_id, p_profile_id)
  RETURNING id INTO token_id;

  UPDATE public.companies
  SET active_tokens = v_remaining - 1
  WHERE id = v_company_id
  RETURNING active_tokens INTO remaining_tokens;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_token(uuid) TO authenticated;

-- 3) Storage hardening for private CVs
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Owner full access to their own CV files under cvs/<user_id>/...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='CV owners full access'
  ) THEN
    CREATE POLICY "CV owners full access"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Company members with a used token may view candidate CVs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Company token can view CV'
  ) THEN
    CREATE POLICY "Company token can view CV"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'cvs'
      AND EXISTS (
        SELECT 1 FROM public.tokens_used tu
        WHERE tu.company_id IN (SELECT get_user_companies())
          AND tu.profile_id = (storage.foldername(name))[1]::uuid
      )
    );
  END IF;
END $$;
