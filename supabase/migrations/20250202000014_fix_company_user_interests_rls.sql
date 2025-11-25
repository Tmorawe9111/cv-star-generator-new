-- Fix RLS policy for company_user_interests to allow company members to insert interests
-- The issue is that has_company_access might not be working correctly or the policy needs to be more permissive

-- Drop existing insert policy
DROP POLICY IF EXISTS "Company members can insert interests" ON public.company_user_interests;

-- Recreate insert policy with explicit check
-- Allow any company member (not just admin/editor) to insert interests
CREATE POLICY "Company members can insert interests" 
ON public.company_user_interests
FOR INSERT 
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND (
    -- User must be a member of the company
    EXISTS (
      SELECT 1 
      FROM public.company_users cu
      WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_user_interests.company_id
    )
  )
);

-- Also ensure the function exists and works correctly
-- Recreate has_company_access function to ensure it works correctly
CREATE OR REPLACE FUNCTION public.has_company_access(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users cu
    WHERE cu.user_id = auth.uid()
    AND cu.company_id = _company_id
    AND cu.accepted_at IS NOT NULL
  );
$$;

