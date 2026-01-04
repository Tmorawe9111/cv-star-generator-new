import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { trackReferralClick, updateReferralWithUser } from '@/hooks/useReferralTracking';

/**
 * Component to automatically track referral links
 * Add this to your App.tsx or main layout
 */
export function ReferralTracker() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();

  // Track referral on page load if UTM params are present
  useEffect(() => {
    const hasUTM = searchParams.has('utm_source') || 
                   searchParams.has('ref') || 
                   searchParams.has('referral_code');
    
    if (hasUTM) {
      const referralData = {
        referral_source: searchParams.get('utm_source') || searchParams.get('ref_source') || undefined,
        referral_name: searchParams.get('ref_name') || searchParams.get('referral_name') || undefined,
        referral_code: searchParams.get('ref') || searchParams.get('referral_code') || undefined,
        utm_source: searchParams.get('utm_source') || undefined,
        utm_medium: searchParams.get('utm_medium') || undefined,
        utm_campaign: searchParams.get('utm_campaign') || undefined,
        utm_term: searchParams.get('utm_term') || undefined,
        utm_content: searchParams.get('utm_content') || undefined,
      };
      
      if (referralData.referral_source || referralData.referral_code || referralData.utm_source) {
        trackReferralClick(referralData);
      }
    }
  }, [searchParams, location.pathname]);

  // Update referral tracking when user registers
  useEffect(() => {
    if (user?.id) {
      updateReferralWithUser(user.id);
    }
  }, [user?.id]);

  return null; // This component doesn't render anything
}

