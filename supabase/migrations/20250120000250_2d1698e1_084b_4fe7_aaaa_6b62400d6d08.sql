-- Phase 1: Datenbank-Erweiterungen für Posts mit Medien und Dokumenten

-- 1.1 Posts-Tabelle erweitern (Tabelle heißt "posts")
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media jsonb DEFAULT '[]'::jsonb;

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb;

-- 1.2 Trigger für comment_likes (automatische like_count Aktualisierung)
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments 
    SET like_count = COALESCE(like_count, 0) + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments 
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) 
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen (mit DROP IF EXISTS für Sicherheit)
DROP TRIGGER IF EXISTS comment_like_count_trigger ON comment_likes;
CREATE TRIGGER comment_like_count_trigger
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();