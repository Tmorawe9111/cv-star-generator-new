-- Add missing columns for robust company onboarding
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS primary_email text,
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'pending';

-- Ensure updated_at auto-updates
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce uniqueness of primary email when present
CREATE UNIQUE INDEX IF NOT EXISTS companies_primary_email_unique_idx
ON public.companies (lower(primary_email))
WHERE primary_email IS NOT NULL;

-- Reliable company account creation function
CREATE OR REPLACE FUNCTION public.create_company_account(
  p_name text,
  p_primary_email text,
  p_industry text,
  p_city text,
  p_country text,
  p_size_range text,
  p_contact_person text,
  p_phone text,
  p_website text,
  p_created_by uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Validate required inputs
  IF coalesce(trim(p_name), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: name required'; END IF;
  IF coalesce(trim(p_primary_email), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: primary_email required'; END IF;
  IF coalesce(trim(p_city), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: city required'; END IF;
  IF coalesce(trim(p_country), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: country required'; END IF;
  IF coalesce(trim(p_size_range), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: size_range required'; END IF;
  IF coalesce(trim(p_contact_person), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: contact_person required'; END IF;
  IF coalesce(trim(p_phone), '') = '' THEN RAISE EXCEPTION 'INVALID_INPUT: phone required'; END IF;

  -- Duplicate by email check
  IF EXISTS (
    SELECT 1 FROM public.companies c
    WHERE lower(c.primary_email) = lower(p_primary_email)
  ) THEN
    RAISE EXCEPTION 'COMPANY_EXISTS: A company with this email already exists';
  END IF;

  -- Insert company atomically
  INSERT INTO public.companies (
    id, name, primary_email, industry, main_location, country,
    size_range, contact_person, phone, website_url,
    plan_type, subscription_status, active_tokens, seats, account_status
  ) VALUES (
    gen_random_uuid(), p_name, p_primary_email, p_industry, p_city, p_country,
    p_size_range, p_contact_person, p_phone, p_website,
    'basic', 'inactive', 0, 1, 'pending'
  )
  RETURNING id INTO v_company_id;

  -- Link creator as admin (must satisfy RLS: user inserts own row)
  INSERT INTO public.company_users (user_id, company_id, role, accepted_at)
  VALUES (p_created_by, v_company_id, 'admin', now());

  RETURN v_company_id;
END;
$$;