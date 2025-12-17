-- Migration: Support Unlock Codes System
-- Purpose: Allow admins to create unlock codes that companies can redeem to unlock their profile

-- ============================================
-- 1. Table: support_unlock_codes
-- ============================================
CREATE TABLE IF NOT EXISTS public.support_unlock_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, -- The unlock code (e.g., "SUPPORT2024")
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE, -- NULL = can be used by any company
  created_by uuid NOT NULL REFERENCES auth.users(id), -- Admin who created the code
  used_by uuid REFERENCES auth.users(id), -- User who redeemed the code
  used_at timestamptz, -- When the code was redeemed
  expires_at timestamptz, -- Optional expiration date
  max_uses integer DEFAULT 1, -- How many times the code can be used
  current_uses integer DEFAULT 0, -- How many times it's been used
  is_active boolean NOT NULL DEFAULT true,
  notes text, -- Admin notes about the code
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (current_uses <= max_uses)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_unlock_codes_code ON public.support_unlock_codes(code);
CREATE INDEX IF NOT EXISTS idx_support_unlock_codes_company_id ON public.support_unlock_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_support_unlock_codes_created_by ON public.support_unlock_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_support_unlock_codes_is_active ON public.support_unlock_codes(is_active);

-- RLS Policies
ALTER TABLE public.support_unlock_codes ENABLE ROW LEVEL SECURITY;

-- Admins can view all codes
CREATE POLICY "Admins can view all unlock codes"
  ON public.support_unlock_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

-- Admins can create codes
CREATE POLICY "Admins can create unlock codes"
  ON public.support_unlock_codes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
    AND created_by = auth.uid()
  );

-- Admins can update codes
CREATE POLICY "Admins can update unlock codes"
  ON public.support_unlock_codes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

-- Company users can view codes assigned to their company (for redemption)
CREATE POLICY "Company users can view assigned codes"
  ON public.support_unlock_codes FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

-- ============================================
-- 2. Function: Redeem unlock code
-- ============================================
CREATE OR REPLACE FUNCTION public.redeem_unlock_code(
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record public.support_unlock_codes%ROWTYPE;
  v_company_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Sie müssen angemeldet sein, um einen Code einzulösen'
    );
  END IF;

  -- Get company_id for current user
  SELECT company_id INTO v_company_id
  FROM public.company_users
  WHERE user_id = v_user_id
    AND accepted_at IS NOT NULL
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_company',
      'message', 'Sie sind keinem Unternehmen zugeordnet'
    );
  END IF;

  -- Find the code
  SELECT * INTO v_code_record
  FROM public.support_unlock_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (company_id IS NULL OR company_id = v_company_id)
    AND current_uses < max_uses;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Ungültiger oder abgelaufener Code'
    );
  END IF;

  -- Check if code is company-specific and matches
  IF v_code_record.company_id IS NOT NULL AND v_code_record.company_id != v_company_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'code_not_for_company',
      'message', 'Dieser Code ist nicht für Ihr Unternehmen gültig'
    );
  END IF;

  -- Update code usage
  UPDATE public.support_unlock_codes
  SET 
    current_uses = current_uses + 1,
    used_by = v_user_id,
    used_at = CASE WHEN used_at IS NULL THEN now() ELSE used_at END,
    updated_at = now()
  WHERE id = v_code_record.id;

  -- Unlock company profile (set account_status to 'active' if it's not already)
  UPDATE public.companies
  SET 
    account_status = 'active',
    updated_at = now()
  WHERE id = v_company_id
    AND account_status != 'active';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Code erfolgreich eingelöst. Ihr Unternehmensprofil wurde freigeschaltet.',
    'company_id', v_company_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.redeem_unlock_code TO authenticated;

