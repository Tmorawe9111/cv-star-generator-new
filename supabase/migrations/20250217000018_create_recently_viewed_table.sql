-- Recently viewed profiles table
CREATE TABLE IF NOT EXISTS public.recently_viewed_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, profile_id)
);

-- RLS Policy
ALTER TABLE public.recently_viewed_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view their recently viewed profiles" ON public.recently_viewed_profiles
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );
