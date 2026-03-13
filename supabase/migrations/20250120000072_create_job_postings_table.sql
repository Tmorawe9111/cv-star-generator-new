-- Create job_postings table first

CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  employment_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Company users can view their company job postings" ON public.job_postings
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can insert their company job postings" ON public.job_postings
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can update their company job postings" ON public.job_postings
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can delete their company job postings" ON public.job_postings
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );
