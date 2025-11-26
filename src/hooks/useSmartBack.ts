import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Smart back navigation that respects user type
 * - Companies always go back to their dashboard/area
 * - Users always go back to their feed/area
 * - Never uses history.back() to prevent cross-area navigation
 */
export function useSmartBack() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCompany = user?.user_metadata?.is_company === true || 
                    user?.user_metadata?.is_company === "true";

  const goBack = useCallback((options?: {
    companyFallback?: string;
    userFallback?: string;
  }) => {
    const { 
      companyFallback = '/unternehmen/startseite',
      userFallback = '/feed'
    } = options || {};

    if (isCompany) {
      // Companies always go to company area
      navigate(companyFallback, { replace: true });
    } else {
      // Users always go to user area
      navigate(userFallback, { replace: true });
    }
  }, [isCompany, navigate]);

  // Specific back destinations
  const goToTeam = useCallback(() => {
    if (isCompany) {
      navigate('/unternehmen/team', { replace: true });
    } else {
      navigate('/community/kontakte', { replace: true });
    }
  }, [isCompany, navigate]);

  const goToDashboard = useCallback(() => {
    if (isCompany) {
      navigate('/unternehmen/startseite', { replace: true });
    } else {
      navigate('/feed', { replace: true });
    }
  }, [isCompany, navigate]);

  const goToJobs = useCallback(() => {
    if (isCompany) {
      navigate('/unternehmen/jobs', { replace: true });
    } else {
      navigate('/stellenangebote', { replace: true });
    }
  }, [isCompany, navigate]);

  const goToProfile = useCallback(() => {
    if (isCompany) {
      navigate('/unternehmen/profil', { replace: true });
    } else {
      navigate('/profil', { replace: true });
    }
  }, [isCompany, navigate]);

  return {
    goBack,
    goToTeam,
    goToDashboard,
    goToJobs,
    goToProfile,
    isCompany
  };
}

/**
 * Get the correct "home" URL based on user type
 */
export function getHomeUrl(isCompany: boolean): string {
  return isCompany ? '/unternehmen/startseite' : '/feed';
}

/**
 * Get the correct profile URL based on user type
 */
export function getProfileUrl(isCompany: boolean): string {
  return isCompany ? '/unternehmen/profil' : '/profil';
}

