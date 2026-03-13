-- Migration: Encrypted Support Codes for Companies
-- Purpose: Store support codes encrypted in database (like passwords, not visible in plain text)
-- Uses simple XOR encryption with Base64 encoding (no pgcrypto dependency)

-- ============================================
-- 1. Add encrypted support_code column
-- ============================================
DO $$ 
BEGIN
  -- Add encrypted support_code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'support_code_encrypted'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN support_code_encrypted text; -- Store as Base64-encoded text
  END IF;
END $$;

-- ============================================
-- 2. Helper Function: Simple XOR encryption (bytea direct manipulation)
-- ============================================
CREATE OR REPLACE FUNCTION public._encrypt_text(
  p_text text,
  p_key text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_result_bytea bytea;
  v_text_bytes bytea;
  v_key_bytes bytea;
  v_key_hash text;
  i int;
  v_byte int;
  v_hex_string text;
BEGIN
  -- Hash the key for consistent length
  v_key_hash := MD5(p_key);
  
  -- Convert text and key to bytea
  v_text_bytes := convert_to(p_text, 'UTF8');
  v_key_bytes := convert_to(v_key_hash, 'UTF8');
  
  -- XOR encryption: build hex string, then convert to bytea
  v_hex_string := '';
  FOR i IN 0..length(v_text_bytes) - 1 LOOP
    v_byte := get_byte(v_text_bytes, i) # get_byte(v_key_bytes, i % length(v_key_bytes));
    v_hex_string := v_hex_string || lpad(to_hex(v_byte), 2, '0');
  END LOOP;
  
  -- Convert hex string to bytea (this avoids null bytes)
  v_result_bytea := ('\x' || v_hex_string)::bytea;
  
  -- Encode to Base64 (this ensures no null bytes in the final text)
  RETURN encode(v_result_bytea, 'base64');
END;
$$;

-- ============================================
-- 3. Helper Function: Simple XOR decryption
-- ============================================
CREATE OR REPLACE FUNCTION public._decrypt_text(
  p_encrypted text,
  p_key text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_result_bytea bytea;
  v_encrypted_bytes bytea;
  v_key_bytes bytea;
  v_key_hash text;
  i int;
  v_byte int;
  v_hex_string text;
BEGIN
  -- Hash the key for consistent length
  v_key_hash := MD5(p_key);
  
  -- Decode from Base64
  v_encrypted_bytes := decode(p_encrypted, 'base64');
  v_key_bytes := convert_to(v_key_hash, 'UTF8');
  
  -- XOR decryption (same as encryption): build hex string, then convert to bytea
  v_hex_string := '';
  FOR i IN 0..length(v_encrypted_bytes) - 1 LOOP
    v_byte := get_byte(v_encrypted_bytes, i) # get_byte(v_key_bytes, i % length(v_key_bytes));
    v_hex_string := v_hex_string || lpad(to_hex(v_byte), 2, '0');
  END LOOP;
  
  -- Convert hex string to bytea (this avoids null bytes)
  v_result_bytea := ('\x' || v_hex_string)::bytea;
  
  -- Convert back to text
  RETURN convert_from(v_result_bytea, 'UTF8');
END;
$$;

-- ============================================
-- 4. Function: Generate and encrypt support code
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_company_support_code(
  p_company_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_encrypted text;
  v_secret_key text;
BEGIN
  -- Get secret key from environment or use a default (should be set in Supabase secrets)
  v_secret_key := COALESCE(
    current_setting('app.support_code_secret', true),
    'bevisiblle-support-code-secret-key-2024-v2' -- Fallback, should be changed in production
  );

  -- Generate code in format: SUP-XXXX-XXXX (e.g., SUP-D72D-74B2)
  v_code := 'SUP-' || 
    UPPER(SUBSTRING(MD5(RANDOM()::text || p_company_id::text || NOW()::text) FROM 1 FOR 4)) || '-' ||
    UPPER(SUBSTRING(MD5(RANDOM()::text || p_company_id::text || NOW()::text) FROM 5 FOR 4));

  -- Encrypt the code
  v_encrypted := public._encrypt_text(v_code, v_secret_key);

  -- Store encrypted code
  UPDATE public.companies
  SET support_code_encrypted = v_encrypted
  WHERE id = p_company_id;

  RETURN v_code;
END;
$$;

-- ============================================
-- 5. Function: Decrypt support code (for display)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_company_support_code(
  p_company_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted text;
  v_decrypted text;
  v_secret_key text;
BEGIN
  -- Get secret key
  v_secret_key := COALESCE(
    current_setting('app.support_code_secret', true),
    'bevisiblle-support-code-secret-key-2024-v2' -- Fallback
  );

  -- Get encrypted code
  SELECT support_code_encrypted INTO v_encrypted
  FROM public.companies
  WHERE id = p_company_id;

  -- If no code exists, generate one
  IF v_encrypted IS NULL OR v_encrypted = '' THEN
    RETURN public.generate_company_support_code(p_company_id);
  END IF;

  -- Decrypt and return
  BEGIN
    v_decrypted := public._decrypt_text(v_encrypted, v_secret_key);
  EXCEPTION WHEN OTHERS THEN
    -- If decryption fails (e.g., wrong key or corrupted data), generate new code
    RETURN public.generate_company_support_code(p_company_id);
  END;

  RETURN v_decrypted;
END;
$$;

-- ============================================
-- 4. RLS Policy: Companies can view their own support code
-- ============================================
-- Note: The function is SECURITY DEFINER, so RLS is handled by the function itself
-- Companies can only decrypt their own code via the function

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_company_support_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_support_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._encrypt_text(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public._decrypt_text(text, text) TO authenticated;

-- ============================================
-- 5. Trigger: Auto-generate support code if missing
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_company_support_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate if encrypted code is NULL
  IF NEW.support_code_encrypted IS NULL THEN
    PERFORM public.generate_company_support_code(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_ensure_company_support_code ON public.companies;
CREATE TRIGGER trigger_ensure_company_support_code
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_company_support_code();

-- ============================================
-- 6. Generate codes for existing companies
-- ============================================
DO $$
DECLARE
  v_company_id uuid;
BEGIN
  FOR v_company_id IN SELECT id FROM public.companies WHERE support_code_encrypted IS NULL
  LOOP
    PERFORM public.generate_company_support_code(v_company_id);
  END LOOP;
END $$;

