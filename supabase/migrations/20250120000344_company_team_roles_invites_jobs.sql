-- Company team roles, invites, and recruiter job assignments
-- Purpose:
--  - Add company-internal roles: owner/admin/recruiter/viewer/marketing
--  - Enforce seat limits on invites/acceptance
--  - Enforce company email domain for team members
--  - Add invite token flow
--  - Add recruiter <-> job assignment table for scoping

-- ============================================
-- 0) Companies: allowed email domain
-- ============================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS allowed_email_domain text;

UPDATE public.companies
SET allowed_email_domain = split_part(lower(primary_email), '@', 2)
WHERE allowed_email_domain IS NULL
  AND primary_email IS NOT NULL
  AND position('@' in primary_email) > 0;

-- ============================================
-- 1) company_users: normalize roles + constraint
-- ============================================
-- Normalize legacy roles to new framework
UPDATE public.company_users SET role = 'recruiter' WHERE role = 'editor';
UPDATE public.company_users SET role = 'viewer'    WHERE role = 'member';

-- Promote first accepted admin to owner if no owner exists
WITH ranked AS (
  SELECT
    id,
    company_id,
    row_number() OVER (
      PARTITION BY company_id
      ORDER BY accepted_at NULLS LAST, invited_at NULLS LAST, id
    ) AS rn
  FROM public.company_users
  WHERE role = 'admin' AND accepted_at IS NOT NULL
)
UPDATE public.company_users cu
SET role = 'owner'
FROM ranked r
WHERE cu.id = r.id
  AND r.rn = 1
  AND NOT EXISTS (
    SELECT 1
    FROM public.company_users cu2
    WHERE cu2.company_id = cu.company_id
      AND cu2.role = 'owner'
      AND cu2.accepted_at IS NOT NULL
  );

-- Drop existing role check constraints (names vary across environments)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.company_users'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.company_users DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.company_users
  ALTER COLUMN role SET DEFAULT 'viewer';

ALTER TABLE public.company_users
  ADD CONSTRAINT company_users_role_check
  CHECK (role IN ('owner', 'admin', 'recruiter', 'viewer', 'marketing'));

-- Prevent removing/demoting the last owner of a company
CREATE OR REPLACE FUNCTION public.tg_prevent_last_company_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_count int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' AND OLD.accepted_at IS NOT NULL THEN
      SELECT count(*) INTO v_owner_count
      FROM public.company_users
      WHERE company_id = OLD.company_id
        AND role = 'owner'
        AND accepted_at IS NOT NULL;
      IF v_owner_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last owner of a company';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'owner' AND OLD.accepted_at IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
      SELECT count(*) INTO v_owner_count
      FROM public.company_users
      WHERE company_id = OLD.company_id
        AND role = 'owner'
        AND accepted_at IS NOT NULL;
      IF v_owner_count <= 1 THEN
        RAISE EXCEPTION 'Cannot demote the last owner of a company';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_company_owner ON public.company_users;
CREATE TRIGGER trg_prevent_last_company_owner
  BEFORE UPDATE OR DELETE ON public.company_users
  FOR EACH ROW EXECUTE FUNCTION public.tg_prevent_last_company_owner();

-- ============================================
-- 2) Helper: get_user_company_role (ensure roles are current)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_company_role(_user_id uuid, _company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.company_users
  WHERE user_id = _user_id
    AND company_id = _company_id
    AND accepted_at IS NOT NULL
  LIMIT 1;
$$;

-- ============================================
-- 3) company_users RLS: owner/admin manage, all members view team
-- ============================================
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own memberships" ON public.company_users;
DROP POLICY IF EXISTS "Company members view team" ON public.company_users;
DROP POLICY IF EXISTS "Users accept own invitations" ON public.company_users;
DROP POLICY IF EXISTS "Admins invite members" ON public.company_users;
DROP POLICY IF EXISTS "Admins update members" ON public.company_users;
DROP POLICY IF EXISTS "Admins remove members" ON public.company_users;
DROP POLICY IF EXISTS "Users create own membership" ON public.company_users;

CREATE POLICY "Users view own memberships"
ON public.company_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Company members view team"
ON public.company_users
FOR SELECT
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin','recruiter','viewer','marketing')
);

