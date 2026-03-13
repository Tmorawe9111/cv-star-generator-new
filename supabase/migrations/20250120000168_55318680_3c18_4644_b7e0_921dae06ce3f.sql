
-- 1) Likes für Posts
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_likes_unique UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS: Nur Likes für sichtbare Posts lesen
CREATE POLICY "Users can view likes for visible posts"
  ON public.post_likes
  FOR SELECT
  USING (can_view_post(post_id, auth.uid()));

-- RLS: Nur eigene Likes anlegen und nur auf sichtbare Posts
CREATE POLICY "Users can like visible posts"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND can_view_post(post_id, auth.uid()));

-- RLS: Nur eigene Likes löschen
CREATE POLICY "Users can remove their own likes"
  ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- sinnvolle Indizes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);


-- 2) Kommentare für Posts
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS: Kommentare auf sichtbaren Posts lesen
CREATE POLICY "Users can view comments for visible posts"
  ON public.post_comments
  FOR SELECT
  USING (can_view_post(post_id, auth.uid()));

-- RLS: Eigene Kommentare anlegen auf sichtbaren Posts
CREATE POLICY "Users can comment on visible posts"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND can_view_post(post_id, auth.uid()));

-- RLS: Eigene Kommentare bearbeiten
CREATE POLICY "Users can update own comments"
  ON public.post_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS: Eigene Kommentare löschen
CREATE POLICY "Users can delete own comments"
  ON public.post_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at-Trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.post_comments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

-- sinnvolle Indizes
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id_created_at ON public.post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON public.post_comments(parent_comment_id);
