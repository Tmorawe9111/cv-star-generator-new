-- SOFORTIGE LÖSUNG - Posts System komplett neu aufbauen (KORRIGIERT)
-- Führen Sie diesen Code im Supabase Dashboard SQL Editor aus

-- 1. Alle bestehenden Tabellen löschen
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS community_likes CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE;
DROP TABLE IF EXISTS community_shares CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS shares CASCADE;

-- 2. Einfache, funktionierende Posts-Tabelle erstellen
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Likes-Tabelle erstellen
CREATE TABLE public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 4. Comments-Tabelle erstellen
CREATE TABLE public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. RLS komplett deaktivieren für Tests
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments DISABLE ROW LEVEL SECURITY;

-- 6. Erfolgsmeldung
SELECT 'Posts System erfolgreich erstellt!' as status,
       'Tabellen: posts, post_likes, post_comments' as tables,
       'RLS: Deaktiviert' as security;

-- Optional: Test-Post mit einem echten User erstellen
-- Ersetzen Sie 'YOUR-USER-ID' mit Ihrer echten User-ID
-- INSERT INTO public.posts (content, user_id) VALUES 
-- ('Mein erster Test Post!', 'YOUR-USER-ID');