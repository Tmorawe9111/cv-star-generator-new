-- Fix infinite recursion in company_users RLS policies
-- The issue: policies reference company_users table, causing recursion
-- Solution: Use security definer functions that bypass RLS

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can delete members" ON public.company_users;
DROP POLICY IF EXISTS "Admins can insert members" ON public.company_users;
DROP POLICY IF EXISTS "Admins can update members" ON public.company_users;
DROP POLICY IF EXISTS "Admins can view company members" ON public.company_users;

-- Drop the is_company_admin function if it exists
DROP FUNCTION IF EXISTS public.is_company_admin(uuid);

-- Create a security definer function to check if user is company admin
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
    WHERE company_id = _company_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND accepted_at IS NOT NULL
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Admins can view company members"
ON public.company_users
FOR SELECT
USING (public.is_company_admin(company_id));

CREATE POLICY "Admins can insert members"
ON public.company_users
FOR INSERT
WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY "Admins can update members"
ON public.company_users
FOR UPDATE
USING (public.is_company_admin(company_id))
WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY "Admins can delete members"
ON public.company_users
FOR DELETE
USING (public.is_company_admin(company_id));

-- Keep existing policies for users to view/update their own membership
-- These don't cause recursion because they use auth.uid() directly