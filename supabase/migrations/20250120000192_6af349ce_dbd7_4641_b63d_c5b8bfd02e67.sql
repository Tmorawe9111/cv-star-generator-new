-- Secure profiles table: enable RLS and restrict public reads
-- 1) Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) RESTRICTIVE policy to block anonymous reads universally
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Block anon read on profiles'
  ) THEN
    CREATE POLICY "Block anon read on profiles"
      AS RESTRICTIVE
      ON public.profiles
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 3) Allow users to view their own profile (explicit owner policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles
      FOR SELECT
      USING (id = auth.uid());
  END IF;
END $$;

-- 4) Allow authenticated users to read profiles (subject to restrictive policy above)
--    This keeps existing app flows working while anon is blocked.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Authenticated users can view profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view profiles"
      ON public.profiles
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 5) Allow users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (id = auth.uid());
  END IF;
END $$;
