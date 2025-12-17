-- Migration: Add RLS policy for candidates to view their own applications
-- Purpose: Allow candidates to view their own applications in "Meine Karriere"

-- Drop existing policies if they exist (from old migrations)
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Candidates can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
DROP POLICY IF EXISTS "Candidates can update their own applications" ON public.applications;

-- Create new policy for candidates to view their own applications
CREATE POLICY "Candidates can view their own applications"
ON public.applications FOR SELECT
USING (candidate_id = auth.uid());

-- Also ensure candidates can update their own applications (e.g., withdraw)
CREATE POLICY "Candidates can update their own applications"
ON public.applications FOR UPDATE
USING (candidate_id = auth.uid())
WITH CHECK (candidate_id = auth.uid());

