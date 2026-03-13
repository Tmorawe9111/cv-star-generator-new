-- =====================================================
-- BLOG SOCIAL MEDIA META TAGS
-- Erweitert blog_posts um Social Media Meta Tags
-- =====================================================

-- Open Graph Meta Tags
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS og_type TEXT DEFAULT 'article',
ADD COLUMN IF NOT EXISTS og_url TEXT;

-- Twitter Card Meta Tags
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS twitter_card TEXT DEFAULT 'summary_large_image' CHECK (twitter_card IN ('summary', 'summary_large_image', 'app', 'player')),
ADD COLUMN IF NOT EXISTS twitter_title TEXT,
ADD COLUMN IF NOT EXISTS twitter_description TEXT,
ADD COLUMN IF NOT EXISTS twitter_image TEXT,
ADD COLUMN IF NOT EXISTS twitter_site TEXT,
ADD COLUMN IF NOT EXISTS twitter_creator TEXT;

-- Video Support
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_embed_code TEXT;

-- Additional Media
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb; -- Array of {url, title, description}

-- Social Sharing
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS enable_social_sharing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Kommentare
COMMENT ON COLUMN public.blog_posts.og_title IS 'Open Graph Title (falls abweichend von seo_title)';
COMMENT ON COLUMN public.blog_posts.og_image IS 'Open Graph Image (falls abweichend von featured_image)';
COMMENT ON COLUMN public.blog_posts.twitter_card IS 'Twitter Card Type: summary, summary_large_image, app, player';
COMMENT ON COLUMN public.blog_posts.video_url IS 'URL zu Video (YouTube, Vimeo, etc.)';
COMMENT ON COLUMN public.blog_posts.video_embed_code IS 'Embed Code für Video';
COMMENT ON COLUMN public.blog_posts.gallery_images IS 'Array von Bild-URLs für Galerie';
COMMENT ON COLUMN public.blog_posts.external_links IS 'JSON Array von externen Links: [{"url": "...", "title": "...", "description": "..."}]';
COMMENT ON COLUMN public.blog_posts.enable_social_sharing IS 'Social Sharing Buttons anzeigen';
COMMENT ON COLUMN public.blog_posts.canonical_url IS 'Canonical URL für SEO';

