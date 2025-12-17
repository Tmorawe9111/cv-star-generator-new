-- Migration: Allow company users to view profiles of their employees
-- Purpose: Company users should be able to view profiles of candidates who work for them
--          (via company_employment_requests with status 'accepted') even if the profile
--          is not unlocked or published. This allows companies to express interest
--          in their employees.

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Company users can view unlocked profiles" ON public.profiles;

-- Create updated policy that includes employee profiles AND all published profiles
-- Note: RLS works on row level, not column level. To hide nachname for non-unlocked profiles,
-- we need to do this in the frontend. This policy allows company users to see profiles,
-- and the frontend will filter nachname based on unlock status.
CREATE POLICY "Company users can view unlocked profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Published profiles (all authenticated users can see these)
  (profile_published = true)
  -- Own profile
  OR (auth.uid() = id)
  -- Unlocked profiles (via tokens_used or company_candidates)
  OR EXISTS (
    SELECT 1
    FROM public.tokens_used tu
    INNER JOIN public.company_users cu ON tu.company_id = cu.company_id
    WHERE tu.profile_id = profiles.id
      AND cu.user_id = auth.uid()
      AND cu.accepted_at IS NOT NULL
  )
  OR EXISTS (
    SELECT 1
    FROM public.company_candidates cc
    INNER JOIN public.company_users cu ON cc.company_id = cu.company_id
    WHERE cc.candidate_id = profiles.id
      AND cc.unlocked_at IS NOT NULL
      AND cu.user_id = auth.uid()
      AND cu.accepted_at IS NOT NULL
  )
  -- Employee profiles (candidates who work for the company)
  OR EXISTS (
    SELECT 1
    FROM public.company_employment_requests cer
    INNER JOIN public.company_users cu ON cer.company_id = cu.company_id
    WHERE cer.user_id = profiles.id
      AND cer.status = 'accepted'
      AND cu.user_id = auth.uid()
      AND cu.accepted_at IS NOT NULL
  )
);

