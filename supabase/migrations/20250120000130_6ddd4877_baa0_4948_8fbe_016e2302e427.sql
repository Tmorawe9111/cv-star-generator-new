-- Fix infinite recursion in company_users policies

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Company admins can manage team members" ON company_users;
DROP POLICY IF EXISTS "Company users can view team members" ON company_users;

-- Create new policy that allows users to insert themselves as company admins
-- This allows the onboarding flow to work
CREATE POLICY "Users can insert themselves as company members"
ON company_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view team members of companies they belong to
CREATE POLICY "Company users can view team members"
ON company_users
FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT company_id
  FROM company_users
  WHERE user_id = auth.uid()
));

-- Allow company admins to manage team members (but not self-referencing)
CREATE POLICY "Company admins can manage other team members"
ON company_users
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM company_users
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  AND user_id != auth.uid() -- Prevents self-modification issues
);

-- Allow users to update their own role/status (e.g., accepting invitations)
CREATE POLICY "Users can update their own company membership"
ON company_users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);