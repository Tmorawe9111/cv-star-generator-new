import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseJobApplicationInterviewResult {
  showModal: boolean;
  applicationId: string | null;
  jobId: string | null;
  companyId: string | null;
  openModal: (applicationId: string, jobId: string, companyId: string) => void;
  closeModal: () => void;
}

/**
 * Hook to manage job application interview questions modal
 * Checks if there are unanswered questions after profile unlock
 */
export function useJobApplicationInterview(): UseJobApplicationInterviewResult {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Check for pending interview questions on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      checkForPendingQuestions();
    }
  }, [user?.id]);

  const checkForPendingQuestions = async () => {
    if (!user?.id || showModal) return; // Don't check if modal is already open

    try {
      // Find applications where:
      // 1. User is the candidate
      // 2. Profile was unlocked (status = 'unlocked' or unlocked_at IS NOT NULL)
      // 3. Job has interview questions
      // 4. User hasn't answered all questions yet

      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          company_id,
          status,
          unlocked_at
        `)
        .eq('candidate_id', user.id)
        .or('status.eq.unlocked,unlocked_at.not.is.null')
        .not('job_id', 'is', null)
        .limit(5);

      if (error) {
        console.error('Error checking for pending questions:', error);
        return;
      }

      if (!applications || applications.length === 0) return;

      // Check each application for unanswered questions
      for (const app of applications) {
        if (!app.job_id || !app.company_id) continue;

        // Check if job has questions
        const { data: jobQuestions } = await supabase
          .from('company_interview_questions')
          .select('id')
          .eq('role_id', app.job_id);

        if (!jobQuestions || jobQuestions.length === 0) {
          continue;
        }

        // Check if user has answered all questions
        const { data: answeredQuestions } = await supabase
          .from('job_application_interview_answers')
          .select('question_id')
          .eq('application_id', app.id);

        const answeredIds = new Set((answeredQuestions || []).map(a => a.question_id));
        const totalQuestions = jobQuestions.length;
        const answeredCount = answeredIds.size;

        // If not all questions answered, show modal for first one
        if (answeredCount < totalQuestions) {
          openModal(app.id, app.job_id, app.company_id);
          return;
        }
      }
    } catch (error) {
      console.error('Error in checkForPendingQuestions:', error);
    }
  };

  const openModal = (appId: string, jId: string, cId: string) => {
    setApplicationId(appId);
    setJobId(jId);
    setCompanyId(cId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    // Re-check after closing to see if there are more pending
    setTimeout(() => {
      checkForPendingQuestions();
    }, 1000);
  };

  return {
    showModal,
    applicationId,
    jobId,
    companyId,
    openModal,
    closeModal
  };
}

