-- Harden user activity data visibility for post_likes and post_comments
-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Restrict existing policies to authenticated role while preserving current USING/USING checks
DO $$
BEGIN
  -- post_likes policies
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_likes' AND policyname='Users can view likes for visible posts'
  ) THEN
    ALTER POLICY "Users can view likes for visible posts" ON public.post_likes TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_likes' AND policyname='Users can like visible posts'
  ) THEN
    ALTER POLICY "Users can like visible posts" ON public.post_likes TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_likes' AND policyname='Users can remove their own likes'
  ) THEN
    ALTER POLICY "Users can remove their own likes" ON public.post_likes TO authenticated;
  END IF;

  -- post_comments policies
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_comments' AND policyname='Users can view comments for visible posts'
  ) THEN
    ALTER POLICY "Users can view comments for visible posts" ON public.post_comments TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_comments' AND policyname='Users can comment on visible posts'
  ) THEN
    ALTER POLICY "Users can comment on visible posts" ON public.post_comments TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_comments' AND policyname='Users can delete own comments'
  ) THEN
    ALTER POLICY "Users can delete own comments" ON public.post_comments TO authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_comments' AND policyname='Users can update own comments'
  ) THEN
    ALTER POLICY "Users can update own comments" ON public.post_comments TO authenticated;
  END IF;
END $$;