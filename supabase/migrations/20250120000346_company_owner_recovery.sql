-- Ensure: exactly one "owner" (Superadmin) per company, and the account created with the company's primary email
-- can recover ownership if it was incorrectly assigned historically.

-- IMPORTANT:
-- Some environments have a BEFORE UPDATE trigger (public.enforce_company_user_update) that raises 'not authorized'
-- when auth.uid() is NULL (migrations/SQL editor). We temporarily disable it for the data-repair section.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_enforce_company_user_update'
      AND tgrelid = 'public.company_users'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.company_users DISABLE TRIGGER trg_enforce_company_user_update';
  END IF;
END $$;

-- Ensure company_users role constraint allows 'owner' (some older DBs still reject it)
DO $$
DECLARE
  r record;
BEGIN
  -- Drop existing role-related CHECK constraints (names vary)
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.company_users'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.company_users DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  -- Recreate canonical constraint allowing owner/admin/recruiter/viewer/marketing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_users_role_check'
      AND conrelid = 'public.company_users'::regclass
  ) THEN
    ALTER TABLE public.company_users
      ADD CONSTRAINT company_users_role_check
      CHECK ((role::text) IN ('owner','admin','recruiter','viewer','marketing'));
  END IF;
END $$;

-- 1) Data repair: if a membership exists for the user whose auth.email == companies.primary_email,
--    make that user the owner and demote other owners to admin.
WITH primary_members AS (
  SELECT
    c.id AS company_id,
    cu.user_id AS user_id,
    cu.id AS company_user_id
  FROM public.companies c
  JOIN auth.users u
    ON lower(u.email) = lower(c.primary_email)
  JOIN public.company_users cu
    ON cu.company_id = c.id
   AND cu.user_id = u.id
  WHERE c.primary_email IS NOT NULL
)
UPDATE public.company_users cu
SET role = 'owner',
    accepted_at = COALESCE(cu.accepted_at, now()),
    invited_at = COALESCE(cu.invited_at, now())
FROM primary_members pm
WHERE cu.id = pm.company_user_id
  AND cu.role IS DISTINCT FROM 'owner';

-- Demote any other owners for companies where a primary member exists
WITH primary_members AS (
  SELECT
    c.id AS company_id,
    u.id AS user_id
  FROM public.companies c
  JOIN auth.users u
    ON lower(u.email) = lower(c.primary_email)
  WHERE c.primary_email IS NOT NULL
)
UPDATE public.company_users cu
SET role = 'admin'
FROM primary_members pm
WHERE cu.company_id = pm.company_id
  AND cu.role = 'owner'
  AND cu.user_id <> pm.user_id;

-- Re-enable trigger after data repair
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_enforce_company_user_update'
      AND tgrelid = 'public.company_users'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.company_users ENABLE TRIGGER trg_enforce_company_user_update';
  END IF;
END $$;

-- 2) Helper: enforce single owner going forward.
-- We do this with an AFTER trigger so the "prevent last owner" trigger can still protect us,
-- while allowing a safe transfer flow (create second owner then demote old one).
CREATE OR REPLACE FUNCTION public.tg_enforce_single_company_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Avoid recursion loops
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'owner' AND NEW.accepted_at IS NOT NULL THEN
    -- Demote all other accepted owners in the same company
    UPDATE public.company_users
    SET role = 'admin'
    WHERE company_id = NEW.company_id
      AND role = 'owner'
      AND accepted_at IS NOT NULL
      AND user_id <> NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_company_owner ON public.company_users;
CREATE TRIGGER trg_enforce_single_company_owner
  AFTER INSERT OR UPDATE OF role, accepted_at ON public.company_users
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_enforce_single_company_owner();

-- 3) RPC: transfer ownership safely (owner-only)
CREATE OR REPLACE FUNCTION public.transfer_company_owner(
  p_company_id uuid,
  p_new_owner_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.get_user_company_role(auth.uid(), p_company_id);
  IF v_role IS DISTINCT FROM 'owner' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nur der Superadmin kann die Rolle übertragen.');
  END IF;

  -- Ensure new owner is a member
  IF NOT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_id = p_company_id
      AND user_id = p_new_owner_user_id
      AND accepted_at IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Der gewählte User ist kein aktives Teammitglied.');
  END IF;

  -- Promote new owner first (then trigger will demote others)
  UPDATE public.company_users
  SET role = 'owner',
      accepted_at = COALESCE(accepted_at, now()),
      invited_at = COALESCE(invited_at, now())
  WHERE company_id = p_company_id
    AND user_id = p_new_owner_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_company_owner(uuid, uuid) TO authenticated;

-- 4) RPC: recover ownership for the primary email account (admin-only + email must match primary_email)
CREATE OR REPLACE FUNCTION public.claim_company_owner(
  p_company_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_email text;
  v_primary_email text;
BEGIN
  v_role := public.get_user_company_role(auth.uid(), p_company_id);
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nur Admins können Superadmin wiederherstellen.');
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  SELECT primary_email INTO v_primary_email FROM public.companies WHERE id = p_company_id;

  IF v_email IS NULL OR v_primary_email IS NULL OR lower(v_email) <> lower(v_primary_email) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nur der Account mit der Unternehmens-Primär-E-Mail kann Superadmin werden.');
  END IF;

  -- Ensure membership exists (and is accepted)
  IF NOT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kein aktiver Teamzugang gefunden.');
  END IF;

  UPDATE public.company_users
  SET role = 'owner',
      accepted_at = COALESCE(accepted_at, now()),
      invited_at = COALESCE(invited_at, now())
  WHERE company_id = p_company_id
    AND user_id = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_company_owner(uuid) TO authenticated;


