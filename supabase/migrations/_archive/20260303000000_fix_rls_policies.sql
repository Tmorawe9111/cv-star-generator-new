-- =============================================================================
-- Migration: Fix RLS infinite recursion and ensure complete policy coverage
-- =============================================================================
-- Purpose:
--   1. Replace all RLS policies that reference the same table they protect
--      (or create circular dependencies) with SECURITY DEFINER functions
--   2. Replace direct SELECTs from user_roles/company_users/profiles in
--      policy expressions with SECURITY DEFINER helpers
--   3. Add missing SELECT/INSERT/UPDATE/DELETE policies where needed
--
-- Recursion sources fixed:
--   - company_users: get_user_company_role already SECURITY DEFINER (verified)
--   - advertisements: was reading profiles (profiles has RLS) -> use has_role
--   - admin_*, support_unlock_codes: direct user_roles SELECT -> use has_role
--   - Policies with company_users subqueries -> use get_user_company_ids_accepted()
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) SECURITY DEFINER helper functions (bypass RLS, break recursion)
-- -----------------------------------------------------------------------------

-- Returns company IDs where the current user has an accepted membership.
-- Used by policies on company_* tables to avoid SELECT from company_users in
-- policy expressions (which could cause recursion when evaluating company_users).
CREATE OR REPLACE FUNCTION public.get_user_company_ids_accepted()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.company_users
  WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL;
$$;

COMMENT ON FUNCTION public.get_user_company_ids_accepted() IS
  'Returns company IDs for current user with accepted membership. SECURITY DEFINER to avoid RLS recursion.';

-- Ensure has_role exists and is SECURITY DEFINER (for admin checks).
-- Many policies use EXISTS (SELECT 1 FROM user_roles...) which triggers user_roles RLS.
-- has_role bypasses RLS and is the canonical admin check.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

COMMENT ON FUNCTION public.has_role(uuid, public.app_role) IS
  'Checks if user has role. SECURITY DEFINER to avoid RLS recursion when used in policies.';

