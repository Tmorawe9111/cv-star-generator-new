-- Fix: Update handwerkspezifische Frage zu genereller Frage
-- Fix: Ensure no duplicates in interview questions

-- Update handwerkspezifische Frage zu genereller Frage
UPDATE public.interview_questions
SET question = 'Wie reagierst du bei unerwarteten Problemen oder Herausforderungen?'
WHERE branch = 'Handwerk' 
  AND question = 'Wie reagierst du bei Baustellenproblemen?';

-- Ensure unique constraint prevents duplicates
-- The UNIQUE constraint on (user_id, question_id) should already prevent duplicates
-- But let's add a check to ensure data integrity

-- Remove any duplicate entries (keep the most recent one)
DELETE FROM public.user_interview_answers uia1
WHERE EXISTS (
  SELECT 1 FROM public.user_interview_answers uia2
  WHERE uia2.user_id = uia1.user_id
    AND uia2.question_id = uia1.question_id
    AND uia2.id > uia1.id
);

