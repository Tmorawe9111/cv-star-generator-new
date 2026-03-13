-- Create analytics_events table to track all user interactions
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'page_view', 'button_click', etc.
  event_name TEXT NOT NULL, -- Name of the event (button label, page name, etc.)
  page_url TEXT,
  page_path TEXT,
  button_label TEXT,
  button_type TEXT, -- 'calendly', 'cta', 'navigation', etc.
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  metadata JSONB, -- Additional data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_page_path ON public.analytics_events(page_path);
CREATE INDEX idx_analytics_events_button_label ON public.analytics_events(button_label);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics events (for tracking)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Only allow authenticated users to read analytics (for dashboard)
CREATE POLICY "Authenticated users can view analytics"
ON public.analytics_events
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create a view for analytics summary
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT 
  DATE(created_at) as date,
  event_type,
  event_name,
  COUNT(*) as count
FROM public.analytics_events
GROUP BY DATE(created_at), event_type, event_name
ORDER BY date DESC, count DESC;