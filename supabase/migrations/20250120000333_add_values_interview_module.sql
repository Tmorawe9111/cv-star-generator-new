-- Values & Interview Module Migration
-- Creates tables for user values, interview questions, and answers

-- Tabelle 1: user_values
CREATE TABLE IF NOT EXISTS public.user_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  q1_team text,
  q2_conflict text,
  q3_reliable text,
  q4_motivation text,
  q5_stress text,
  q6_environment text,
  q7_respect text,
  q8_expectations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_values_user_id ON public.user_values(user_id);

-- Tabelle 2: interview_questions (Static Lookup)
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id serial PRIMARY KEY,
  branch text NOT NULL,
  question text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_branch ON public.interview_questions(branch);

-- Tabelle 3: user_interview_answers
CREATE TABLE IF NOT EXISTS public.user_interview_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id int NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interview_answers_user_id ON public.user_interview_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interview_answers_question_id ON public.user_interview_answers(question_id);

-- RLS Policies
ALTER TABLE public.user_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own values" ON public.user_values;
DROP POLICY IF EXISTS "Users can insert own values" ON public.user_values;
DROP POLICY IF EXISTS "Users can update own values" ON public.user_values;
DROP POLICY IF EXISTS "Companies can view unlocked values" ON public.user_values;
DROP POLICY IF EXISTS "Users can view own interview answers" ON public.user_interview_answers;
DROP POLICY IF EXISTS "Users can insert own interview answers" ON public.user_interview_answers;
DROP POLICY IF EXISTS "Users can update own interview answers" ON public.user_interview_answers;
DROP POLICY IF EXISTS "Companies can view unlocked interview answers" ON public.user_interview_answers;
DROP POLICY IF EXISTS "Anyone can view interview questions" ON public.interview_questions;

-- Users can read/write their own values
CREATE POLICY "Users can view own values" ON public.user_values
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own values" ON public.user_values
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own values" ON public.user_values
  FOR UPDATE USING (auth.uid() = user_id);

-- Companies can view unlocked profiles' values
CREATE POLICY "Companies can view unlocked values" ON public.user_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_candidates cc
      WHERE cc.candidate_id = user_values.user_id
      AND cc.unlocked_at IS NOT NULL
      AND cc.company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
      )
    )
  );

-- Similar policies for interview_answers
CREATE POLICY "Users can view own interview answers" ON public.user_interview_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview answers" ON public.user_interview_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview answers" ON public.user_interview_answers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Companies can view unlocked interview answers" ON public.user_interview_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_candidates cc
      WHERE cc.candidate_id = user_interview_answers.user_id
      AND cc.unlocked_at IS NOT NULL
      AND cc.company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
      )
    )
  );

-- Interview questions are public (read-only for all)
CREATE POLICY "Anyone can view interview questions" ON public.interview_questions
  FOR SELECT USING (true);

-- Seed Data: Insert all branch questions
INSERT INTO public.interview_questions (branch, question) VALUES
-- Pflege
('Pflege', 'Warum möchtest du in der Pflege arbeiten?'),
('Pflege', 'Wie gehst du mit belastenden Situationen um?'),
('Pflege', 'Wie organisierst du mehrere Aufgaben gleichzeitig?'),
('Pflege', 'Wie reagierst du bei unzufriedenen Patienten?'),
('Pflege', 'Was bedeutet Zuverlässigkeit im Schichtdienst?'),
-- Logistik
('Logistik', 'Wie gehst du mit Zeitdruck um?'),
('Logistik', 'Was ist dir bei Schichtarbeit wichtig?'),
('Logistik', 'Wie stellst du Genauigkeit sicher?'),
('Logistik', 'Wie reagierst du bei Fehlern?'),
('Logistik', 'Was bedeutet Teamarbeit für dich?'),
-- Handwerk
('Handwerk', 'Warum arbeitest du gerne praktisch?'),
('Handwerk', 'Wie gehst du mit Kritik um?'),
('Handwerk', 'Was bedeutet Zuverlässigkeit im Handwerk?'),
('Handwerk', 'Wie reagierst du bei Baustellenproblemen?'),
('Handwerk', 'Warum ist Teamarbeit wichtig?'),
-- Gastronomie
('Gastronomie', 'Wie gehst du mit Stresssituationen um?'),
('Gastronomie', 'Was bedeutet guter Service für dich?'),
('Gastronomie', 'Wie reagierst du bei unzufriedenen Gästen?'),
('Gastronomie', 'Wie wichtig ist dir Teamarbeit?'),
('Gastronomie', 'Warum arbeitest du gern mit Menschen?'),
-- Produktion
('Produktion', 'Wie gehst du mit wiederholenden Aufgaben um?'),
('Produktion', 'Was bedeutet Qualität für dich?'),
('Produktion', 'Wie reagierst du bei Ablaufproblemen?'),
('Produktion', 'Wie wichtig ist dir Sicherheit?'),
('Produktion', 'Warum möchtest du in der Produktion arbeiten?'),
-- Büro
('Büro', 'Wie organisierst du deine Aufgaben?'),
('Büro', 'Wie gehst du mit Unterbrechungen um?'),
('Büro', 'Wie kommunizierst du im Team?'),
('Büro', 'Wie priorisierst du Aufgaben?'),
('Büro', 'Wie gehst du mit Verantwortung um?')
ON CONFLICT DO NOTHING;

-- Add completion tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS values_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS interview_completed boolean DEFAULT false;

