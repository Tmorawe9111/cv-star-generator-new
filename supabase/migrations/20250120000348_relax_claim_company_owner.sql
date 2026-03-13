-- Relax ownership recovery:
-- The company account created with the company's primary_email should always be able to become the single owner,
-- even if their current company_users role/accepted_at is inconsistent.

CREATE OR REPLACE FUNCTION public.claim_company_owner(
  p_company_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_primary_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  SELECT primary_email INTO v_primary_email FROM public.companies WHERE id = p_company_id;

  IF v_email IS NULL OR v_primary_email IS NULL OR lower(v_email) <> lower(v_primary_email) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nur der Account mit der Unternehmens-Primär-E-Mail kann Superadmin werden.');
  END IF;

  -- Ensure membership exists; create if missing (historical data issue)
  IF NOT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
  ) THEN
    INSERT INTO public.company_users (company_id, user_id, role, invited_at, accepted_at)
    VALUES (p_company_id, auth.uid(), 'owner', now(), now());
  END IF;

  -- Promote caller and mark accepted
  UPDATE public.company_users
  SET role = 'owner',
      accepted_at = COALESCE(accepted_at, now()),
      invited_at = COALESCE(invited_at, now())
  WHERE company_id = p_company_id
    AND user_id = auth.uid();

  -- Ensure single owner (demote others)
  UPDATE public.company_users
  SET role = 'admin'
  WHERE company_id = p_company_id
    AND role::text = 'owner'
    AND user_id <> auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_company_owner(uuid) TO authenticated;


