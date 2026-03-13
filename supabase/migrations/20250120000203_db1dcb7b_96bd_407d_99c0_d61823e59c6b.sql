-- Create notifications table
CREATE TYPE public.notif_recipient AS ENUM ('profile', 'company');
CREATE TYPE public.notif_type AS ENUM (
  'company_unlocked_you',
  'follow_request_received', 
  'pipeline_move_for_you',
  'post_interaction',
  'profile_incomplete_reminder',
  'weekly_digest_user',
  'new_matches_available',
  'follow_accepted_chat_unlocked',
  'candidate_response_to_unlock',
  'pipeline_activity_team',
  'low_tokens',
  'weekly_digest_company',
  'billing_update',
  'product_update'
);
CREATE TYPE public.notif_channel AS ENUM ('in_app', 'email');

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type public.notif_recipient NOT NULL,
  recipient_id UUID NOT NULL,
  type public.notif_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  actor_type public.notif_recipient,
  actor_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  group_key TEXT,
  priority INTEGER DEFAULT 0,
  channels public.notif_channel[] DEFAULT ARRAY['in_app'::public.notif_channel],
  read_at TIMESTAMP WITH TIME ZONE,
  seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE public.notification_prefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notif_type NOT NULL,
  in_app BOOLEAN NOT NULL DEFAULT true,
  email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own profile notifications" 
ON public.notifications 
FOR SELECT 
USING (
  recipient_type = 'profile' AND recipient_id = auth.uid()
);

CREATE POLICY "Company members can view company notifications" 
ON public.notifications 
FOR SELECT 
USING (
  recipient_type = 'company' AND 
  EXISTS (
    SELECT 1 FROM public.company_users cu 
    WHERE cu.company_id = notifications.recipient_id 
    AND cu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own profile notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  recipient_type = 'profile' AND recipient_id = auth.uid()
);

CREATE POLICY "Company members can update company notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  recipient_type = 'company' AND 
  EXISTS (
    SELECT 1 FROM public.company_users cu 
    WHERE cu.company_id = notifications.recipient_id 
    AND cu.user_id = auth.uid()
  )
);

-- RLS Policies for notification_prefs
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_prefs 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_type, recipient_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notification_prefs_user_type ON public.notification_prefs(user_id, type);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger for updated_at on notification_prefs
CREATE OR REPLACE FUNCTION public.update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON public.notification_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_prefs_updated_at();