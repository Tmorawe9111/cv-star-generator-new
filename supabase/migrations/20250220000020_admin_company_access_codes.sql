-- Migration: Admin Company Access Codes System
-- Purpose: Allow admins to create codes that grant them extended access to specific company profiles
-- Flow: Admin creates code → Admin enters code in company profile → Admin gets extended access

-- ============================================
-- 1. Table: admin_company_access_codes
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_company_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, -- The access code (e.g., "ADMIN2024")
  created_by uuid NOT NULL REFERENCES auth.users(id), -- Admin who created the code
  expires_at timestamptz, -- Optional expiration date
  max_uses integer DEFAULT 1, -- How many times the code can be used
  current_uses integer DEFAULT 0, -- How many times it's been used
  is_active boolean NOT NULL DEFAULT true,
  notes text, -- Admin notes about the code
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (current_uses <= max_uses)
);

-- ============================================
-- 2. Table: admin_company_access_grants
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_company_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id), -- Admin who entered the code
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code_id uuid NOT NULL REFERENCES public.admin_company_access_codes(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz, -- Optional expiration (inherited from code or custom)
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(admin_id, company_id, code_id) -- One grant per admin-company-code combination
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_company_access_codes_code ON public.admin_company_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_admin_company_access_codes_created_by ON public.admin_company_access_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_company_access_grants_admin_company ON public.admin_company_access_grants(admin_id, company_id);
CREATE INDEX IF NOT EXISTS idx_admin_company_access_grants_company ON public.admin_company_access_grants(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_company_access_grants_code ON public.admin_company_access_grants(code_id);

-- RLS Policies
ALTER TABLE public.admin_company_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_company_access_grants ENABLE ROW LEVEL SECURITY;

-- Admins can view all codes
CREATE POLICY "Admins can view all access codes"
  ON public.admin_company_access_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

-- Admins can create codes
CREATE POLICY "Admins can create access codes"
  ON public.admin_company_access_codes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
    AND created_by = auth.uid()
  );

-- Admins can update codes
CREATE POLICY "Admins can update access codes"
  ON public.admin_company_access_codes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

-- Admins can view their own grants
CREATE POLICY "Admins can view own grants"
  ON public.admin_company_access_grants FOR SELECT
  USING (
    admin_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

-- Admins can create grants (when entering code)
CREATE POLICY "Admins can create grants"
  ON public.admin_company_access_grants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
    AND admin_id = auth.uid()
  );

-- ============================================
-- 3. Function: Grant admin access to company
-- ============================================
CREATE OR REPLACE FUNCTION public.grant_admin_company_access(
  p_code text,
  p_company_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record public.admin_company_access_codes%ROWTYPE;
  v_admin_id uuid;
  v_grant_id uuid;
BEGIN
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Sie müssen angemeldet sein'
    );
  END IF;

  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_admin_id
    AND role = 'admin'::app_role
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_admin',
      'message', 'Nur Admins können Codes einlösen'
    );
  END IF;

  -- Find the code
  SELECT * INTO v_code_record
  FROM public.admin_company_access_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND current_uses < max_uses;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Ungültiger oder abgelaufener Code'
    );
  END IF;

  -- Check if access already granted
  IF EXISTS (
    SELECT 1 FROM public.admin_company_access_grants
    WHERE admin_id = v_admin_id
      AND company_id = p_company_id
      AND code_id = v_code_record.id
      AND is_active = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_granted',
      'message', 'Sie haben bereits Zugriff auf dieses Unternehmen mit diesem Code'
    );
  END IF;

  -- Create grant
  INSERT INTO public.admin_company_access_grants (
    admin_id,
    company_id,
    code_id,
    expires_at
  ) VALUES (
    v_admin_id,
    p_company_id,
    v_code_record.id,
    v_code_record.expires_at
  ) RETURNING id INTO v_grant_id;

  -- Update code usage
  UPDATE public.admin_company_access_codes
  SET 
    current_uses = current_uses + 1,
    updated_at = now()
  WHERE id = v_code_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Zugriff erfolgreich gewährt. Sie können jetzt erweiterte Funktionen für dieses Unternehmen nutzen.',
    'grant_id', v_grant_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.grant_admin_company_access TO authenticated;

-- ============================================
-- 4. Function: Check if admin has access to company
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_has_company_access(
  p_admin_id uuid,
  p_company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_company_access_grants
    WHERE admin_id = p_admin_id
      AND company_id = p_company_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_has_company_access TO authenticated;

