-- Fix the RLS policy for company creation
-- The current policy might not be working correctly for newly authenticated users
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- Create a more specific policy for company creation
CREATE POLICY "Users can create companies" ON public.companies
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Also ensure the update policy works correctly
DROP POLICY IF EXISTS "Company admins can update their company" ON public.companies;

CREATE POLICY "Company admins can update their company" ON public.companies
FOR UPDATE 
USING (id IN ( 
  SELECT company_users.company_id
  FROM company_users
  WHERE company_users.user_id = auth.uid() 
  AND company_users.role = 'admin'
));