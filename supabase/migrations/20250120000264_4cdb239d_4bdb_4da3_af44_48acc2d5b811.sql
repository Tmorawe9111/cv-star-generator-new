-- ============================================================================
-- Phase 1: Account-Verifizierung & Auto-Freeze System
-- ============================================================================

-- 1.1 Neue Spalte für Kontakt-Position (falls nicht vorhanden)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_position TEXT;

-- 1.2 Auto-Freeze Function für nicht-verifizierte Unternehmen
CREATE OR REPLACE FUNCTION public.auto_freeze_unverified_companies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE companies
  SET 
    account_status = 'frozen',
    frozen_at = now(),
    frozen_reason = 'Nicht verifiziert innerhalb von 24 Stunden. Bitte kontaktieren Sie Todd Morawe unter 01726128946 oder Todd@BeVisible.de'
  WHERE 
    account_status = 'pending'
    AND created_at < (now() - interval '24 hours')
    AND frozen_at IS NULL;
END;
$$;

-- 1.3 Company-Verifizierung durch Admin
CREATE OR REPLACE FUNCTION public.verify_company_account(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Status auf active setzen
  UPDATE companies
  SET account_status = 'active'
  WHERE id = p_company_id;
  
  -- Activity-Log erstellen
  INSERT INTO company_activity (company_id, type, actor_user_id, payload)
  VALUES (
    p_company_id,
    'account_verified',
    auth.uid(),
    jsonb_build_object('verified_at', now())
  );
END;
$$;

-- 1.4 Company-Account einfrieren durch Admin
CREATE OR REPLACE FUNCTION public.freeze_company_account(
  p_company_id UUID,
  p_reason TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Status auf frozen setzen mit Grund
  UPDATE companies
  SET 
    account_status = 'frozen',
    frozen_at = now(),
    frozen_reason = p_reason
  WHERE id = p_company_id;
  
  -- Activity-Log erstellen
  INSERT INTO company_activity (company_id, type, actor_user_id, payload)
  VALUES (
    p_company_id,
    'account_frozen',
    auth.uid(),
    jsonb_build_object('reason', p_reason, 'frozen_at', now())
  );
END;
$$;

-- ============================================================================
-- Phase 2: Token-System
-- ============================================================================

-- 2.1 Token-Verbrauch beim Profile-Unlock
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
  -- Token-Balance prüfen
  SELECT tokens_available INTO v_available
  FROM company_token_wallets
  WHERE company_id = p_company_id;
  
  -- Wenn keine Tokens verfügbar, Fehler zurückgeben
  IF v_available < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Keine Tokens verfügbar');
  END IF;
  
  -- Token abziehen
  UPDATE company_token_wallets
  SET 
    tokens_available = tokens_available - 1,
    tokens_used = tokens_used + 1
  WHERE company_id = p_company_id;
  
  -- Company-Candidate Eintrag erstellen/updaten
  INSERT INTO company_candidates (company_id, candidate_id, unlocked_at, stage, source)
  VALUES (p_company_id, p_profile_id, now(), 'unlocked', 'search')
  ON CONFLICT (company_id, candidate_id) DO UPDATE
  SET unlocked_at = now(), stage = 'unlocked';
  
  -- Activity-Log erstellen
  INSERT INTO company_activity (company_id, type, actor_user_id, payload)
  VALUES (
    p_company_id,
    'token_used',
    auth.uid(),
    jsonb_build_object(
      'profile_id', p_profile_id, 
      'tokens_remaining', v_available - 1,
      'action', 'profile_unlock'
    )
  );
  
  RETURN jsonb_build_object('success', true, 'tokens_remaining', v_available - 1);
END;
$$;

-- ============================================================================
-- Phase 3: Storage Buckets für Company Assets
-- ============================================================================

-- 3.1 Company-Logos Bucket erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3.2 Company-Headers Bucket erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-headers', 'company-headers', true)
ON CONFLICT (id) DO NOTHING;

-- 3.3 RLS Policies für company-logos
CREATE POLICY "Company admins can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid() IN (
    SELECT cu.user_id 
    FROM company_users cu
    WHERE cu.role = 'admin'
    AND cu.company_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

CREATE POLICY "Company admins can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IN (
    SELECT cu.user_id 
    FROM company_users cu
    WHERE cu.role = 'admin'
    AND cu.company_id::text = (storage.foldername(name))[1]
  )
);

-- 3.4 RLS Policies für company-headers
CREATE POLICY "Company admins can upload headers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-headers'
  AND auth.uid() IN (
    SELECT cu.user_id 
    FROM company_users cu
    WHERE cu.role = 'admin'
    AND cu.company_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Anyone can view headers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-headers');

CREATE POLICY "Company admins can delete headers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-headers'
  AND auth.uid() IN (
    SELECT cu.user_id 
    FROM company_users cu
    WHERE cu.role = 'admin'
    AND cu.company_id::text = (storage.foldername(name))[1]
  )
);

-- ============================================================================
-- Phase 4: Cron Jobs
-- ============================================================================

-- 4.1 Auto-Freeze Cron Job (täglich um 02:00 UTC)
SELECT cron.schedule(
  'auto-freeze-unverified',
  '0 2 * * *',
  $$SELECT public.auto_freeze_unverified_companies();$$
);

-- ============================================================================
-- Phase 5: Zusätzliche RLS Policies
-- ============================================================================

-- 5.1 Nur active Companies können auf Dashboard zugreifen
CREATE POLICY "Active companies can access dashboard"
ON companies FOR SELECT
TO authenticated
USING (
  account_status = 'active'
  AND id IN (
    SELECT company_id FROM company_users
    WHERE user_id = auth.uid()
  )
);

-- 5.2 Company-Candidates: Nur unlocked profiles sichtbar
CREATE POLICY "Company can view unlocked candidates"
ON company_candidates FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM company_users
    WHERE user_id = auth.uid()
  )
  AND unlocked_at IS NOT NULL
);