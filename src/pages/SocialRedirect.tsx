import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { trackReferralClick } from '@/hooks/useReferralTracking';

// Mapping von Creator-Codes zu vollständigen Referral-Daten
const CREATOR_MAPPING: Record<string, {
  referral_code: string;
  referral_name: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign?: string;
  redirectTo?: 'gesundheitswesen' | 'cv-generator';
}> = {
  // Instagram Creators
  'nakam': {
    referral_code: 'NAKAM_IG',
    referral_name: 'Nakam',
    utm_source: 'instagram',
    utm_medium: 'social',
    utm_campaign: 'creator_nakam',
    redirectTo: 'gesundheitswesen',
  },
  'creator1': {
    referral_code: 'CREATOR1_IG',
    referral_name: 'Creator 1',
    utm_source: 'instagram',
    utm_medium: 'social',
    utm_campaign: 'creator_1',
    redirectTo: 'cv-generator',
  },
  // Facebook Creators
  'nakam_fb': {
    referral_code: 'NAKAM_FB',
    referral_name: 'Nakam',
    utm_source: 'facebook',
    utm_medium: 'social',
    utm_campaign: 'creator_nakam',
    redirectTo: 'gesundheitswesen',
  },
  'creator1_fb': {
    referral_code: 'CREATOR1_FB',
    referral_name: 'Creator 1',
    utm_source: 'facebook',
    utm_medium: 'social',
    utm_campaign: 'creator_1',
    redirectTo: 'cv-generator',
  },
};

export default function SocialRedirect() {
  const { platform, creator } = useParams<{ platform: string; creator: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!platform || !creator) {
      navigate('/');
      return;
    }

    // Normalize platform (ig, instagram -> instagram, fb, facebook -> facebook)
    const normalizedPlatform = platform.toLowerCase() === 'ig' || platform.toLowerCase() === 'instagram' 
      ? 'instagram' 
      : platform.toLowerCase() === 'fb' || platform.toLowerCase() === 'facebook'
      ? 'facebook'
      : platform.toLowerCase();

    // Create creator key (e.g., 'nakam' for Instagram, 'nakam_fb' for Facebook)
    const creatorKey = normalizedPlatform === 'facebook' 
      ? `${creator.toLowerCase()}_fb`
      : creator.toLowerCase();

    const referralData = CREATOR_MAPPING[creatorKey];

    if (!referralData) {
      // Fallback: Create default referral data
      const defaultData = {
        referral_code: `${creator.toUpperCase()}_${normalizedPlatform.toUpperCase()}`,
        referral_name: creator,
        utm_source: normalizedPlatform,
        utm_medium: 'social',
        utm_campaign: `creator_${creator.toLowerCase()}`,
        redirectTo: 'cv-generator' as const,
      };

      // Track with default data
      trackReferralClick({
        referral_code: defaultData.referral_code,
        referral_name: defaultData.referral_name,
        referral_source: defaultData.utm_source,
        utm_source: defaultData.utm_source,
        utm_medium: defaultData.utm_medium,
        utm_campaign: defaultData.utm_campaign,
      });

      // Set UTM parameters
      const params = new URLSearchParams();
      params.set('ref', defaultData.referral_code);
      params.set('ref_name', defaultData.referral_name);
      params.set('utm_source', defaultData.utm_source);
      params.set('utm_medium', defaultData.utm_medium);
      params.set('utm_campaign', defaultData.utm_campaign);

      navigate(`/${defaultData.redirectTo}?${params.toString()}`, { replace: true });
      return;
    }

    // Track den Referral-Click im Hintergrund
    trackReferralClick({
      referral_code: referralData.referral_code,
      referral_name: referralData.referral_name,
      referral_source: referralData.utm_source,
      utm_source: referralData.utm_source,
      utm_medium: referralData.utm_medium,
      utm_campaign: referralData.utm_campaign,
    });

    // Setze UTM-Parameter für die Weiterleitung
    const params = new URLSearchParams();
    params.set('ref', referralData.referral_code);
    params.set('ref_name', referralData.referral_name);
    params.set('utm_source', referralData.utm_source);
    params.set('utm_medium', referralData.utm_medium);
    if (referralData.utm_campaign) params.set('utm_campaign', referralData.utm_campaign);

    // Weiterleitung basierend auf redirectTo
    const targetPath = referralData.redirectTo === 'gesundheitswesen' 
      ? '/gesundheitswesen' 
      : '/cv-generator';
    
    navigate(`${targetPath}?${params.toString()}`, { replace: true });
  }, [platform, creator, navigate]);

  // Loading state während der Weiterleitung
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Weiterleitung...</p>
      </div>
    </div>
  );
}

