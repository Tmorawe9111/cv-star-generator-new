-- Drop existing helper to avoid parameter name conflict
DROP FUNCTION IF EXISTS public.can_view_post(uuid, uuid);

-- Recreate with global-visibility logic for published posts
CREATE FUNCTION public.can_view_post(post_id uuid, viewer_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Visible if the post is published (global)
  -- or the viewer is the author
  SELECT EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.status = 'published'
  )
  OR EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.user_id = viewer_id
  );
$$;

COMMENT ON FUNCTION public.can_view_post(uuid, uuid) IS 'True if post is published (visible to all users) or owned by the viewer.';
