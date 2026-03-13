-- Fix RLS policy for follows table to allow all company members (not just admins) to create follow relationships
-- The issue is that has_company_access might be too restrictive or not working correctly

-- Drop existing insert policy
DROP POLICY IF EXISTS "follows_follower_can_insert" ON public.follows;

-- Recreate insert policy with explicit check for all company members
CREATE POLICY "follows_follower_can_insert"
ON public.follows
FOR INSERT
WITH CHECK (
  -- Profile users can follow
  (follower_type = 'profile' AND follower_id = auth.uid())
  OR
  -- Company members can create follow relationships for their company
  (
    follower_type = 'company'
    AND EXISTS (
      SELECT 1 
      FROM public.company_users cu
      WHERE cu.user_id = auth.uid()
      AND cu.company_id = follows.follower_id
      AND cu.accepted_at IS NOT NULL
    )
  )
);

-- Also update the has_company_access function to ensure it works correctly
-- This ensures all company members (not just admins) can use it
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

