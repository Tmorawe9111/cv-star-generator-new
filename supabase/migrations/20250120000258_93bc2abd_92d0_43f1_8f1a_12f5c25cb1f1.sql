-- Create cron job to auto-freeze unverified companies after 24 hours
SELECT cron.schedule(
  'auto-freeze-unverified-companies',
  '0 * * * *', -- Every hour
  $$
  SELECT auto_freeze_unverified_companies();
  $$
);