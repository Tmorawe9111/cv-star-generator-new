-- Company Interview Question Expected Answers Migration
-- Allows recruiters to define expected/ideal answers for their interview questions
-- These answers are used for matching candidate responses (not visible to candidates)

-- Tabelle: company_interview_question_expected_answers
CREATE TABLE IF NOT EXISTS public.company_interview_question_expected_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.company_interview_questions(id) ON DELETE CASCADE,
  expected_answer text NOT NULL,
  keywords text[] DEFAULT '{}', -- Keywords that should be present in a good answer
  importance_weight numeric DEFAULT 1.0 CHECK (importance_weight >= 0 AND importance_weight <= 2.0), -- Weight for matching (0-2)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(question_id) -- One expected answer per question
);

CREATE INDEX IF NOT EXISTS idx_company_interview_question_expected_answers_question_id 
  ON public.company_interview_question_expected_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_company_interview_question_expected_answers_created_by 
  ON public.company_interview_question_expected_answers(created_by_user_id);

-- Tabelle: job_application_interview_answer_matches
-- Stores matching results between candidate answers and expected answers
CREATE TABLE IF NOT EXISTS public.job_application_interview_answer_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_answer_id uuid NOT NULL REFERENCES public.job_application_interview_answers(id) ON DELETE CASCADE,
  expected_answer_id uuid NOT NULL REFERENCES public.company_interview_question_expected_answers(id) ON DELETE CASCADE,
  match_score numeric NOT NULL CHECK (match_score >= 0 AND match_score <= 100), -- 0-100 similarity score
  match_method text CHECK (match_method IN ('ai_semantic', 'keyword', 'text_similarity', 'manual')) DEFAULT 'ai_semantic',
  matched_keywords text[] DEFAULT '{}', -- Keywords that were matched
  match_details jsonb DEFAULT '{}', -- Additional matching details (AI confidence, etc.)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(application_answer_id, expected_answer_id)
);

CREATE INDEX IF NOT EXISTS idx_job_application_interview_answer_matches_application_answer 
  ON public.job_application_interview_answer_matches(application_answer_id);
CREATE INDEX IF NOT EXISTS idx_job_application_interview_answer_matches_expected_answer 
  ON public.job_application_interview_answer_matches(expected_answer_id);
CREATE INDEX IF NOT EXISTS idx_job_application_interview_answer_matches_score 
  ON public.job_application_interview_answer_matches(match_score DESC);

-- RLS Policies
ALTER TABLE public.company_interview_question_expected_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_interview_answer_matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Company users can view own expected answers" ON public.company_interview_question_expected_answers;
DROP POLICY IF EXISTS "Company users can insert own expected answers" ON public.company_interview_question_expected_answers;
DROP POLICY IF EXISTS "Company users can update own expected answers" ON public.company_interview_question_expected_answers;
DROP POLICY IF EXISTS "Company users can delete own expected answers" ON public.company_interview_question_expected_answers;
DROP POLICY IF EXISTS "Company users can view answer matches" ON public.job_application_interview_answer_matches;

-- Company users can view expected answers for their questions
CREATE POLICY "Company users can view own expected answers" 
  ON public.company_interview_question_expected_answers
  FOR SELECT 
  USING (
    question_id IN (
      SELECT ciq.id FROM public.company_interview_questions ciq
      INNER JOIN public.company_users cu ON ciq.company_id = cu.company_id
      WHERE cu.user_id = auth.uid() AND cu.accepted_at IS NOT NULL
    )
  );

-- Company users can insert expected answers for their questions
CREATE POLICY "Company users can insert own expected answers" 
  ON public.company_interview_question_expected_answers
  FOR INSERT 
  WITH CHECK (
    question_id IN (
      SELECT ciq.id FROM public.company_interview_questions ciq
      INNER JOIN public.company_users cu ON ciq.company_id = cu.company_id
      WHERE cu.user_id = auth.uid() AND cu.accepted_at IS NOT NULL
    )
  );

-- Company users can update expected answers for their questions
CREATE POLICY "Company users can update own expected answers" 
  ON public.company_interview_question_expected_answers
  FOR UPDATE 
  USING (
    question_id IN (
      SELECT ciq.id FROM public.company_interview_questions ciq
      INNER JOIN public.company_users cu ON ciq.company_id = cu.company_id
      WHERE cu.user_id = auth.uid() AND cu.accepted_at IS NOT NULL
    )
  );

-- Company users can delete expected answers for their questions
CREATE POLICY "Company users can delete own expected answers" 
  ON public.company_interview_question_expected_answers
  FOR DELETE 
  USING (
    question_id IN (
      SELECT ciq.id FROM public.company_interview_questions ciq
      INNER JOIN public.company_users cu ON ciq.company_id = cu.company_id
      WHERE cu.user_id = auth.uid() AND cu.accepted_at IS NOT NULL
    )
  );

-- Company users can view answer matches for their applications
CREATE POLICY "Company users can view answer matches" 
  ON public.job_application_interview_answer_matches
  FOR SELECT 
  USING (
    application_answer_id IN (
      SELECT jaia.id FROM public.job_application_interview_answers jaia
      INNER JOIN public.applications a ON jaia.application_id = a.id
      INNER JOIN public.job_posts jp ON a.job_id = jp.id
      INNER JOIN public.company_users cu ON jp.company_id = cu.company_id
      WHERE cu.user_id = auth.uid() AND cu.accepted_at IS NOT NULL
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_interview_question_expected_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_interview_question_expected_answers_updated_at_trigger 
  ON public.company_interview_question_expected_answers;
CREATE TRIGGER update_company_interview_question_expected_answers_updated_at_trigger
  BEFORE UPDATE ON public.company_interview_question_expected_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_company_interview_question_expected_answers_updated_at();

CREATE OR REPLACE FUNCTION update_job_application_interview_answer_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_application_interview_answer_matches_updated_at_trigger 
  ON public.job_application_interview_answer_matches;
CREATE TRIGGER update_job_application_interview_answer_matches_updated_at_trigger
  BEFORE UPDATE ON public.job_application_interview_answer_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_job_application_interview_answer_matches_updated_at();

-- Function to calculate overall match score for an application
CREATE OR REPLACE FUNCTION calculate_application_interview_match_score(p_application_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_score numeric := 0;
  v_total_weight numeric := 0;
  v_match_record RECORD;
BEGIN
  -- Calculate weighted average match score
  FOR v_match_record IN
    SELECT 
      m.match_score,
      COALESCE(ea.importance_weight, 1.0) as weight
    FROM public.job_application_interview_answer_matches m
    INNER JOIN public.job_application_interview_answers jaia ON m.application_answer_id = jaia.id
    INNER JOIN public.company_interview_question_expected_answers ea ON m.expected_answer_id = ea.id
    WHERE jaia.application_id = p_application_id
  LOOP
    v_total_score := v_total_score + (v_match_record.match_score * v_match_record.weight);
    v_total_weight := v_total_weight + v_match_record.weight;
  END LOOP;

  -- Return average score (0-100)
  IF v_total_weight > 0 THEN
    RETURN ROUND((v_total_score / v_total_weight)::numeric, 2);
  ELSE
    RETURN NULL; -- No matches found
  END IF;
END;
$$;

COMMENT ON TABLE public.company_interview_question_expected_answers IS 'Expected/ideal answers for company interview questions. Not visible to candidates.';
COMMENT ON TABLE public.job_application_interview_answer_matches IS 'Matching results between candidate answers and expected answers. Used for scoring.';
COMMENT ON FUNCTION calculate_application_interview_match_score IS 'Calculates overall interview match score for an application based on weighted average of individual question matches.';

