-- Create company_follows table for companies following candidate profiles (with approval)
CREATE TABLE IF NOT EXISTS public.company_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, candidate_id)
);

-- Enable RLS
ALTER TABLE public.company_follows ENABLE ROW LEVEL SECURITY;

-- Company members can view their company's follows
CREATE POLICY "Company members can view follows"
ON public.company_follows
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = auth.uid()
  )
);

-- Company members can create follow requests
CREATE POLICY "Company members can create follows"
ON public.company_follows
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = auth.uid()
  )
);

-- Company members can delete their follows
CREATE POLICY "Company members can delete follows"
ON public.company_follows
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_follows_company ON public.company_follows(company_id);
CREATE INDEX IF NOT EXISTS idx_company_follows_candidate ON public.company_follows(candidate_id);
CREATE INDEX IF NOT EXISTS idx_company_follows_status ON public.company_follows(status);