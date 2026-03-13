-- Clean up redundant and potentially conflicting RLS policies on notifications table

-- Drop all old/redundant policies
DROP POLICY IF EXISTS "Users can view their own profile notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own profile notifications" ON public.notifications;
DROP POLICY IF EXISTS "Company members can view company notifications" ON public.notifications;
DROP POLICY IF EXISTS "Company members can update company notifications" ON public.notifications;

-- The correct policies from the previous migration should remain:
-- - "Users can view their own notifications" (covers both profile and company)
-- - "Users can update their own notifications" (covers both profile and company)
-- - "System can insert notifications" (allows system to create notifications)