-- Unify posts system: Combine posts table and community_posts table
-- This creates a unified view that combines both user posts and company posts

-- Create a unified view that combines both tables
DROP VIEW IF EXISTS posts_unified;
CREATE VIEW posts_unified AS
-- User posts from posts table
SELECT 
  id,
  user_id as author_id,
  'user'::text as author_type,
  user_id,
  NULL::uuid as company_id,
  content,
  NULL::text as body_md,
  CASE 
    WHEN image_url IS NOT NULL THEN 
      jsonb_build_array(jsonb_build_object('url', image_url, 'type', 'image'))
    ELSE '[]'::jsonb 
  END as media,
  '[]'::jsonb as documents,
  image_url,
  COALESCE(post_type, 'text') as post_type,
  COALESCE(status, 'published') as status,
  'public'::text as visibility,
  NULL::timestamptz as scheduled_at,
  created_at as published_at,
  COALESCE(likes_count, 0) as likes_count,
  COALESCE(comments_count, 0) as comments_count,
  0 as shares_count,
  0 as views_count,
  NULL::uuid as job_id,
  false as applies_enabled,
  NULL::text as cta_label,
  NULL::text as cta_url,
  NULL::text as promotion_theme,
  NULL::jsonb as tags,
  NULL::jsonb as industry_tags,
  NULL::jsonb as location_tags,
  NULL::jsonb as job_type_tags,
  NULL::jsonb as target_audience,
  created_at,
  updated_at
FROM posts
WHERE status IS NULL OR status = 'published'

UNION ALL

-- Company posts from community_posts table
SELECT 
  id,
  author_id,
  author_type,
  user_id,
  company_id,
  content,
  body_md,
  COALESCE(media, '[]'::jsonb) as media,
  COALESCE(documents, '[]'::jsonb) as documents,
  image_url,
  post_type,
  status,
  visibility,
  scheduled_at,
  published_at,
  likes_count,
  comments_count,
  shares_count,
  views_count,
  job_id,
  applies_enabled,
  cta_label,
  cta_url,
  promotion_theme,
  COALESCE(tags, '[]'::jsonb) as tags,
  COALESCE(industry_tags, '[]'::jsonb) as industry_tags,
  COALESCE(location_tags, '[]'::jsonb) as location_tags,
  COALESCE(job_type_tags, '[]'::jsonb) as job_type_tags,
  COALESCE(target_audience, '[]'::jsonb) as target_audience,
  created_at,
  updated_at
FROM community_posts
WHERE status = 'published';

-- Update posts_with_engagement to use posts_unified
DROP VIEW IF EXISTS posts_with_engagement;
CREATE VIEW posts_with_engagement AS
SELECT 
  p.*,
  COALESCE(
    COALESCE(likes_community.count, 0) + COALESCE(likes_legacy.count, 0),
    0
  )::integer as like_count,
  COALESCE(
    COALESCE(comments_community.count, 0) + COALESCE(comments_legacy.count, 0),
    0
  )::integer as comment_count,
  (
    (COALESCE(likes_community.count, 0) + COALESCE(likes_legacy.count, 0)) * 2 + 
    (COALESCE(comments_community.count, 0) + COALESCE(comments_legacy.count, 0)) * 3
  )::integer as engagement_score
FROM posts_unified p
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM community_likes 
  WHERE post_id IS NOT NULL
  GROUP BY post_id
) likes_community ON p.id = likes_community.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM community_comments 
  WHERE post_id IS NOT NULL AND is_deleted = false
  GROUP BY post_id
) comments_community ON p.id = comments_community.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_likes 
  WHERE post_id IS NOT NULL
  GROUP BY post_id
) likes_legacy ON p.id = likes_legacy.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_comments 
  WHERE post_id IS NOT NULL
  GROUP BY post_id
) comments_legacy ON p.id = comments_legacy.post_id;
