-- Fix database relationships and add missing INSERT policy for companies

-- 1. Add missing INSERT policy for companies table (needed for onboarding)
CREATE POLICY "Authenticated users can create companies"
ON companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Create a proper user-company relationship function
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT cu.company_id
  FROM public.company_users cu
  WHERE cu.user_id = auth.uid()
  LIMIT 1;
$$;

-- 3. Create function to check if user is company member
CREATE OR REPLACE FUNCTION public.is_company_member()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = auth.uid()
  );
$$;

-- 4. Update companies RLS policies to allow company members to view their company
DROP POLICY IF EXISTS "Company users can view their company" ON companies;
CREATE POLICY "Company users can view their company"
ON companies
FOR SELECT
TO authenticated
USING (id = public.get_user_company_id());

-- 5. Add a helper table to track user types (company vs job seeker)
CREATE TABLE IF NOT EXISTS public.user_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_type text NOT NULL CHECK (user_type IN ('company', 'job_seeker')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_types
ALTER TABLE public.user_types ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own user type
CREATE POLICY "Users can view their own user type"
ON public.user_types
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own user type
CREATE POLICY "Users can insert their own user type"
ON public.user_types
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);