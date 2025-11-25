-- Create function for tags-based feed filtering
-- This function filters posts based on user/company interests, followed companies, and tags

CREATE OR REPLACE FUNCTION public.get_tagged_feed(
  p_viewer_id UUID,
  p_viewer_type TEXT DEFAULT 'user', -- 'user' or 'company'
  p_limit_count INTEGER DEFAULT 20,
  p_after_published TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  author_type TEXT,
  user_id UUID,
  company_id UUID,
  content TEXT,
  body_md TEXT,
  media JSONB,
  documents JSONB,
  image_url TEXT,
  post_type TEXT,
  status TEXT,
  visibility TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  views_count INTEGER,
  job_id UUID,
  applies_enabled BOOLEAN,
  cta_label TEXT,
  cta_url TEXT,
  promotion_theme TEXT,
  tags JSONB,
  industry_tags JSONB,
  location_tags JSONB,
  job_type_tags JSONB,
  target_audience JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  engagement_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_branche TEXT;
  v_user_ort TEXT;
  v_user_status TEXT;
  v_company_industry TEXT;
  v_company_city TEXT;
  v_followed_companies UUID[];
BEGIN
  -- Get viewer's profile data for tag matching
  IF p_viewer_type = 'user' THEN
    SELECT branche, ort, status
    INTO v_user_branche, v_user_ort, v_user_status
    FROM profiles
    WHERE id = p_viewer_id;
    
    -- Get followed companies (users following companies)
    SELECT ARRAY_AGG(followee_id)
    INTO v_followed_companies
    FROM follows
    WHERE follower_type = 'profile' 
      AND follower_id = p_viewer_id 
      AND followee_type = 'company'
      AND status = 'accepted';
  ELSIF p_viewer_type = 'company' THEN
    -- Use main_location (city column may not exist)
    SELECT industry, main_location
    INTO v_company_industry, v_company_city
    FROM companies
    WHERE id = p_viewer_id;
  END IF;

  RETURN QUERY
  WITH scored_posts AS (
    SELECT 
      p.*,
      (
        -- Base engagement score
        (COALESCE(p.likes_count, 0) * 2 + COALESCE(p.comments_count, 0) * 3) +
        -- Tag matching bonus (industry match: +10, location match: +5, followed company: +20)
        CASE 
          WHEN p_viewer_type = 'user' THEN
            CASE 
              WHEN v_user_branche IS NOT NULL AND (p.industry_tags @> jsonb_build_array(LOWER(v_user_branche))) THEN 10
              ELSE 0
            END +
            CASE 
              WHEN v_user_ort IS NOT NULL AND (p.location_tags @> jsonb_build_array(LOWER(v_user_ort))) THEN 5
              ELSE 0
            END +
            CASE 
              WHEN v_followed_companies IS NOT NULL AND p.company_id = ANY(v_followed_companies) THEN 20
              ELSE 0
            END +
            CASE 
              WHEN v_user_status IS NOT NULL AND (p.target_audience @> jsonb_build_array(LOWER(v_user_status))) THEN 10
              ELSE 0
            END
          WHEN p_viewer_type = 'company' THEN
            CASE 
              WHEN v_company_industry IS NOT NULL AND (p.industry_tags @> jsonb_build_array(LOWER(v_company_industry))) THEN 10
              ELSE 0
            END +
            CASE 
              WHEN v_company_city IS NOT NULL AND (p.location_tags @> jsonb_build_array(LOWER(v_company_city))) THEN 5
              ELSE 0
            END
          ELSE 0
        END
      )::integer as engagement_score
    FROM posts p
    WHERE p.status = 'published'
      AND (
        -- Visibility rules
        (p.visibility = 'CommunityAndCompanies') OR
        (p.visibility = 'Community' AND p_viewer_type = 'user' AND p.author_type = 'user')
      )
      AND (
        p_after_published IS NULL OR p.published_at < p_after_published
      )
  )
  SELECT 
    sp.id,
    sp.author_id,
    sp.author_type,
    sp.user_id,
    sp.company_id,
    sp.content,
    sp.body_md,
    sp.media,
    sp.documents,
    sp.image_url,
    sp.post_type,
    sp.status,
    sp.visibility,
    sp.scheduled_at,
    sp.published_at,
    sp.likes_count,
    sp.comments_count,
    sp.shares_count,
    sp.views_count,
    sp.job_id,
    sp.applies_enabled,
    sp.cta_label,
    sp.cta_url,
    sp.promotion_theme,
    sp.tags,
    sp.industry_tags,
    sp.location_tags,
    sp.job_type_tags,
    sp.target_audience,
    sp.created_at,
    sp.updated_at,
    sp.engagement_score
  FROM scored_posts sp
  ORDER BY sp.engagement_score DESC, sp.published_at DESC
  LIMIT p_limit_count;
END;
$$;

-- Update posts_with_engagement view to use posts table directly
-- Use only existing tables (post_likes, post_comments)
-- If community_likes/community_comments exist, they will be added in a separate migration
DROP VIEW IF EXISTS posts_with_engagement;

CREATE VIEW posts_with_engagement AS
SELECT 
  p.*,
  COALESCE(likes_post.count, 0)::integer as like_count,
  COALESCE(comments_post.count, 0)::integer as comment_count,
  (
    COALESCE(likes_post.count, 0) * 2 + 
    COALESCE(comments_post.count, 0) * 3
  )::integer as engagement_score
FROM posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_likes 
  WHERE post_id IS NOT NULL
  GROUP BY post_id
) likes_post ON p.id = likes_post.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_comments 
  WHERE post_id IS NOT NULL
  GROUP BY post_id
) comments_post ON p.id = comments_post.post_id
WHERE p.status = 'published';

