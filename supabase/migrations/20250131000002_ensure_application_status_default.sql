-- Ensure application_status has correct default and no 'submitted' value
-- This migration fixes any remaining issues with application_status enum

-- 1. Remove any DEFAULT constraint that might be set to 'submitted' (which doesn't exist)
ALTER TABLE public.applications 
  ALTER COLUMN status DROP DEFAULT;

-- 2. Set correct default for new applications (only if status is NULL)
-- Note: The guard trigger will enforce 'new' for 'applied' source anyway
-- But we set a default to be safe
ALTER TABLE public.applications 
  ALTER COLUMN status SET DEFAULT 'new'::application_status;

-- 3. Ensure all existing applications have valid status
-- Update any invalid statuses to 'new'
UPDATE public.applications
SET status = 'new'::application_status
WHERE status::text NOT IN ('new', 'unlocked', 'interview', 'offer', 'hired', 'rejected', 'archived');

-- 4. Make sure status is NOT NULL (should already be, but ensure it)
ALTER TABLE public.applications 
  ALTER COLUMN status SET NOT NULL;

