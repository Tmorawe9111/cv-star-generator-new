-- Candidate-controlled withdrawals (with optional profile visibility toggle)
-- This provides a stable API for the frontend even if RLS changes.

CREATE OR REPLACE FUNCTION public.candidate_withdraw_application(
  p_application_id uuid,
  p_reason text DEFAULT NULL,
  p_set_invisible boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_candidate_id uuid;
  v_status text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT a.candidate_id, a.status::text
    INTO v_candidate_id, v_status
  FROM public.applications a
  WHERE a.id = p_application_id;

  IF v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_candidate_id <> v_uid THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Do not allow withdrawing final states
  IF v_status IN ('hired', 'rejected', 'archived') THEN
    RETURN;
  END IF;

  -- Status change (uses application_status enum if present)
  UPDATE public.applications
  SET status = 'archived',
      is_new = false,
      updated_at = now()
  WHERE id = p_application_id;

  -- Persist reason in whichever schema is present
  IF p_reason IS NOT NULL AND length(trim(p_reason)) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'rejection_reason'
    ) THEN
      EXECUTE 'UPDATE public.applications SET rejection_reason = $1 WHERE id = $2'
      USING p_reason, p_application_id;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'reason_custom'
    ) THEN
      EXECUTE 'UPDATE public.applications SET reason_custom = $1 WHERE id = $2'
      USING p_reason, p_application_id;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'reason_short'
    ) THEN
      EXECUTE 'UPDATE public.applications SET reason_short = COALESCE(reason_short, ''candidate_withdrew'') WHERE id = $1'
      USING p_application_id;
    END IF;
  END IF;

  IF p_set_invisible THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'visibility_mode'
    ) THEN
      UPDATE public.profiles
      SET visibility_mode = 'invisible',
          updated_at = now()
      WHERE id = v_uid;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.candidate_withdraw_all_applications(
  p_reason text DEFAULT NULL,
  p_set_invisible boolean DEFAULT true
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_updated int := 0;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.applications
  SET status = 'archived',
      is_new = false,
      updated_at = now()
  WHERE candidate_id = v_uid
    AND status::text IN ('new', 'unlocked', 'interview', 'offer');

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF p_reason IS NOT NULL AND length(trim(p_reason)) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'rejection_reason'
    ) THEN
      EXECUTE $q$
        UPDATE public.applications
        SET rejection_reason = $1
        WHERE candidate_id = $2 AND status::text = 'archived'
      $q$
      USING p_reason, v_uid;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'reason_custom'
    ) THEN
      EXECUTE $q$
        UPDATE public.applications
        SET reason_custom = $1
        WHERE candidate_id = $2 AND status::text = 'archived'
      $q$
      USING p_reason, v_uid;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'reason_short'
    ) THEN
      EXECUTE $q$
        UPDATE public.applications
        SET reason_short = COALESCE(reason_short, 'candidate_withdrew')
        WHERE candidate_id = $1 AND status::text = 'archived'
      $q$
      USING v_uid;
    END IF;
  END IF;

  IF p_set_invisible THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'visibility_mode'
    ) THEN
      UPDATE public.profiles
      SET visibility_mode = 'invisible',
          updated_at = now()
      WHERE id = v_uid;
    END IF;
  END IF;

  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.candidate_withdraw_application(uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.candidate_withdraw_all_applications(text, boolean) TO authenticated;


