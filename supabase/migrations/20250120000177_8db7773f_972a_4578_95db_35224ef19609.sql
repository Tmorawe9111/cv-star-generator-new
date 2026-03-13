-- Update the existing helper without dropping it by keeping the same parameter names
CREATE OR REPLACE FUNCTION public.can_view_post(_post_id uuid, _viewer_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Visible if the post is published (global) or owned by the viewer
  SELECT EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = _post_id
      AND p.status = 'published'
  )
  OR EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = _post_id
      AND p.user_id = _viewer_id
  );
$$;

COMMENT ON FUNCTION public.can_view_post(uuid, uuid) IS 'True if post is published (visible to all users) or owned by the viewer.';
