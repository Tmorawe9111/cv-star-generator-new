-- Fix RLS policy with a simpler approach
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;

-- Create a simple policy that allows any authenticated user to create companies
CREATE POLICY "Authenticated users can create companies" ON public.companies
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also make sure users can view companies they're associated with
DROP POLICY IF EXISTS "Company users can view their company" ON public.companies;

CREATE POLICY "Company users can view their company" ON public.companies
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    id = get_user_company_id() OR 
    id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
  )
);