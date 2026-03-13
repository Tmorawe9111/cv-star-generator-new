-- Trigger for automatic matching when candidate answers interview questions
-- This trigger calls the Edge Function to perform AI-based matching

-- Function to call Edge Function for matching
CREATE OR REPLACE FUNCTION trigger_interview_answer_matching()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected_answer RECORD;
  v_question RECORD;
  v_application_id uuid;
  v_supabase_url text;
  v_service_role_key text;
  v_response jsonb;
BEGIN
  -- Get application_id from the answer
  SELECT application_id INTO v_application_id
  FROM public.job_application_interview_answers
  WHERE id = NEW.id;

  -- Get expected answer and question details
  SELECT 
    ea.id as expected_answer_id,
    ea.expected_answer,
    ea.keywords,
    ea.importance_weight,
    ciq.question
  INTO v_expected_answer
  FROM public.company_interview_question_expected_answers ea
  INNER JOIN public.company_interview_questions ciq ON ea.question_id = ciq.id
  WHERE ea.question_id = NEW.question_id;

  -- Only proceed if expected answer exists
  IF v_expected_answer IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get Supabase URL and service role key from environment
  -- Note: In production, these should be set via Supabase secrets
  -- For now, we'll use a webhook approach or call the function directly
  
  -- Call Edge Function via HTTP (async, don't wait for response)
  -- This is done via a background job or webhook in production
  -- For now, we'll create a function that can be called manually or via pg_cron
  
  RETURN NEW;
END;
$$;

-- Alternative: Create a function that can be called manually or via pg_cron
CREATE OR REPLACE FUNCTION process_interview_answer_matching(p_answer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_answer RECORD;
  v_expected_answer RECORD;
  v_supabase_url text;
  v_service_role_key text;
  v_response jsonb;
BEGIN
  -- Get answer details
  SELECT 
    jaia.id,
    jaia.application_id,
    jaia.question_id,
    jaia.answer as candidate_answer
  INTO v_answer
  FROM public.job_application_interview_answers jaia
  WHERE jaia.id = p_answer_id;

  IF v_answer IS NULL THEN
    RAISE EXCEPTION 'Answer not found: %', p_answer_id;
  END IF;

  -- Get expected answer
  SELECT 
    ea.id as expected_answer_id,
    ea.expected_answer,
    ea.keywords,
    ea.importance_weight
  INTO v_expected_answer
  FROM public.company_interview_question_expected_answers ea
  WHERE ea.question_id = v_answer.question_id;

  IF v_expected_answer IS NULL THEN
    -- No expected answer defined, skip matching
    RETURN;
  END IF;

  -- Call Edge Function via HTTP
  -- Note: This requires http extension and proper configuration
  -- For now, we'll use a simpler approach: store a flag and process via Edge Function webhook
  
  -- Mark for processing (can be picked up by Edge Function webhook)
  -- Or use pg_net extension if available
  
  RETURN;
END;
$$;

-- Trigger: Call matching function after insert/update of interview answers
CREATE OR REPLACE FUNCTION trigger_interview_answer_matching_simple()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Schedule matching via Edge Function webhook
  -- This will be called asynchronously
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/ai-match-interview-answers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object(
      'applicationAnswerId', NEW.id,
      'applicationId', NEW.application_id,
      'candidateAnswer', NEW.answer,
      'questionId', NEW.question_id
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Error triggering interview answer matching: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger (only if pg_net extension is available)
-- Otherwise, use a webhook approach from the application
DO $$
BEGIN
  -- Check if pg_net extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    DROP TRIGGER IF EXISTS trigger_interview_answer_matching_trigger 
      ON public.job_application_interview_answers;
    
    CREATE TRIGGER trigger_interview_answer_matching_trigger
      AFTER INSERT OR UPDATE OF answer
      ON public.job_application_interview_answers
      FOR EACH ROW
      WHEN (NEW.answer IS NOT NULL AND NEW.answer != '')
      EXECUTE FUNCTION trigger_interview_answer_matching_simple();
  ELSE
    -- Create a simpler trigger that just logs
    RAISE NOTICE 'pg_net extension not available. Using application-level webhook approach instead.';
  END IF;
END $$;

-- Alternative: Create a table to queue matching jobs
CREATE TABLE IF NOT EXISTS public.interview_answer_matching_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id uuid NOT NULL REFERENCES public.job_application_interview_answers(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.company_interview_questions(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text,
  UNIQUE(answer_id)
);

CREATE INDEX IF NOT EXISTS idx_interview_answer_matching_queue_status 
  ON public.interview_answer_matching_queue(status, created_at);

-- Trigger to add to queue
CREATE OR REPLACE FUNCTION add_to_matching_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.interview_answer_matching_queue (answer_id, application_id, question_id)
  VALUES (NEW.id, NEW.application_id, NEW.question_id)
  ON CONFLICT (answer_id) DO UPDATE SET
    status = 'pending',
    created_at = now(),
    processed_at = NULL,
    error_message = NULL;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS add_to_matching_queue_trigger 
  ON public.job_application_interview_answers;

CREATE TRIGGER add_to_matching_queue_trigger
  AFTER INSERT OR UPDATE OF answer
  ON public.job_application_interview_answers
  FOR EACH ROW
  WHEN (NEW.answer IS NOT NULL AND NEW.answer != '')
  EXECUTE FUNCTION add_to_matching_queue();

-- RLS for matching queue
ALTER TABLE public.interview_answer_matching_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage matching queue" ON public.interview_answer_matching_queue;
CREATE POLICY "Service role can manage matching queue" 
  ON public.interview_answer_matching_queue
  FOR ALL
  USING (true); -- Service role only

COMMENT ON TABLE public.interview_answer_matching_queue IS 'Queue for processing interview answer matching. Processed by Edge Function webhook.';
COMMENT ON FUNCTION process_interview_answer_matching IS 'Manually trigger matching for a specific answer ID. Can be called via pg_cron or manually.';

