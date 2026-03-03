-- KOMMENTAR-LIKES & VERSCHACHTELTE KOMMENTARE
-- Führen Sie diesen Code im Supabase Dashboard SQL Editor aus

-- 1. Tabelle für Kommentar-Likes erstellen
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- 2. Parent-Comment Spalte hinzufügen (für verschachtelte Kommentare)
ALTER TABLE post_comments 
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- 3. Like-Counter zur Kommentar-Tabelle hinzufügen
ALTER TABLE post_comments 
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- 4. Trigger für automatisches Aktualisieren des Like-Counters
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments 
    SET like_count = like_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments 
    SET like_count = GREATEST(like_count - 1, 0) 
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_like_count_trigger ON comment_likes;
CREATE TRIGGER comment_like_count_trigger
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- 5. RLS deaktivieren für Tests
ALTER TABLE comment_likes DISABLE ROW LEVEL SECURITY;

-- 6. Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);

-- 7. Bestätigung
SELECT 
  'Kommentar-Likes & Verschachtelte Kommentare bereit!' as status,
  (SELECT COUNT(*) FROM comment_likes) as total_comment_likes,
  (SELECT COUNT(*) FROM post_comments WHERE parent_comment_id IS NOT NULL) as total_replies;

