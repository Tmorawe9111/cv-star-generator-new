-- Extend community_posts for CTA/promotions
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS promotion_theme text;

-- Refresh posts view to expose new columns
CREATE OR REPLACE VIEW posts AS
SELECT
  id,
  author_id,
  author_type,
  user_id,
  company_id,
  content,
  body_md,
  media,
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
  created_at,
  updated_at
FROM public.community_posts;

CREATE OR REPLACE VIEW posts_authenticated AS
SELECT
  id,
  author_id,
  author_type,
  user_id,
  company_id,
  content,
  body_md,
  media,
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
  created_at,
  updated_at
FROM public.community_posts
WHERE status = 'published';
