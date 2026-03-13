-- Add job limits to plans
-- Basic: 5 active jobs, Growth: 20 active jobs, Enterprise: unlimited (-1)

-- First, ensure we're using the correct plan structure
-- Update plans.ts structure to match database

-- Add max_active_jobs column to subscription_plans if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'max_active_jobs'
  ) THEN
    ALTER TABLE public.subscription_plans 
    ADD COLUMN max_active_jobs integer DEFAULT -1; -- -1 means unlimited
  END IF;
END $$;

-- Update existing plans with job limits
UPDATE public.subscription_plans 
SET max_active_jobs = CASE 
  WHEN id = 'free' THEN 0
  WHEN id = 'basic' THEN 5
  WHEN id = 'growth' THEN 20
  WHEN id = 'enterprise' THEN -1 -- unlimited
  ELSE 0
END
WHERE id IN ('free', 'basic', 'growth', 'enterprise');

-- If subscription_plans doesn't have these plans, insert them
INSERT INTO public.subscription_plans (id, name, price_monthly_cents, price_yearly_cents, included_tokens, included_jobs, included_seats, max_active_jobs)
VALUES
  ('free', 'Free', 0, 0, 10, 0, 1, 0),
  ('basic', 'Basic', 37900, 379000, 30, 5, 1, 5),
  ('growth', 'Growth', 76900, 769000, 150, 20, 5, 20),
  ('enterprise', 'Enterprise', 124900, 1249000, 0, -1, 0, -1)
ON CONFLICT (id) DO UPDATE 
SET max_active_jobs = EXCLUDED.max_active_jobs;

-- Create function to get active job count for a company
CREATE OR REPLACE FUNCTION public.get_active_job_count(p_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM job_posts
  WHERE company_id = p_company_id
    AND status = 'published'
    AND is_active = true;
$$;

-- Create function to check if company can create more jobs
CREATE OR REPLACE FUNCTION public.can_create_job(p_company_id uuid)
RETURNS TABLE (
  can_create boolean,
  current_count integer,
  max_allowed integer,
  plan_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH company_plan AS (
    SELECT 
      c.selected_plan_id as plan_id,
      COALESCE(sp.max_active_jobs, 0) as max_jobs
    FROM companies c
    LEFT JOIN subscription_plans sp ON sp.id = c.selected_plan_id
    WHERE c.id = p_company_id
  ),
  active_count AS (
    SELECT get_active_job_count(p_company_id) as count
  )
  SELECT 
    CASE 
      WHEN cp.max_jobs = -1 THEN true -- unlimited
      WHEN cp.max_jobs = 0 THEN false -- free plan
      ELSE (ac.count < cp.max_jobs)
    END as can_create,
    ac.count as current_count,
    cp.max_jobs as max_allowed,
    cp.plan_id
  FROM company_plan cp
  CROSS JOIN active_count ac;
$$;

