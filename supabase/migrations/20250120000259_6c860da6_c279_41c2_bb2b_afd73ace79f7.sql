-- Ensure admins can update company account_status
-- Drop existing restrictive policies and create admin-friendly ones

-- First, let's create a policy that allows admins to update companies
DROP POLICY IF EXISTS "Admins can manage all companies" ON companies;

CREATE POLICY "Admins can manage all companies"
ON companies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);