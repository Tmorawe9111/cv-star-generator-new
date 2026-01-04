import { useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Simple UUID generator (no external dependency needed)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface ReferralData {
  referral_source?: string;
  referral_name?: string;
  referral_code?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

// Get or create session ID
function getSessionId(): string {
  const storageKey = 'referral_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

// Parse UTM parameters from URL
function parseUTMParams(searchParams: URLSearchParams): ReferralData {
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');
  const utmTerm = searchParams.get('utm_term');
  const utmContent = searchParams.get('utm_content');
  
  // Check for custom referral parameters
  const referralCode = searchParams.get('ref') || searchParams.get('referral_code');
  const referralName = searchParams.get('ref_name') || searchParams.get('referral_name');
  const referralSource = searchParams.get('ref_source') || utmSource || 'organic';
  
  return {
    referral_source: referralSource || undefined,
    referral_name: referralName || undefined,
    referral_code: referralCode || undefined,
    utm_source: utmSource || undefined,
    utm_medium: utmMedium || undefined,
    utm_campaign: utmCampaign || undefined,
    utm_term: utmTerm || undefined,
    utm_content: utmContent || undefined,
  };
}

// Track referral click
export async function trackReferralClick(data: ReferralData): Promise<string | null> {
  try {
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;
    const referrerUrl = document.referrer || undefined;
    const landingPage = window.location.pathname + window.location.search;
    
    // Get IP (via Supabase function or client-side)
    const { data: trackingData, error } = await supabase
      .from('referral_tracking')
      .insert({
        session_id: sessionId,
        user_agent: userAgent,
        referrer_url: referrerUrl,
        landing_page: landingPage,
        clicked_at: new Date().toISOString(),
        ...data,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error tracking referral:', error);
      return null;
    }
    
    // Store tracking ID in session for later updates
    sessionStorage.setItem('referral_tracking_id', trackingData.id);
    
    return trackingData.id;
  } catch (error) {
    console.error('Error tracking referral:', error);
    return null;
  }
}

// Update referral tracking with user ID after registration
export async function updateReferralWithUser(userId: string): Promise<void> {
  try {
    const sessionId = getSessionId();
    const trackingId = sessionStorage.getItem('referral_tracking_id');
    
    if (!trackingId && !sessionId) return;
    
    const updateData: any = {
      user_id: userId,
      registered_at: new Date().toISOString(),
    };
    
    // Try to update by tracking ID first, then by session ID
    if (trackingId) {
      const { error } = await supabase
        .from('referral_tracking')
        .update(updateData)
        .eq('id', trackingId)
        .is('user_id', null);
      
      if (!error) return;
    }
    
    // Fallback: update by session ID
    if (sessionId) {
      await supabase
        .from('referral_tracking')
        .update(updateData)
        .eq('session_id', sessionId)
        .is('user_id', null)
        .limit(1);
    }
  } catch (error) {
    console.error('Error updating referral with user:', error);
  }
}

// Update referral tracking with CV creation
export async function updateReferralWithCV(): Promise<void> {
  try {
    const sessionId = getSessionId();
    const trackingId = sessionStorage.getItem('referral_tracking_id');
    
    if (!trackingId && !sessionId) return;
    
    const updateData = {
      cv_created_at: new Date().toISOString(),
    };
    
    if (trackingId) {
      await supabase
        .from('referral_tracking')
        .update(updateData)
        .eq('id', trackingId)
        .is('cv_created_at', null);
    } else if (sessionId) {
      await supabase
        .from('referral_tracking')
        .update(updateData)
        .eq('session_id', sessionId)
        .is('cv_created_at', null)
        .limit(1);
    }
  } catch (error) {
    console.error('Error updating referral with CV:', error);
  }
}

// Hook to automatically track referral on page load
export function useReferralTracking() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  useEffect(() => {
    // Only track on initial page load or when UTM params are present
    const hasUTM = searchParams.has('utm_source') || 
                   searchParams.has('ref') || 
                   searchParams.has('referral_code');
    
    if (hasUTM) {
      const referralData = parseUTMParams(searchParams);
      
      // Only track if we have meaningful referral data
      if (referralData.referral_source || referralData.referral_code || referralData.utm_source) {
        trackReferralClick(referralData);
      }
    }
  }, [searchParams, location.pathname]);
  
  return {
    trackReferralClick: useCallback((data: ReferralData) => trackReferralClick(data), []),
    updateReferralWithUser: useCallback((userId: string) => updateReferralWithUser(userId), []),
    updateReferralWithCV: useCallback(() => updateReferralWithCV(), []),
  };
}

