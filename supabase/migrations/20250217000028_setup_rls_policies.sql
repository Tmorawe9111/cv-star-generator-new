-- Setup RLS policies for unlock system tables

-- Enable RLS on all tables
ALTER TABLE public.company_token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_token_wallets
CREATE POLICY "Company users can view their company wallet" ON public.company_token_wallets
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can update their company wallet" ON public.company_token_wallets
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for token_transactions
CREATE POLICY "Company users can view their company transactions" ON public.token_transactions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can insert their company transactions" ON public.token_transactions
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for profile_unlocks
CREATE POLICY "Company users can view their company unlocks" ON public.profile_unlocks
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can insert their company unlocks" ON public.profile_unlocks
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for data_access_log
CREATE POLICY "Company users can view their company access logs" ON public.data_access_log
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can insert their company access logs" ON public.data_access_log
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for company_pipelines
CREATE POLICY "Company users can view their company pipelines" ON public.company_pipelines
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can insert their company pipelines" ON public.company_pipelines
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for pipeline_stages
CREATE POLICY "Company users can view their pipeline stages" ON public.pipeline_stages
  FOR SELECT USING (
    pipeline_id IN (
      SELECT id FROM public.company_pipelines 
      WHERE company_id IN (
        SELECT company_id FROM public.company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Company users can insert their pipeline stages" ON public.pipeline_stages
  FOR INSERT WITH CHECK (
    pipeline_id IN (
      SELECT id FROM public.company_pipelines 
      WHERE company_id IN (
        SELECT company_id FROM public.company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for pipeline_items
CREATE POLICY "Company users can view their pipeline items" ON public.pipeline_items
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can insert their pipeline items" ON public.pipeline_items
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can update their pipeline items" ON public.pipeline_items
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for recently_viewed_profiles
CREATE POLICY "Company users can view their recently viewed profiles" ON public.recently_viewed_profiles
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can insert their recently viewed profiles" ON public.recently_viewed_profiles
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can update their recently viewed profiles" ON public.recently_viewed_profiles
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for job_postings
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
