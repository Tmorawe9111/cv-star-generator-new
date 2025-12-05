-- Add support code system for company verification
-- This allows companies to provide a support code during registration
-- which admins can verify to approve their account

-- Add support code fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS support_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS support_code_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS support_code_verified_by UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_support_code ON public.companies(support_code) WHERE support_code IS NOT NULL;

-- Create function to generate unique support code
CREATE OR REPLACE FUNCTION public.generate_support_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code in format: SUP-XXXX-XXXX (8 alphanumeric characters)
    -- Using uppercase letters and numbers, excluding confusing characters (0, O, I, 1)
    new_code := 'SUP-' || 
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4)) ||
      '-' ||
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 5 FOR 4));
    
    -- Replace confusing characters
    new_code := REPLACE(REPLACE(REPLACE(REPLACE(new_code, '0', 'A'), 'O', 'B'), 'I', 'C'), '1', 'D');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE support_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Create function to verify support code (for admin use)
CREATE OR REPLACE FUNCTION public.verify_support_code(
  p_company_id UUID,
  p_admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_exists BOOLEAN;
BEGIN
  -- Check if company exists and has a support code
  SELECT EXISTS(
    SELECT 1 FROM public.companies 
    WHERE id = p_company_id 
    AND support_code IS NOT NULL
  ) INTO company_exists;
  
  IF NOT company_exists THEN
    RETURN false;
  END IF;
  
  -- Update company with verification info
  UPDATE public.companies
  SET 
    support_code_verified_at = NOW(),
    support_code_verified_by = p_admin_user_id,
    account_status = 'active'
  WHERE id = p_company_id;
  
  RETURN true;
END;
$$;

-- Add comment for documentation
COMMENT ON COLUMN public.companies.support_code IS 'Unique support code provided by company during registration for admin verification';
COMMENT ON COLUMN public.companies.support_code_verified_at IS 'Timestamp when support code was verified by admin';
COMMENT ON COLUMN public.companies.support_code_verified_by IS 'Admin user ID who verified the support code';

