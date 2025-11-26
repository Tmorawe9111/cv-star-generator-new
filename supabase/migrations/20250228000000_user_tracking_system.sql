-- =====================================================
-- USER TRACKING & PERSONALIZATION SYSTEM
-- Instagram/TikTok-style implicit learning
-- =====================================================

-- 1. User Interactions Table (raw events)
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What action was taken
  action TEXT NOT NULL CHECK (action IN (
    'view', 'like', 'unlike', 'comment', 'share', 'save', 'unsave',
    'follow', 'unfollow', 'connect', 'disconnect',
    'apply', 'search', 'click', 'join_group', 'leave_group'
  )),
  
  -- What was the target
  target_type TEXT NOT NULL CHECK (target_type IN (
    'post', 'job', 'company', 'profile', 'group'
  )),
  target_id UUID NOT NULL,
  
  -- Extracted tags/metadata for quick aggregation
  metadata JSONB DEFAULT '{}',
  -- Example: { "branche": "IT", "berufsfeld": "Softwareentwicklung", "region": "Frankfurt" }
  
  -- Engagement metrics
  duration_seconds INT, -- How long they viewed
  scroll_depth FLOAT,   -- 0-1, how far they scrolled
  
  -- Context
  source TEXT, -- 'feed', 'search', 'profile', 'notification', 'direct'
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_user_interactions_user ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_action ON public.user_interactions(action);
CREATE INDEX idx_user_interactions_target ON public.user_interactions(target_type, target_id);
CREATE INDEX idx_user_interactions_created ON public.user_interactions(created_at DESC);
CREATE INDEX idx_user_interactions_metadata ON public.user_interactions USING GIN(metadata);

-- 2. User Interests Table (aggregated scores)
CREATE TABLE IF NOT EXISTS public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Interest category and value
  interest_type TEXT NOT NULL CHECK (interest_type IN (
    'branche', 'berufsfeld', 'region', 'thema', 'company', 'skill'
  )),
  interest_value TEXT NOT NULL,
  
  -- Scoring
  score FLOAT DEFAULT 0.0 CHECK (score >= 0 AND score <= 1),
  interaction_count INT DEFAULT 0,
  
  -- Timestamps
  first_interaction TIMESTAMPTZ DEFAULT NOW(),
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, interest_type, interest_value)
);

CREATE INDEX idx_user_interests_user ON public.user_interests(user_id);
CREATE INDEX idx_user_interests_score ON public.user_interests(user_id, score DESC);
CREATE INDEX idx_user_interests_type ON public.user_interests(interest_type, interest_value);

-- 3. Content Tags Table (for matching)
CREATE TABLE IF NOT EXISTS public.content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'job', 'company', 'group')),
  content_id UUID NOT NULL,
  
  tag_type TEXT NOT NULL, -- 'branche', 'berufsfeld', 'region', 'thema'
  tag_value TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(content_type, content_id, tag_type, tag_value)
);

CREATE INDEX idx_content_tags_content ON public.content_tags(content_type, content_id);
CREATE INDEX idx_content_tags_tag ON public.content_tags(tag_type, tag_value);

-- 4. RLS Policies
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

-- Users can only see/create their own interactions
CREATE POLICY "Users can insert own interactions" ON public.user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON public.user_interactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can see their own interests
CREATE POLICY "Users can view own interests" ON public.user_interests
  FOR SELECT USING (auth.uid() = user_id);