-- Convenience: is_admin for current user (used in many policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'True if current user has admin role. SECURITY DEFINER wrapper for policy use.';

-- -----------------------------------------------------------------------------
-- 2) ADVERTISEMENTS - Fix: was reading profiles (RLS on profiles)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'advertisements') THEN
    DROP POLICY IF EXISTS "Admins can manage advertisements" ON public.advertisements;
    CREATE POLICY "Admins can manage advertisements"
      ON public.advertisements FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) ADMIN_COMPANY_ACCESS_CODES - Fix: direct user_roles SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_company_access_codes') THEN
    DROP POLICY IF EXISTS "Admins can view all access codes" ON public.admin_company_access_codes;
    CREATE POLICY "Admins can view all access codes"
      ON public.admin_company_access_codes FOR SELECT
      USING (public.is_admin());
    DROP POLICY IF EXISTS "Admins can create access codes" ON public.admin_company_access_codes;
    CREATE POLICY "Admins can create access codes"
      ON public.admin_company_access_codes FOR INSERT
      WITH CHECK (public.is_admin() AND created_by = auth.uid());
    DROP POLICY IF EXISTS "Admins can update access codes" ON public.admin_company_access_codes;
    CREATE POLICY "Admins can update access codes"
      ON public.admin_company_access_codes FOR UPDATE
      USING (public.is_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4) ADMIN_COMPANY_ACCESS_GRANTS - Fix: direct user_roles SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_company_access_grants') THEN
    DROP POLICY IF EXISTS "Admins can view own grants" ON public.admin_company_access_grants;
    CREATE POLICY "Admins can view own grants"
      ON public.admin_company_access_grants FOR SELECT
      USING (admin_id = auth.uid() OR public.is_admin());
    DROP POLICY IF EXISTS "Admins can create grants" ON public.admin_company_access_grants;
    CREATE POLICY "Admins can create grants"
      ON public.admin_company_access_grants FOR INSERT
      WITH CHECK (public.is_admin() AND admin_id = auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5) SUPPORT_UNLOCK_CODES - Fix: direct user_roles SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_unlock_codes') THEN
    DROP POLICY IF EXISTS "Admins can view all unlock codes" ON public.support_unlock_codes;
    CREATE POLICY "Admins can view all unlock codes"
      ON public.support_unlock_codes FOR SELECT
      USING (public.is_admin());
    DROP POLICY IF EXISTS "Admins can create unlock codes" ON public.support_unlock_codes;
    CREATE POLICY "Admins can create unlock codes"
      ON public.support_unlock_codes FOR INSERT
      WITH CHECK (public.is_admin() AND created_by = auth.uid());
    DROP POLICY IF EXISTS "Admins can update unlock codes" ON public.support_unlock_codes;
    CREATE POLICY "Admins can update unlock codes"
      ON public.support_unlock_codes FOR UPDATE
      USING (public.is_admin());
    DROP POLICY IF EXISTS "Company users can view assigned codes" ON public.support_unlock_codes;
    CREATE POLICY "Company users can view assigned codes"
      ON public.support_unlock_codes FOR SELECT
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6) COMPANY_CALENDAR_INTEGRATIONS - Fix: direct company_users SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_calendar_integrations') THEN
    DROP POLICY IF EXISTS "Company users can view their calendar integrations" ON public.company_calendar_integrations;
    CREATE POLICY "Company users can view their calendar integrations"
      ON public.company_calendar_integrations FOR SELECT
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company admins can manage calendar integrations" ON public.company_calendar_integrations;
    CREATE POLICY "Company admins can manage calendar integrations"
      ON public.company_calendar_integrations FOR ALL
      USING (public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin'))
      WITH CHECK (public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin'));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7) CANDIDATE_COMPANY_MATCHES - Fix: direct company_users SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'candidate_company_matches') THEN
    DROP POLICY IF EXISTS "Company users can view own matches" ON public.candidate_company_matches;
    CREATE POLICY "Company users can view own matches"
      ON public.candidate_company_matches FOR SELECT
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 8) COMPANY_INTEREST_REQUESTS - Fix: direct company_users SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_interest_requests') THEN
    DROP POLICY IF EXISTS "Company users can view own interest requests" ON public.company_interest_requests;
    CREATE POLICY "Company users can view own interest requests"
      ON public.company_interest_requests FOR SELECT
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company users can create interest requests" ON public.company_interest_requests;
    CREATE POLICY "Company users can create interest requests"
      ON public.company_interest_requests FOR INSERT
      WITH CHECK (company_id IN (SELECT public.get_user_company_ids_accepted()) AND created_by = auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 9) COMPANY_INTERVIEW_QUESTIONS - Fix: direct company_users SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_interview_questions') THEN
    DROP POLICY IF EXISTS "Company users can view own interview questions" ON public.company_interview_questions;
    CREATE POLICY "Company users can view own interview questions"
      ON public.company_interview_questions FOR SELECT
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company users can insert own interview questions" ON public.company_interview_questions;
    CREATE POLICY "Company users can insert own interview questions"
      ON public.company_interview_questions FOR INSERT
      WITH CHECK (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company users can update own interview questions" ON public.company_interview_questions;
    CREATE POLICY "Company users can update own interview questions"
      ON public.company_interview_questions FOR UPDATE
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company users can delete own interview questions" ON public.company_interview_questions;
    CREATE POLICY "Company users can delete own interview questions"
      ON public.company_interview_questions FOR DELETE
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 10) COMPANY_VALUES - Fix: direct company_users SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_values') THEN
    DROP POLICY IF EXISTS "Company users can view own values" ON public.company_values;
    CREATE POLICY "Company users can view own values"
      ON public.company_values FOR SELECT
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company users can insert own values" ON public.company_values;
    CREATE POLICY "Company users can insert own values"
      ON public.company_values FOR INSERT
      WITH CHECK (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company users can update own values" ON public.company_values;
    CREATE POLICY "Company users can update own values"
      ON public.company_values FOR UPDATE
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 11) COMPANY_ROLE_EXPECTATIONS - Fix: direct company_users SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_role_expectations') THEN
    DROP POLICY IF EXISTS "Company users can view own role expectations" ON public.company_role_expectations;
    CREATE POLICY "Company users can view own role expectations"
      ON public.company_role_expectations FOR SELECT
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company users can insert own role expectations" ON public.company_role_expectations;
    CREATE POLICY "Company users can insert own role expectations"
      ON public.company_role_expectations FOR INSERT
      WITH CHECK (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company users can update own role expectations" ON public.company_role_expectations;
    CREATE POLICY "Company users can update own role expectations"
      ON public.company_role_expectations FOR UPDATE
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Company users can delete own role expectations" ON public.company_role_expectations;
    CREATE POLICY "Company users can delete own role expectations"
      ON public.company_role_expectations FOR DELETE
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 12) USER_VALUES / USER_INTERVIEW_ANSWERS - Fix: company_users in subquery
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_values') THEN
    DROP POLICY IF EXISTS "Companies can view unlocked values" ON public.user_values;
    CREATE POLICY "Companies can view unlocked values"
      ON public.user_values FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.company_candidates cc
          WHERE cc.candidate_id = user_values.user_id
            AND cc.unlocked_at IS NOT NULL
            AND cc.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_interview_answers') THEN
    DROP POLICY IF EXISTS "Companies can view unlocked interview answers" ON public.user_interview_answers;
    CREATE POLICY "Companies can view unlocked interview answers"
      ON public.user_interview_answers FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.company_candidates cc
          WHERE cc.candidate_id = user_interview_answers.user_id
            AND cc.unlocked_at IS NOT NULL
            AND cc.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 13) POSTS - Fix: companies_delete_own_posts uses direct company_users SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    DROP POLICY IF EXISTS "companies_delete_own_posts" ON public.posts;
    CREATE POLICY "companies_delete_own_posts"
      ON public.posts FOR DELETE
      USING (
        author_type = 'company'
        AND company_id IS NOT NULL
        AND public.get_user_company_role(auth.uid(), company_id) IN ('owner','admin','marketing')
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 14) PROFILES - Ensure INSERT policy exists
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 15) APPLICATIONS - Add missing policies (company view)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Company users can view applications for their jobs') THEN
    CREATE POLICY "Company users can view applications for their jobs"
      ON public.applications FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.job_posts jp
          WHERE jp.id = applications.job_id
            AND jp.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 15b) INTERVIEW_REQUESTS - Fix: direct company_users SELECT
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_requests') THEN
    DROP POLICY IF EXISTS "Companies can view their interview requests" ON public.interview_requests;
    CREATE POLICY "Companies can view their interview requests"
      ON public.interview_requests FOR SELECT
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Companies can create interview requests" ON public.interview_requests;
    CREATE POLICY "Companies can create interview requests"
      ON public.interview_requests FOR INSERT
      WITH CHECK (company_id IN (SELECT public.get_user_company_ids_accepted()));
    DROP POLICY IF EXISTS "Companies can update their interview requests" ON public.interview_requests;
    CREATE POLICY "Companies can update their interview requests"
      ON public.interview_requests FOR UPDATE
      USING (company_id IN (SELECT public.get_user_company_ids_accepted()));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 15c) INTERVIEW_TIME_SLOT_PROPOSALS - Fix: company_users in JOIN
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_time_slot_proposals') THEN
    DROP POLICY IF EXISTS "Companies can view proposals for their requests" ON public.interview_time_slot_proposals;
    CREATE POLICY "Companies can view proposals for their requests"
      ON public.interview_time_slot_proposals FOR SELECT
      USING (
        interview_request_id IN (
          SELECT ir.id FROM public.interview_requests ir
          WHERE ir.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
    DROP POLICY IF EXISTS "Companies can update proposals" ON public.interview_time_slot_proposals;
    CREATE POLICY "Companies can update proposals"
      ON public.interview_time_slot_proposals FOR UPDATE
      USING (
        interview_request_id IN (
          SELECT ir.id FROM public.interview_requests ir
          WHERE ir.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 15d) COMPANY_INTERVIEW_QUESTION_EXPECTED_ANSWERS - Fix: company_users in JOIN
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_interview_question_expected_answers') THEN
    DROP POLICY IF EXISTS "Company users can view own expected answers" ON public.company_interview_question_expected_answers;
    CREATE POLICY "Company users can view own expected answers"
      ON public.company_interview_question_expected_answers FOR SELECT
      USING (
        question_id IN (
          SELECT ciq.id FROM public.company_interview_questions ciq
          WHERE ciq.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
    DROP POLICY IF EXISTS "Company users can insert own expected answers" ON public.company_interview_question_expected_answers;
    CREATE POLICY "Company users can insert own expected answers"
      ON public.company_interview_question_expected_answers FOR INSERT
      WITH CHECK (
        question_id IN (
          SELECT ciq.id FROM public.company_interview_questions ciq
          WHERE ciq.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
    DROP POLICY IF EXISTS "Company users can update own expected answers" ON public.company_interview_question_expected_answers;
    CREATE POLICY "Company users can update own expected answers"
      ON public.company_interview_question_expected_answers FOR UPDATE
      USING (
        question_id IN (
          SELECT ciq.id FROM public.company_interview_questions ciq
          WHERE ciq.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
    DROP POLICY IF EXISTS "Company users can delete own expected answers" ON public.company_interview_question_expected_answers;
    CREATE POLICY "Company users can delete own expected answers"
      ON public.company_interview_question_expected_answers FOR DELETE
      USING (
        question_id IN (
          SELECT ciq.id FROM public.company_interview_questions ciq
          WHERE ciq.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 15e) JOB_APPLICATION_INTERVIEW_ANSWER_MATCHES - Fix: company_users in JOIN
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_application_interview_answer_matches') THEN
    DROP POLICY IF EXISTS "Company users can view answer matches" ON public.job_application_interview_answer_matches;
    CREATE POLICY "Company users can view answer matches"
      ON public.job_application_interview_answer_matches FOR SELECT
      USING (
        application_answer_id IN (
          SELECT jaia.id FROM public.job_application_interview_answers jaia
          INNER JOIN public.applications a ON jaia.application_id = a.id
          INNER JOIN public.job_posts jp ON a.job_id = jp.id
          WHERE jp.company_id IN (SELECT public.get_user_company_ids_accepted())
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 16) REFERRAL_TRACKING - Add admin read (keep service_role via auth.role())
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_tracking') THEN
    DROP POLICY IF EXISTS "Allow admins to read all referral tracking" ON public.referral_tracking;
    CREATE POLICY "Allow admins to read all referral tracking"
      ON public.referral_tracking FOR SELECT
      USING (
        auth.role() = 'service_role'
        OR public.is_admin()
        OR auth.uid() = user_id
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 17) CREATORS - Add authenticated admin access (keep service_role)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'creators') THEN
    DROP POLICY IF EXISTS "Allow admins full access to creators" ON public.creators;
    CREATE POLICY "Allow admins full access to creators"
      ON public.creators FOR ALL
      USING (
        auth.role() = 'service_role'
        OR (auth.role() = 'authenticated' AND public.is_admin())
      )
      WITH CHECK (
        auth.role() = 'service_role'
        OR (auth.role() = 'authenticated' AND public.is_admin())
      );
  END IF;
END $$;

-- =============================================================================
-- BEFORE / AFTER SUMMARY - Every policy changed
-- =============================================================================
--
-- 1. ADVERTISEMENTS "Admins can manage advertisements"
--    BEFORE: EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
--    AFTER:  public.is_admin()  [avoids profiles RLS recursion]
--
-- 2. ADMIN_COMPANY_ACCESS_CODES (3 policies)
--    BEFORE: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
--    AFTER:  public.is_admin()  [avoids user_roles RLS recursion]
--
-- 3. ADMIN_COMPANY_ACCESS_GRANTS (2 policies)
--    BEFORE: Same user_roles direct SELECT
--    AFTER:  public.is_admin()
--
-- 4. SUPPORT_UNLOCK_CODES (4 policies)
--    BEFORE: Direct user_roles SELECT; company_users subquery for "Company users can view"
--    AFTER:  public.is_admin(); company_id IN (SELECT get_user_company_ids_accepted())
--
-- 5. COMPANY_CALENDAR_INTEGRATIONS (2 policies)
--    BEFORE: company_id IN (SELECT cu.company_id FROM company_users cu WHERE ...)
--    AFTER:  get_user_company_ids_accepted() for SELECT; get_user_company_role for ALL
--
-- 6. CANDIDATE_COMPANY_MATCHES "Company users can view own matches"
--    BEFORE: company_id IN (SELECT ... FROM company_users ...)
--    AFTER:  company_id IN (SELECT get_user_company_ids_accepted())
--
-- 7. COMPANY_INTEREST_REQUESTS (2 policies)
--    BEFORE: Direct company_users subquery
--    AFTER:  get_user_company_ids_accepted()
--
-- 8. COMPANY_INTERVIEW_QUESTIONS (4 policies)
--    BEFORE: company_id IN (SELECT ... FROM company_users ...)
--    AFTER:  company_id IN (SELECT get_user_company_ids_accepted())
--
-- 9. COMPANY_VALUES (3 policies)
--    BEFORE: Direct company_users subquery
--    AFTER:  get_user_company_ids_accepted()
--
-- 10. COMPANY_ROLE_EXPECTATIONS (4 policies)
--     BEFORE: Direct company_users subquery
--     AFTER:  get_user_company_ids_accepted()
--
-- 11. USER_VALUES "Companies can view unlocked values"
--     BEFORE: company_id IN (SELECT ... FROM company_users ...)
--     AFTER:  company_id IN (SELECT get_user_company_ids_accepted())
--
-- 12. USER_INTERVIEW_ANSWERS "Companies can view unlocked interview answers"
--     BEFORE: Same pattern
--     AFTER:  get_user_company_ids_accepted()
--
-- 13. POSTS "companies_delete_own_posts"
--     BEFORE: EXISTS (SELECT 1 FROM company_users cu WHERE ...)
--     AFTER:  get_user_company_role(auth.uid(), company_id) IN (...)
--
-- 14. PROFILES - Added "Users can insert own profile" if missing
--
-- 15. APPLICATIONS - Added "Company users can view applications for their jobs" if missing
--
-- 16. INTERVIEW_REQUESTS (3 policies)
--     BEFORE: company_id IN (SELECT cu.company_id FROM company_users cu ...)
--     AFTER:  company_id IN (SELECT get_user_company_ids_accepted())
--
-- 17. INTERVIEW_TIME_SLOT_PROPOSALS (2 policies)
--     BEFORE: JOIN company_users cu ON cu.company_id = ir.company_id WHERE cu.user_id = auth.uid()
--     AFTER:  ir.company_id IN (SELECT get_user_company_ids_accepted())
--
-- 18. COMPANY_INTERVIEW_QUESTION_EXPECTED_ANSWERS (4 policies)
--     BEFORE: INNER JOIN company_users cu ...
--     AFTER:  ciq.company_id IN (SELECT get_user_company_ids_accepted())
--
-- 19. JOB_APPLICATION_INTERVIEW_ANSWER_MATCHES
--     BEFORE: INNER JOIN company_users cu ...
--     AFTER:  jp.company_id IN (SELECT get_user_company_ids_accepted())
--
-- 20. REFERRAL_TRACKING "Allow admins to read all"
--     BEFORE: TO service_role USING (true)
--     AFTER:  service_role OR is_admin() OR own data
--
-- 21. CREATORS "Allow admins full access"
--     BEFORE: TO service_role USING (true)
--     AFTER:  service_role OR (authenticated AND is_admin())
--
-- NEW HELPER FUNCTIONS:
--   - get_user_company_ids_accepted()  SECURITY DEFINER - returns company IDs for current user
--   - has_role(uuid, app_role)         SECURITY DEFINER - role check (already existed, ensured)
--   - is_admin()                       SECURITY DEFINER - convenience for auth.uid() admin check
