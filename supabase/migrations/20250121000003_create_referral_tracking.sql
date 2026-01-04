-- Create referral_tracking table for influencer link tracking
CREATE TABLE IF NOT EXISTS public.referral_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Referral source information
  referral_source text, -- e.g., 'influencer', 'partner', 'organic'
  referral_name text, -- e.g., 'Nakam', 'Influencer Name'
  referral_code text, -- Unique code for the influencer/partner
  
  -- UTM parameters
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  
  -- Tracking data
  session_id text, -- Browser session ID
  user_agent text,
  ip_address inet,
  landing_page text, -- First page visited
  referrer_url text, -- HTTP referrer
  
  -- Conversion tracking
  clicked_at timestamp with time zone DEFAULT now(), -- When link was clicked
  registered_at timestamp with time zone, -- When user registered
  profile_completed_at timestamp with time zone, -- When profile was completed
  cv_created_at timestamp with time zone, -- When CV was created
  
  -- User reference (set after registration)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for fast queries
CREATE INDEX idx_referral_tracking_referral_code ON public.referral_tracking(referral_code);
CREATE INDEX idx_referral_tracking_user_id ON public.referral_tracking(user_id);
CREATE INDEX idx_referral_tracking_created_at ON public.referral_tracking(created_at);
CREATE INDEX idx_referral_tracking_referral_source ON public.referral_tracking(referral_source);
CREATE INDEX idx_referral_tracking_session_id ON public.referral_tracking(session_id);

-- Enable RLS
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for tracking)
CREATE POLICY "Allow public to insert referral tracking"
ON public.referral_tracking FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Allow users to read their own tracking data
CREATE POLICY "Allow users to read own tracking data"
ON public.referral_tracking FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow admins to read all tracking data
CREATE POLICY "Allow admins to read all referral tracking"
ON public.referral_tracking FOR SELECT
TO service_role
USING (true);

-- Function to update conversion timestamps
CREATE OR REPLACE FUNCTION public.update_referral_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- When user registers, update registered_at
  IF NEW.user_id IS NOT NULL AND OLD.user_id IS NULL THEN
    UPDATE public.referral_tracking
    SET registered_at = now(), user_id = NEW.id
    WHERE session_id = (
      SELECT session_id 
      FROM public.referral_tracking 
      WHERE user_id IS NULL 
      ORDER BY created_at DESC 
      LIMIT 1
    )
    AND user_id IS NULL
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles table to track profile completion
CREATE OR REPLACE FUNCTION public.track_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When profile is marked as complete, update referral_tracking
  IF NEW.profile_complete = true AND (OLD.profile_complete IS NULL OR OLD.profile_complete = false) THEN
    UPDATE public.referral_tracking
    SET profile_completed_at = now(), profile_id = NEW.id
    WHERE user_id = NEW.id
    AND profile_completed_at IS NULL
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_profile_completion_track ON public.profiles;
CREATE TRIGGER on_profile_completion_track
  AFTER UPDATE OF profile_complete ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.track_profile_completion();

-- View for analytics (conversion rates)
CREATE OR REPLACE VIEW public.referral_analytics AS
SELECT 
  referral_source,
  referral_name,
  referral_code,
  utm_source,
  utm_medium,
  utm_campaign,
  
  -- Counts
  COUNT(*) as total_clicks,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(user_id) FILTER (WHERE user_id IS NOT NULL) as registrations,
  COUNT(profile_completed_at) FILTER (WHERE profile_completed_at IS NOT NULL) as completed_profiles,
  COUNT(cv_created_at) FILTER (WHERE cv_created_at IS NOT NULL) as cv_creations,
  
  -- Conversion rates
  ROUND(
    COUNT(user_id) FILTER (WHERE user_id IS NOT NULL)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as click_to_registration_rate,
  
  ROUND(
    COUNT(profile_completed_at) FILTER (WHERE profile_completed_at IS NOT NULL)::numeric / 
    NULLIF(COUNT(user_id) FILTER (WHERE user_id IS NOT NULL), 0) * 100, 
    2
  ) as registration_to_profile_rate,
  
  ROUND(
    COUNT(profile_completed_at) FILTER (WHERE profile_completed_at IS NOT NULL)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as click_to_profile_rate,
  
  -- Time ranges
  MIN(clicked_at) as first_click,
  MAX(clicked_at) as last_click,
  DATE_TRUNC('day', clicked_at) as click_date
  
FROM public.referral_tracking
GROUP BY 
  referral_source,
  referral_name,
  referral_code,
  utm_source,
  utm_medium,
  utm_campaign,
  DATE_TRUNC('day', clicked_at);

-- Comments
COMMENT ON TABLE public.referral_tracking IS 'Tracks referral links from influencers, partners, and marketing campaigns';
COMMENT ON COLUMN public.referral_tracking.referral_code IS 'Unique code for each influencer/partner (e.g., NAKAM2024)';
COMMENT ON VIEW public.referral_analytics IS 'Analytics view showing conversion rates for referral sources';

