-- Job Application Interview Answers Migration
-- Allows candidates to answer job-specific interview questions after profile unlock

-- Tabelle: job_application_interview_answers
CREATE TABLE IF NOT EXISTS public.job_application_interview_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.company_interview_questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  source text CHECK (source IN ('ai_matched', 'user_provided', 'user_edited')) DEFAULT 'user_provided',
  matched_from_answer_id uuid REFERENCES public.user_interview_answers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(application_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_job_application_interview_answers_application_id 
  ON public.job_application_interview_answers(application_id);
CREATE INDEX IF NOT EXISTS idx_job_application_interview_answers_question_id 
  ON public.job_application_interview_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_job_application_interview_answers_matched_from 
  ON public.job_application_interview_answers(matched_from_answer_id);

-- RLS Policies
ALTER TABLE public.job_application_interview_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own application interview answers" ON public.job_application_interview_answers;
DROP POLICY IF EXISTS "Users can insert own application interview answers" ON public.job_application_interview_answers;
DROP POLICY IF EXISTS "Users can update own application interview answers" ON public.job_application_interview_answers;
DROP POLICY IF EXISTS "Company users can view application interview answers" ON public.job_application_interview_answers;

-- Users can view their own application interview answers
CREATE POLICY "Users can view own application interview answers" 
  ON public.job_application_interview_answers
  FOR SELECT 
  USING (
    application_id IN (
      SELECT id FROM public.applications 
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own application interview answers
CREATE POLICY "Users can insert own application interview answers" 
  ON public.job_application_interview_answers
  FOR INSERT 
  WITH CHECK (
    application_id IN (
      SELECT id FROM public.applications 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own application interview answers
CREATE POLICY "Users can update own application interview answers" 
  ON public.job_application_interview_answers
  FOR UPDATE 
  USING (
    application_id IN (
      SELECT id FROM public.applications 
      WHERE user_id = auth.uid()
    )
  );

-- Company users can view interview answers for their job applications
CREATE POLICY "Company users can view application interview answers" 
  ON public.job_application_interview_answers
  FOR SELECT 
  USING (
    application_id IN (
      SELECT a.id FROM public.applications a
      INNER JOIN public.job_posts jp ON a.job_id = jp.id
      INNER JOIN public.company_users cu ON jp.company_id = cu.company_id
      WHERE cu.user_id = auth.uid() AND cu.accepted_at IS NOT NULL
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_job_application_interview_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_application_interview_answers_updated_at_trigger 
  ON public.job_application_interview_answers;
CREATE TRIGGER update_job_application_interview_answers_updated_at_trigger
  BEFORE UPDATE ON public.job_application_interview_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_job_application_interview_answers_updated_at();