-- Content tags are public (for matching)
CREATE POLICY "Anyone can view content tags" ON public.content_tags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can create content tags" ON public.content_tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Function to track interaction
CREATE OR REPLACE FUNCTION public.track_interaction(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_metadata JSONB DEFAULT '{}',
  p_duration_seconds INT DEFAULT NULL,
  p_source TEXT DEFAULT 'feed'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  INSERT INTO public.user_interactions (
    user_id, action, target_type, target_id, metadata, duration_seconds, source
  ) VALUES (
    auth.uid(), p_action, p_target_type, p_target_id, p_metadata, p_duration_seconds, p_source
  )
  RETURNING id INTO v_interaction_id;
  
  -- Update aggregated interests based on metadata
  PERFORM public.update_user_interests_from_interaction(
    auth.uid(), p_action, p_metadata
  );
  
  RETURN v_interaction_id;
END;
$$;

-- 6. Function to update interests from interaction
CREATE OR REPLACE FUNCTION public.update_user_interests_from_interaction(
  p_user_id UUID,
  p_action TEXT,
  p_metadata JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_weight FLOAT;
  v_key TEXT;
  v_value TEXT;
BEGIN
  -- Action weights
  v_weight := CASE p_action
    WHEN 'apply' THEN 1.0
    WHEN 'save' THEN 0.8
    WHEN 'share' THEN 0.8
    WHEN 'follow' THEN 0.7
    WHEN 'connect' THEN 0.7
    WHEN 'join_group' THEN 0.7
    WHEN 'comment' THEN 0.6
    WHEN 'like' THEN 0.5
    WHEN 'search' THEN 0.4
    WHEN 'click' THEN 0.3
    WHEN 'view' THEN 0.2
    ELSE 0.1
  END;
  
  -- Extract and update interests from metadata
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_metadata)
  LOOP
    IF v_key IN ('branche', 'berufsfeld', 'region', 'thema', 'company', 'skill') THEN
      INSERT INTO public.user_interests (user_id, interest_type, interest_value, score, interaction_count, last_interaction)
      VALUES (p_user_id, v_key, v_value, v_weight * 0.1, 1, NOW())
      ON CONFLICT (user_id, interest_type, interest_value)
      DO UPDATE SET
        score = LEAST(1.0, user_interests.score + (v_weight * 0.05)),
        interaction_count = user_interests.interaction_count + 1,
        last_interaction = NOW(),
        updated_at = NOW();
    END IF;
  END LOOP;
END;
$$;

-- 7. Function to get personalized feed score for content
CREATE OR REPLACE FUNCTION public.get_content_score_for_user(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id UUID
)
RETURNS FLOAT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_score FLOAT := 0;
  v_tag RECORD;
  v_user_interest RECORD;
BEGIN
  -- Get all tags for this content
  FOR v_tag IN 
    SELECT tag_type, tag_value FROM public.content_tags 
    WHERE content_type = p_content_type AND content_id = p_content_id
  LOOP
    -- Check if user has interest in this tag
    SELECT score INTO v_user_interest
    FROM public.user_interests
    WHERE user_id = p_user_id 
      AND interest_type = v_tag.tag_type 
      AND interest_value = v_tag.tag_value;
    
    IF FOUND THEN
      v_score := v_score + v_user_interest.score;
    END IF;
  END LOOP;
  
  RETURN v_score;
END;
$$;

-- 8. Function to get personalized feed
CREATE OR REPLACE FUNCTION public.get_personalized_feed(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  content_type TEXT,
  content_id UUID,
  relevance_score FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH user_top_interests AS (
    SELECT interest_type, interest_value, score
    FROM public.user_interests
    WHERE user_id = auth.uid()
    ORDER BY score DESC
    LIMIT 10
  ),
  scored_posts AS (
    SELECT 
      'post'::TEXT as content_type,
      p.id as content_id,
      COALESCE(SUM(ui.score), 0) + 
      -- Recency boost (posts from last 24h get +0.3)
      CASE WHEN p.created_at > NOW() - INTERVAL '24 hours' THEN 0.3 ELSE 0 END +
      -- Engagement boost
      (COALESCE(p.likes_count, 0) * 0.01) as relevance_score,
      p.created_at
    FROM public.posts p
    LEFT JOIN public.content_tags ct ON ct.content_type = 'post' AND ct.content_id = p.id
    LEFT JOIN user_top_interests ui ON ui.interest_type = ct.tag_type AND ui.interest_value = ct.tag_value
    WHERE p.created_at > NOW() - INTERVAL '30 days'
    GROUP BY p.id, p.created_at, p.likes_count
  )
  SELECT * FROM scored_posts
  ORDER BY relevance_score DESC, created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 9. Function to initialize interests from profile
CREATE OR REPLACE FUNCTION public.initialize_user_interests_from_profile(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile RECORD;
  v_exp JSONB;
  v_edu JSONB;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN RETURN; END IF;
  
  -- Add branche from profile
  IF v_profile.branche IS NOT NULL THEN
    INSERT INTO public.user_interests (user_id, interest_type, interest_value, score, interaction_count)
    VALUES (p_user_id, 'branche', v_profile.branche, 0.8, 1)
    ON CONFLICT (user_id, interest_type, interest_value) DO NOTHING;
  END IF;
  
  -- Add region from profile
  IF v_profile.stadt IS NOT NULL THEN
    INSERT INTO public.user_interests (user_id, interest_type, interest_value, score, interaction_count)
    VALUES (p_user_id, 'region', v_profile.stadt, 0.7, 1)
    ON CONFLICT (user_id, interest_type, interest_value) DO NOTHING;
  END IF;
  
  -- Add wunschberuf as berufsfeld
  IF v_profile.wunschberuf IS NOT NULL THEN
    INSERT INTO public.user_interests (user_id, interest_type, interest_value, score, interaction_count)
    VALUES (p_user_id, 'berufsfeld', v_profile.wunschberuf, 0.6, 1)
    ON CONFLICT (user_id, interest_type, interest_value) DO NOTHING;
  END IF;
  
  -- Extract from berufserfahrung
  IF v_profile.berufserfahrung IS NOT NULL THEN
    FOR v_exp IN SELECT * FROM jsonb_array_elements(v_profile.berufserfahrung::jsonb)
    LOOP
      IF v_exp->>'unternehmen' IS NOT NULL THEN
        INSERT INTO public.user_interests (user_id, interest_type, interest_value, score, interaction_count)
        VALUES (p_user_id, 'company', v_exp->>'unternehmen', 0.5, 1)
        ON CONFLICT (user_id, interest_type, interest_value) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$;

-- 10. Trigger to auto-initialize interests when profile is created/updated
CREATE OR REPLACE FUNCTION public.trigger_initialize_interests()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.initialize_user_interests_from_profile(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_update_interests ON public.profiles;
CREATE TRIGGER on_profile_update_interests
  AFTER INSERT OR UPDATE OF branche, stadt, wunschberuf, berufserfahrung
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_initialize_interests();

-- 11. Grant permissions
GRANT SELECT, INSERT ON public.user_interactions TO authenticated;
GRANT SELECT ON public.user_interests TO authenticated;
GRANT SELECT, INSERT ON public.content_tags TO authenticated;

GRANT EXECUTE ON FUNCTION public.track_interaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_personalized_feed TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_score_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_user_interests_from_profile TO authenticated;

