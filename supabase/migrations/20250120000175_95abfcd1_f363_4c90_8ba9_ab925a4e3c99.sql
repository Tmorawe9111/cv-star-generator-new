-- Make community posts visible to all authenticated users regardless of "connections"
-- We update the helper used by many RLS policies instead of changing every policy.

CREATE OR REPLACE FUNCTION public.can_view_post(post_id uuid, viewer_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Allow viewing if the post is published (global community visibility)
  -- or if the viewer is the author of the post
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

-- Optional: ensure function has a secure owner and limited search_path is already set above.
COMMENT ON FUNCTION public.can_view_post(uuid, uuid) IS 'Returns true if a post is published (visible to all users) or owned by the viewer.';
