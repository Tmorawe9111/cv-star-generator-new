-- Add interview-related notification types to notif_type enum
-- These values are needed for the interview request system

DO $$ 
BEGIN
  -- Add interview_request_received
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'interview_request_received' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notif_type')
  ) THEN
    ALTER TYPE notif_type ADD VALUE 'interview_request_received';
  END IF;

  -- Add interview_request_accepted
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'interview_request_accepted' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notif_type')
  ) THEN
    ALTER TYPE notif_type ADD VALUE 'interview_request_accepted';
  END IF;

  -- Add interview_request_declined
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'interview_request_declined' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notif_type')
  ) THEN
    ALTER TYPE notif_type ADD VALUE 'interview_request_declined';
  END IF;
END $$;

