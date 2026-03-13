
-- 1) Social Graph erweitern: Follow-Status
ALTER TABLE public.follows
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('pending','accepted','blocked'));

CREATE UNIQUE INDEX IF NOT EXISTS follows_unique_pair ON public.follows (follower_id, following_id);

-- 2) Posts erweitern: Sichtbarkeit, Status, Zeiten
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'CommunityAndCompanies'
    CHECK (visibility IN ('CommunityOnly','CommunityAndCompanies')),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft','scheduled','published','deleted')),
  ADD COLUMN IF NOT EXISTS published_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_posts_published_at_id ON public.posts (published_at, id);

-- 3) Helper-Funktion: Company-Mitgliedschaft für beliebigen User prüfen (nicht nur auth.uid)
CREATE OR REPLACE FUNCTION public.is_company_member_uid(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.company_users cu where cu.user_id = _uid
  );
$$;

-- 4) 1. Grad
CREATE OR REPLACE FUNCTION public.viewer_first_degree(viewer uuid)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select f.following_id as id
  from public.follows f
  where f.follower_id = viewer and f.status = 'accepted';
$$;

-- 5) 2. Grad (begrenzt)
CREATE OR REPLACE FUNCTION public.viewer_second_degree(viewer uuid)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select distinct f2.following_id as id
  from public.follows f1
  join public.follows f2 on f2.follower_id = f1.following_id
  where f1.follower_id = viewer
    and f1.status = 'accepted'
    and f2.status = 'accepted'
    and f2.following_id <> viewer;
$$;

-- 6) Sichtbarkeits-/Graph-Check für einen Post
CREATE OR REPLACE FUNCTION public.can_view_post(_post_id uuid, _viewer uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
  is_company boolean;
  in_first_degree boolean;
  in_second_degree boolean;
BEGIN
  SELECT id, user_id, visibility, status, published_at INTO p
  FROM public.posts WHERE id = _post_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF p.status <> 'published' THEN
    RETURN false;
  END IF;

  -- Company-Viewer sehen CommunityOnly nicht
  is_company := public.is_company_member_uid(_viewer);
  IF p.visibility = 'CommunityOnly' AND is_company THEN
    RETURN false;
  END IF;

  -- Autor selbst
  IF p.user_id = _viewer THEN
    RETURN true;
  END IF;

  -- 1. Grad
  SELECT exists (select 1 from public.viewer_first_degree(_viewer) v where v.id = p.user_id) INTO in_first_degree;
  IF in_first_degree THEN
    RETURN true;
  END IF;

  -- 2. Grad
  SELECT exists (select 1 from public.viewer_second_degree(_viewer) v where v.id = p.user_id) INTO in_second_degree;
  IF in_second_degree THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 7) RPC: Cursorbasierter Feed
CREATE OR REPLACE FUNCTION public.get_feed(
  viewer_id uuid,
  after_published timestamptz DEFAULT NULL,
  after_id uuid DEFAULT NULL,
  limit_count int DEFAULT 20
)
RETURNS SETOF public.posts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select p.*
  from public.posts p
  where public.can_view_post(p.id, viewer_id)
    and (after_published is null or (p.published_at, p.id) < (after_published, after_id))
  order by p.published_at desc, p.id desc
  limit greatest(limit_count, 1)
$$;

-- 8) RLS verschärfen: nur gemäß can_view_post
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'posts' AND policyname = 'Posts are viewable by everyone'
  ) THEN
    EXECUTE 'DROP POLICY "Posts are viewable by everyone" ON public.posts';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'posts' AND policyname = 'View posts per visibility and graph'
  ) THEN
    EXECUTE 'CREATE POLICY "View posts per visibility and graph" ON public.posts
             FOR SELECT TO authenticated
             USING (public.can_view_post(id, auth.uid()))';
  END IF;
END$$;

-- bestehende INSERT/UPDATE/DELETE-Policies bleiben unverändert

-- 9) Realtime freundlich
ALTER TABLE public.posts REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'posts'
     )
  THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.posts';
  END IF;
END$$;
