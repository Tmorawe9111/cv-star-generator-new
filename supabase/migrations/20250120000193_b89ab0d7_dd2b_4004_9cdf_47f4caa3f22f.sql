-- Lock down public access to profiles by restricting policies to authenticated role
-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Restrict SELECT policies to authenticated users only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Company users can view unlocked profiles'
  ) THEN
    ALTER POLICY "Company users can view unlocked profiles" ON public.profiles TO authenticated;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view published profiles'
  ) THEN
    ALTER POLICY "Users can view published profiles" ON public.profiles TO authenticated;
  END IF;
END $$;

-- Also restrict INSERT/UPDATE owner policies to authenticated role for clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert their own profile'
  ) THEN
    ALTER POLICY "Users can insert their own profile" ON public.profiles TO authenticated;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update their own profile'
  ) THEN
    ALTER POLICY "Users can update their own profile" ON public.profiles TO authenticated;
  END IF;
END $$;