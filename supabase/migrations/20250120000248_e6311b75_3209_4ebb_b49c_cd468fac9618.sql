-- ============================================
-- FIX: Infinite recursion in company_users RLS policies
-- ============================================

-- Drop all existing RLS policies on company_users that cause recursion
DROP POLICY IF EXISTS "Company members can view company_users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can manage company_users" ON public.company_users;
DROP POLICY IF EXISTS "Users can view their own company memberships" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can insert users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can update users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can delete users" ON public.company_users;

-- Drop functions and recreate with SECURITY DEFINER to avoid recursion
DROP FUNCTION IF EXISTS public.has_company_access(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_company_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_company_member() CASCADE;

-- Create SECURITY DEFINER function for company access (no recursion)
CREATE OR REPLACE FUNCTION public.has_company_access(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = auth.uid()
    AND company_id = _company_id
    AND accepted_at IS NOT NULL
  );
$$;

-- Create SECURITY DEFINER function for admin check (no recursion)
CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = auth.uid()
    AND company_id = _company_id
    AND role = 'admin'
    AND accepted_at IS NOT NULL
  );
$$;

-- Create SECURITY DEFINER function for member check (no recursion)
CREATE OR REPLACE FUNCTION public.is_company_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = auth.uid()
  );
$$;

-- Create new, safe RLS policies for company_users using SECURITY DEFINER functions
-- Policy 1: Users can view their own company memberships
CREATE POLICY "Users can view own memberships"
ON public.company_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Company admins can view all company_users for their company
CREATE POLICY "Admins can view company members"
ON public.company_users
FOR SELECT
TO authenticated
USING (is_company_admin(company_id));

-- Policy 3: Company admins can insert new company_users
CREATE POLICY "Admins can insert members"
ON public.company_users
FOR INSERT
TO authenticated
WITH CHECK (is_company_admin(company_id));

-- Policy 4: Company admins can update company_users
CREATE POLICY "Admins can update members"
ON public.company_users
FOR UPDATE
TO authenticated
USING (is_company_admin(company_id))
WITH CHECK (is_company_admin(company_id));

-- Policy 5: Company admins can delete company_users
CREATE POLICY "Admins can delete members"
ON public.company_users
FOR DELETE
TO authenticated
USING (is_company_admin(company_id));