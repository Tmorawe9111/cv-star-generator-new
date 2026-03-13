-- Fix profiles table access by creating the missing view with correct columns  
CREATE OR REPLACE VIEW profiles_public AS
SELECT 
    id,
    vorname,
    nachname,
    avatar_url,
    full_name,
    company_id,
    company_name,
    company_logo,
    employment_status
FROM profiles_public_secure
WHERE id IS NOT NULL;

-- Add scheduled posts support to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
CREATE INDEX IF NOT EXISTS idx_community_posts_scheduled ON community_posts(scheduled_at, status);

-- Enable realtime for community_posts table (just replica identity since it's already in publication)
ALTER TABLE community_posts REPLICA IDENTITY FULL;