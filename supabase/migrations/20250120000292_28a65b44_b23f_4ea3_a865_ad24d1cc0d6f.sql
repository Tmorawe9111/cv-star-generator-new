-- Fix RLS policy for notifications table
-- The error occurs because of incorrect type casting and enum comparison

-- Drop the faulty policy if it exists
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Recreate the correct policy
-- Both recipient_id and auth.uid() are UUIDs, no casting needed
-- We need to explicitly cast the string literal to notif_recipient enum
-- company_users uses accepted_at to check if user is accepted (not a status column)
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (
  (recipient_type = 'profile'::notif_recipient AND recipient_id = auth.uid())
  OR
  (recipient_type = 'company'::notif_recipient AND recipient_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL
  ))
);

-- Also ensure insert policy exists for notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);  -- Notifications are created by triggers/functions, not directly by users

-- Update policy for marking as read
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (
  (recipient_type = 'profile'::notif_recipient AND recipient_id = auth.uid())
  OR
  (recipient_type = 'company'::notif_recipient AND recipient_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL
  ))
);