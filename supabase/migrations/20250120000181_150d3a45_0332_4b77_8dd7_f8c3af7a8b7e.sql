-- Fix function ordering error: define is_connected before using in policy
CREATE OR REPLACE FUNCTION public.is_connected(_u1 uuid, _u2 uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE status = 'accepted'
        AND (
          (requester_id = _u1 AND addressee_id = _u2)
          OR (requester_id = _u2 AND addressee_id = _u1)
        )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks
      WHERE (blocker_id = _u1 AND blocked_id = _u2)
         OR (blocker_id = _u2 AND blocked_id = _u1)
    );
$$;

COMMENT ON FUNCTION public.is_connected(uuid, uuid) IS 'Returns true if users are mutually connected (accepted) and not blocked.';

-- Recreate the conversations insert policy to reference the function safely
DROP POLICY IF EXISTS "Participants can create conversations if connected" ON public.conversations;
CREATE POLICY "Participants can create conversations if connected"
ON public.conversations
FOR INSERT
WITH CHECK ((a_id = auth.uid() OR b_id = auth.uid()) AND public.is_connected(a_id, b_id));
