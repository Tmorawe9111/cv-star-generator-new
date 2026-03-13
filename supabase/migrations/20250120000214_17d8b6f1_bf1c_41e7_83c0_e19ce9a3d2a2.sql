-- Update the can_view_post function to include follow relationship check
-- Posts from Azubis (profiles) are only visible to companies that have an accepted follow relationship
CREATE OR REPLACE FUNCTION public.can_view_post(_post_id uuid, _viewer uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Check if post exists and get its details
  WITH post_details AS (
    SELECT p.status, p.user_id, p.author_id, p.author_type
    FROM public.posts p
    WHERE p.id = _post_id
  ),
  viewer_company AS (
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = _viewer 
    LIMIT 1
  )
  SELECT 
    CASE 
      -- Post belongs to the viewer - always visible
      WHEN pd.user_id = _viewer THEN true
      
      -- Post is published and NOT from a profile (e.g., company posts) - globally visible
      WHEN pd.status = 'published' AND pd.author_type != 'profile' THEN true
      
      -- Post is from a profile (Azubi) and viewer is a company
      WHEN pd.author_type = 'profile' AND EXISTS(SELECT 1 FROM viewer_company) THEN
        -- Check if there's an accepted follow relationship from profile to company
        EXISTS(
          SELECT 1 
          FROM public.follows f
          WHERE f.follower_type = 'profile'
            AND f.follower_id = pd.author_id
            AND f.followee_type = 'company' 
            AND f.followee_id = (SELECT company_id FROM viewer_company)
            AND f.status = 'accepted'
        )
        OR
        -- OR check if there's an accepted follow relationship from company to profile
        EXISTS(
          SELECT 1 
          FROM public.follows f
          WHERE f.follower_type = 'company'
            AND f.follower_id = (SELECT company_id FROM viewer_company)
            AND f.followee_type = 'profile'
            AND f.followee_id = pd.author_id
            AND f.status = 'accepted'
        )
      
      -- Post is published and from a profile, but viewer is not a company (e.g., another profile)
      WHEN pd.status = 'published' AND pd.author_type = 'profile' THEN true
      
      -- Default case - not visible
      ELSE false
    END
  FROM post_details pd
  WHERE pd.user_id IS NOT NULL; -- Ensure post exists
$function$;