CREATE POLICY "Users accept own invitations"
ON public.company_users
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner/Admin invite members"
ON public.company_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin')
);

CREATE POLICY "Owner/Admin update members"
ON public.company_users
FOR UPDATE
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin')
)
WITH CHECK (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin')
);

CREATE POLICY "Owner/Admin remove members"
ON public.company_users
FOR DELETE
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin')
);

-- Allow initial membership creation for company signup flows
CREATE POLICY "Users create own membership"
ON public.company_users
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================
-- 4) Update create_company_account to create owner + set allowed domain
-- ============================================
CREATE OR REPLACE FUNCTION public.create_company_account(
  p_name text,
  p_primary_email text,
  p_city text,
  p_country text,
  p_size_range text,
  p_contact_person text,
  p_phone text,
  p_created_by uuid,
  p_website text DEFAULT NULL,
  p_industry text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id uuid;
  v_domain text;
BEGIN
  IF coalesce(trim(p_name), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: name required'; END IF;
  IF coalesce(trim(p_primary_email), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: primary_email required'; END IF;
  IF coalesce(trim(p_city), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: city required'; END IF;
  IF coalesce(trim(p_country), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: country required'; END IF;
  IF coalesce(trim(p_size_range), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: size_range required'; END IF;
  IF coalesce(trim(p_contact_person), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: contact_person required'; END IF;
  IF coalesce(trim(p_phone), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: phone required'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.companies c
    WHERE lower(c.primary_email) = lower(p_primary_email)
  ) THEN
    RAISE EXCEPTION 'COMPANY_EXISTS: A company with this email already exists';
  END IF;

  v_domain := split_part(lower(p_primary_email), '@', 2);

  INSERT INTO public.companies (
    id, name, primary_email, industry, main_location, country,
    size_range, contact_person, phone, website_url,
    plan_type, subscription_status, active_tokens, seats, account_status,
    onboarding_step, onboarding_completed,
    allowed_email_domain
  ) VALUES (
    gen_random_uuid(), p_name, p_primary_email, p_industry, p_city, p_country,
    p_size_range, p_contact_person, p_phone, p_website,
    'basic', 'inactive', 0, 1, 'active',
    0, false,
    NULLIF(v_domain, '')
  )
  RETURNING id INTO v_company_id;

  INSERT INTO public.company_users (user_id, company_id, role, accepted_at)
  VALUES (p_created_by, v_company_id, 'owner', now());

  RETURN v_company_id;
END;
$$;

-- ============================================
-- 5) company_invites: email + role + token
-- ============================================
CREATE TABLE IF NOT EXISTS public.company_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  invite_token text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  accepted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- role constraint for invites
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_invites_role_check'
      AND conrelid = 'public.company_invites'::regclass
  ) THEN
    ALTER TABLE public.company_invites
      ADD CONSTRAINT company_invites_role_check
      CHECK (role IN ('admin','recruiter','viewer','marketing'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_company_invites_company_id ON public.company_invites(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invites_email ON public.company_invites(lower(email));

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner/Admin can view company invites" ON public.company_invites;
DROP POLICY IF EXISTS "Owner/Admin can manage company invites" ON public.company_invites;

CREATE POLICY "Owner/Admin can view company invites"
ON public.company_invites
FOR SELECT
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin')
);

CREATE POLICY "Owner/Admin can manage company invites"
ON public.company_invites
FOR ALL
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin')
)
WITH CHECK (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin')
);

-- updated_at trigger (reuse existing helper if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'tg_set_updated_at' AND pg_function_is_visible(oid)
  ) THEN
    DROP TRIGGER IF EXISTS trg_company_invites_updated_at ON public.company_invites;
    CREATE TRIGGER trg_company_invites_updated_at
      BEFORE UPDATE ON public.company_invites
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

-- ============================================
-- 6) RPC: invite_company_user_by_email
-- ============================================
CREATE OR REPLACE FUNCTION public.invite_company_user_by_email(
  p_company_id uuid,
  p_email text,
  p_role text DEFAULT 'viewer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_inviter_role text;
  v_email text;
  v_inviter_email text;
  v_inviter_domain text;
  v_allowed_domain text;
  v_email_domain text;
  v_seats_total int;
  v_seats_used int;
  v_token text;
  v_role text;
BEGIN
  IF p_company_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'company_id fehlt');
  END IF;

  v_inviter_role := public.get_user_company_role(auth.uid(), p_company_id);
  IF v_inviter_role NOT IN ('owner','admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Keine Berechtigung');
  END IF;

  v_email := lower(trim(p_email));
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ungültige E-Mail');
  END IF;

  v_role := lower(trim(coalesce(p_role, 'viewer')));
  IF v_role NOT IN ('admin','recruiter','viewer','marketing') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ungültige Rolle');
  END IF;

  -- Enforce company domain based on inviter/company setting
  SELECT u.email INTO v_inviter_email FROM auth.users u WHERE u.id = auth.uid();
  v_inviter_domain := split_part(lower(coalesce(v_inviter_email,'')), '@', 2);

  SELECT c.allowed_email_domain, coalesce(c.seats, 1)
    INTO v_allowed_domain, v_seats_total
  FROM public.companies c
  WHERE c.id = p_company_id;

  IF v_allowed_domain IS NULL OR v_allowed_domain = '' THEN
    v_allowed_domain := v_inviter_domain;
    UPDATE public.companies SET allowed_email_domain = v_allowed_domain WHERE id = p_company_id;
  END IF;

  v_email_domain := split_part(v_email, '@', 2);
  IF v_allowed_domain IS NOT NULL AND v_allowed_domain <> '' AND v_email_domain <> v_allowed_domain THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bitte nur Unternehmens-E-Mail-Adressen verwenden (@' || v_allowed_domain || ')',
      'allowed_domain', v_allowed_domain
    );
  END IF;

  SELECT count(*) INTO v_seats_used
  FROM public.company_users
  WHERE company_id = p_company_id
    AND accepted_at IS NOT NULL;

  IF v_seats_used >= v_seats_total THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sitz-Limit erreicht. Bitte Plan upgraden oder Sitze erweitern.',
      'seats_used', v_seats_used,
      'seats_total', v_seats_total,
      'needs_upgrade', true
    );
  END IF;

  v_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO public.company_invites (company_id, email, role, invite_token, invited_by, invited_at, accepted_at, accepted_user_id, revoked_at)
  VALUES (p_company_id, v_email, v_role, v_token, auth.uid(), now(), NULL, NULL, NULL)
  ON CONFLICT (company_id, email) DO UPDATE
    SET role = excluded.role,
        invite_token = excluded.invite_token,
        invited_by = excluded.invited_by,
        invited_at = now(),
        accepted_at = NULL,
        accepted_user_id = NULL,
        revoked_at = NULL;

  RETURN jsonb_build_object(
    'success', true,
    'email', v_email,
    'role', v_role,
    'invite_token', v_token,
    'allowed_domain', v_allowed_domain,
    'seats_used', v_seats_used,
    'seats_total', v_seats_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_company_user_by_email(uuid, text, text) TO authenticated;

-- ============================================
-- 7) RPC: accept_company_invite
-- ============================================
CREATE OR REPLACE FUNCTION public.accept_company_invite(
  p_invite_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_inv public.company_invites;
  v_user_email text;
  v_seats_total int;
  v_seats_used int;
BEGIN
  IF p_invite_token IS NULL OR trim(p_invite_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token fehlt');
  END IF;

  SELECT * INTO v_inv
  FROM public.company_invites
  WHERE invite_token = trim(p_invite_token)
    AND revoked_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Einladung nicht gefunden oder ungültig');
  END IF;

  IF v_inv.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Einladung wurde bereits angenommen');
  END IF;

  SELECT u.email INTO v_user_email FROM auth.users u WHERE u.id = auth.uid();
  IF lower(coalesce(v_user_email,'')) <> lower(v_inv.email) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Diese Einladung ist für eine andere E-Mail-Adresse');
  END IF;

  SELECT coalesce(c.seats, 1) INTO v_seats_total
  FROM public.companies c
  WHERE c.id = v_inv.company_id;

  SELECT count(*) INTO v_seats_used
  FROM public.company_users
  WHERE company_id = v_inv.company_id
    AND accepted_at IS NOT NULL;

  IF v_seats_used >= v_seats_total THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sitz-Limit erreicht', 'needs_upgrade', true);
  END IF;

  INSERT INTO public.company_users (company_id, user_id, role, invited_at, accepted_at)
  VALUES (v_inv.company_id, auth.uid(), v_inv.role, v_inv.invited_at, now())
  ON CONFLICT (user_id, company_id) DO UPDATE
    SET role = excluded.role,
        accepted_at = coalesce(public.company_users.accepted_at, excluded.accepted_at);

  UPDATE public.company_invites
  SET accepted_at = now(),
      accepted_user_id = auth.uid(),
      updated_at = now()
  WHERE id = v_inv.id;

  RETURN jsonb_build_object('success', true, 'company_id', v_inv.company_id, 'role', v_inv.role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_company_invite(text) TO authenticated;

-- ============================================
-- 8) Recruiter <-> job assignments
-- ============================================
CREATE TABLE IF NOT EXISTS public.company_job_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  recruiter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, job_id, recruiter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_job_assignments_company_recruiter
  ON public.company_job_assignments(company_id, recruiter_user_id);
CREATE INDEX IF NOT EXISTS idx_company_job_assignments_company_job
  ON public.company_job_assignments(company_id, job_id);

ALTER TABLE public.company_job_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view job assignments" ON public.company_job_assignments;
DROP POLICY IF EXISTS "Owner/Admin manage job assignments" ON public.company_job_assignments;

CREATE POLICY "Company members can view job assignments"
ON public.company_job_assignments
FOR SELECT
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin','recruiter','viewer','marketing')
);

CREATE POLICY "Owner/Admin manage job assignments"
ON public.company_job_assignments
FOR ALL
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin')
)
WITH CHECK (
  public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin')
);

-- ============================================
-- 9) Update key policies that referenced legacy roles
-- ============================================
-- company_locations: allow owner/admin for write actions
DROP POLICY IF EXISTS "Company members can insert locations" ON public.company_locations;
CREATE POLICY "Company members can insert locations"
  ON public.company_locations FOR INSERT
  WITH CHECK (
    public.get_user_company_role(auth.uid(), company_locations.company_id) IN ('owner','admin')
  );

DROP POLICY IF EXISTS "Company members can update locations" ON public.company_locations;
CREATE POLICY "Company members can update locations"
  ON public.company_locations FOR UPDATE
  USING (
    public.get_user_company_role(auth.uid(), company_locations.company_id) IN ('owner','admin')
  );

DROP POLICY IF EXISTS "Company admins can delete locations" ON public.company_locations;
CREATE POLICY "Company admins can delete locations"
  ON public.company_locations FOR DELETE
  USING (
    public.get_user_company_role(auth.uid(), company_locations.company_id) IN ('owner','admin')
  );

-- company_calendar_integrations: owner/admin manage
DROP POLICY IF EXISTS "Company admins can manage calendar integrations" ON public.company_calendar_integrations;
CREATE POLICY "Company admins can manage calendar integrations"
  ON public.company_calendar_integrations FOR ALL
  USING (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu
      WHERE cu.user_id = auth.uid() AND cu.accepted_at IS NOT NULL AND cu.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu
      WHERE cu.user_id = auth.uid() AND cu.accepted_at IS NOT NULL AND cu.role IN ('owner','admin')
    )
  );

-- posts: only owner/admin/marketing can create company posts
DROP POLICY IF EXISTS "Users and companies can create posts" ON public.posts;
CREATE POLICY "Users and companies can create posts"
ON public.posts
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (author_type = 'user' AND author_id = auth.uid()) OR
    (author_type = 'company' AND author_id IS NOT NULL AND
      public.get_user_company_role(auth.uid(), author_id) IN ('owner','admin','marketing')
    )
  )
);

-- community_posts: same restriction for legacy company posts
DROP POLICY IF EXISTS "Users and companies can create posts" ON public.community_posts;
CREATE POLICY "Users and companies can create posts"
ON public.community_posts
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (author_type = 'user' AND author_id = auth.uid()) OR
    (author_type = 'company' AND author_id IS NOT NULL AND
      public.get_user_company_role(auth.uid(), author_id) IN ('owner','admin','marketing')
    )
  )
);


