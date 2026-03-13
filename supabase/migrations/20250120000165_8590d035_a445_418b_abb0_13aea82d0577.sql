-- Enable required extensions and schedule the publish worker
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('publish-scheduled-posts-every-minute');
EXCEPTION WHEN OTHERS THEN
  -- ignore if not existing
  NULL;
END$$;

SELECT cron.schedule(
  'publish-scheduled-posts-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://koymmvuhcxlvcuoyjnvv.supabase.co/functions/v1/publish-scheduled-posts',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveW1tdnVoY3hsdmN1b3lqbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODA3NTcsImV4cCI6MjA2OTk1Njc1N30.Pb5uz3xFH2Fupk9JSjcbxNrS-s_mE3ySnFy5B7HcZFw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
