-- Remove overly permissive policy on companies
DROP POLICY IF EXISTS "Allow all company operations" ON public.companies;

-- Tighten access to profiles: remove broad company visibility
DROP POLICY IF EXISTS "Company users can view all profiles" ON public.profiles;

-- Allow company users to view ONLY published profiles, their own profile, or profiles they've unlocked
CREATE POLICY "Company users can view unlocked profiles"
ON public.profiles
FOR SELECT
USING (
  (profile_published = true)
  OR (auth.uid() = id)
  OR EXISTS (
    SELECT 1
    FROM public.tokens_used tu
    WHERE tu.profile_id = profiles.id
      AND tu.company_id IN (SELECT get_user_companies())
  )
);
