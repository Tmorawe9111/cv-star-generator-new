-- Create get_user_company_id function that returns the company_id for the current user
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.company_users
  WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL
  LIMIT 1;
$$;