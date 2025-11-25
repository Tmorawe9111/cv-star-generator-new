-- Dashboard Metrics Functions
-- Step-by-step SQL functions for all dashboard metrics that update automatically

-- Step 1: Function to get active job count for a company
CREATE OR REPLACE FUNCTION public.get_company_active_jobs(p_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM job_posts
  WHERE company_id = p_company_id
    AND status = 'published'
    AND is_active = true;
$$;

-- Step 2: Function to get total applications count
CREATE OR REPLACE FUNCTION public.get_company_total_applications(p_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM applications
  WHERE company_id = p_company_id;
$$;

-- Step 3: Function to get planned interviews count
CREATE OR REPLACE FUNCTION public.get_company_planned_interviews(p_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM company_candidates
  WHERE company_id = p_company_id
    AND status = 'INTERVIEW_GEPLANT';
$$;

-- Step 4: Function to get total hires count
CREATE OR REPLACE FUNCTION public.get_company_total_hires(p_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM company_candidates
  WHERE company_id = p_company_id
    AND status = 'EINGESTELLT';
$$;

-- Step 5: Function to get unlocked profiles count
-- Counts profiles that are unlocked (either by status OR by unlocked_at timestamp)
-- This ensures newly unlocked profiles are counted even if status hasn't been set yet
CREATE OR REPLACE FUNCTION public.get_company_unlocked_profiles(p_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM company_candidates
  WHERE company_id = p_company_id
    AND (
      status IN ('FREIGESCHALTET', 'INTERVIEW_GEPLANT', 'INTERVIEW_DURCHGEFÜHRT', 'ANGEBOT_GESENDET', 'EINGESTELLT')
      OR unlocked_at IS NOT NULL
    );
$$;

-- Step 6: Function to get seats used count
CREATE OR REPLACE FUNCTION public.get_company_seats_used(p_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM company_users
  WHERE company_id = p_company_id
    AND accepted_at IS NOT NULL;
$$;

-- Step 7: Combined function to get all dashboard metrics at once (for better performance)
CREATE OR REPLACE FUNCTION public.get_company_dashboard_metrics(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_jobs', get_company_active_jobs(p_company_id),
    'applications_total', get_company_total_applications(p_company_id),
    'interviews_planned', get_company_planned_interviews(p_company_id),
    'hires_total', get_company_total_hires(p_company_id),
    'unlocked_profiles', get_company_unlocked_profiles(p_company_id),
    'seats_used', get_company_seats_used(p_company_id)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Step 8: Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_company_active_jobs(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_total_applications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_planned_interviews(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_total_hires(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_unlocked_profiles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_seats_used(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_dashboard_metrics(uuid) TO authenticated;

