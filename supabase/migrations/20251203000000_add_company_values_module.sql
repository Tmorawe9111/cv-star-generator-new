-- Company Values & Expectations Module Migration
-- Creates tables for company values, role expectations, and interview questions

-- Tabelle 1: company_values
CREATE TABLE IF NOT EXISTS public.company_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  q1_important_values text,
  q2_team_collaboration text,
  q3_handling_mistakes text,
  q4_desired_traits text,
  q5_long_term_motivation text,
  values_tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

CREATE INDEX IF NOT EXISTS idx_company_values_company_id ON public.company_values(company_id);

-- Tabelle 2: company_role_expectations
CREATE TABLE IF NOT EXISTS public.company_role_expectations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.job_posts(id) ON DELETE CASCADE,
  key_tasks text,
  desired_behavior text,
  must_have_traits text,
  no_gos text,
  work_environment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_role_expectations_company_id ON public.company_role_expectations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_role_expectations_role_id ON public.company_role_expectations(role_id);

-- Tabelle 3: company_interview_questions
CREATE TABLE IF NOT EXISTS public.company_interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.job_posts(id) ON DELETE CASCADE,
  question text NOT NULL,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_interview_questions_company_id ON public.company_interview_questions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_interview_questions_role_id ON public.company_interview_questions(role_id);

-- RLS Policies
ALTER TABLE public.company_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_role_expectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_interview_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Company users can view own values" ON public.company_values;
DROP POLICY IF EXISTS "Company users can insert own values" ON public.company_values;
DROP POLICY IF EXISTS "Company users can update own values" ON public.company_values;
DROP POLICY IF EXISTS "Company users can view own role expectations" ON public.company_role_expectations;
DROP POLICY IF EXISTS "Company users can insert own role expectations" ON public.company_role_expectations;
DROP POLICY IF EXISTS "Company users can update own role expectations" ON public.company_role_expectations;
DROP POLICY IF EXISTS "Company users can delete own role expectations" ON public.company_role_expectations;
DROP POLICY IF EXISTS "Company users can view own interview questions" ON public.company_interview_questions;
DROP POLICY IF EXISTS "Company users can insert own interview questions" ON public.company_interview_questions;
DROP POLICY IF EXISTS "Company users can update own interview questions" ON public.company_interview_questions;
DROP POLICY IF EXISTS "Company users can delete own interview questions" ON public.company_interview_questions;
DROP POLICY IF EXISTS "Users can view company values" ON public.company_values;
DROP POLICY IF EXISTS "Users can view company role expectations" ON public.company_role_expectations;
DROP POLICY IF EXISTS "Users can view company interview questions" ON public.company_interview_questions;

-- Company users can manage their own company's values
CREATE POLICY "Company users can view own values" ON public.company_values
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Company users can insert own values" ON public.company_values
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Company users can update own values" ON public.company_values
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

-- Company users can manage their own role expectations
CREATE POLICY "Company users can view own role expectations" ON public.company_role_expectations
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Company users can insert own role expectations" ON public.company_role_expectations
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Company users can update own role expectations" ON public.company_role_expectations
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Company users can delete own role expectations" ON public.company_role_expectations
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

-- Company users can manage their own interview questions
CREATE POLICY "Company users can view own interview questions" ON public.company_interview_questions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Company users can insert own interview questions" ON public.company_interview_questions
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Company users can update own interview questions" ON public.company_interview_questions
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Company users can delete own interview questions" ON public.company_interview_questions
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

-- Users can view company values (for job applications)
CREATE POLICY "Users can view company values" ON public.company_values
  FOR SELECT USING (true);

-- Users can view company role expectations (for job applications)
CREATE POLICY "Users can view company role expectations" ON public.company_role_expectations
  FOR SELECT USING (true);

-- Users can view company interview questions (for job applications)
CREATE POLICY "Users can view company interview questions" ON public.company_interview_questions
  FOR SELECT USING (true);

-- Add completion tracking to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS values_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS interview_questions_completed boolean DEFAULT false;

