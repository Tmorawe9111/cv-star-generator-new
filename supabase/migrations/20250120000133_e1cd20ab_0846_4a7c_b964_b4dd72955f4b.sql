-- Fix security warnings: Add search_path to functions

-- Update the functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_user_companies()
RETURNS TABLE(company_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT cu.company_id
  FROM public.company_users cu
  WHERE cu.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(check_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = auth.uid()
    AND company_id = check_company_id
    AND role = 'admin'
  );
$$;