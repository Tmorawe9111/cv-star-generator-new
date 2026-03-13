-- Completely fix the infinite recursion issue by simplifying policies

-- Drop all policies on company_users to start fresh
DROP POLICY IF EXISTS "Users can insert themselves as company members" ON company_users;
DROP POLICY IF EXISTS "Company users can view team members" ON company_users;
DROP POLICY IF EXISTS "Company admins can manage other team members" ON company_users;
DROP POLICY IF EXISTS "Users can update their own company membership" ON company_users;

-- Create simple, non-recursive policies

-- 1. Allow authenticated users to insert themselves as company members
CREATE POLICY "Allow user self-insert"
ON company_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to view company_users records where they are a member
-- Use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_companies()
RETURNS TABLE(company_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT cu.company_id
  FROM company_users cu
  WHERE cu.user_id = auth.uid();
$$;

-- 3. Create policies using the security definer function
CREATE POLICY "Users can view their company members"
ON company_users
FOR SELECT
TO authenticated
USING (company_id IN (SELECT get_user_companies()));

-- 4. Allow company admins to manage team members
CREATE OR REPLACE FUNCTION public.is_company_admin(check_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM company_users
    WHERE user_id = auth.uid()
    AND company_id = check_company_id
    AND role = 'admin'
  );
$$;

CREATE POLICY "Company admins can manage team"
ON company_users
FOR ALL
TO authenticated
USING (public.is_company_admin(company_id));

-- 5. Allow users to update their own records
CREATE POLICY "Users can update own membership"
ON company_users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);