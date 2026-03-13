-- Fix infinite recursion in company_users RLS policies
-- Step 1: Create SECURITY DEFINER function to safely get user's company role
CREATE OR REPLACE FUNCTION public.get_user_company_role(_user_id uuid, _company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.company_users
  WHERE user_id = _user_id
    AND company_id = _company_id
    AND accepted_at IS NOT NULL
  LIMIT 1;
$$;

-- Step 2: Drop all problematic self-referencing policies
DROP POLICY IF EXISTS "company_users_select_policy" ON public.company_users;
DROP POLICY IF EXISTS "company_users_delete_policy" ON public.company_users;
DROP POLICY IF EXISTS "company_users_update_policy" ON public.company_users;
DROP POLICY IF EXISTS "Admins can delete members" ON public.company_users;
DROP POLICY IF EXISTS "Admins can insert members" ON public.company_users;
DROP POLICY IF EXISTS "Admins can update members" ON public.company_users;
DROP POLICY IF EXISTS "Admins can view company members" ON public.company_users;
DROP POLICY IF EXISTS "company_users_insert_policy" ON public.company_users;

-- Step 3: Create new non-recursive policies

-- Users can always view their own memberships
CREATE POLICY "Users view own memberships"
ON public.company_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Company members can view other team members (using SECURITY DEFINER function)
CREATE POLICY "Company members view team"
ON public.company_users
FOR SELECT
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) IN ('admin', 'editor', 'viewer')
);

-- Users can accept their own invitations
CREATE POLICY "Users accept own invitations"
ON public.company_users
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can invite new members
CREATE POLICY "Admins invite members"
ON public.company_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_company_role(auth.uid(), company_id) = 'admin'
);

-- Admins can update member roles
CREATE POLICY "Admins update members"
ON public.company_users
FOR UPDATE
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) = 'admin'
)
WITH CHECK (
  public.get_user_company_role(auth.uid(), company_id) = 'admin'
);

-- Admins can remove members
CREATE POLICY "Admins remove members"
ON public.company_users
FOR DELETE
TO authenticated
USING (
  public.get_user_company_role(auth.uid(), company_id) = 'admin'
);

-- Users can create their own company membership (for initial company creation)
CREATE POLICY "Users create own membership"
ON public.company_users
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());