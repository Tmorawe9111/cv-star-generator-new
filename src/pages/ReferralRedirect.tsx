import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackReferralClick } from '@/hooks/useReferralTracking';

// Mapping von kurzen Codes zu vollständigen Referral-Daten
const REFERRAL_MAPPING: Record<string, {
  referral_code: string;
  referral_name: string;
  utm_source: string;
  utm_campaign?: string;
  utm_medium?: string;
  redirectTo: 'gesundheitswesen' | 'cv-generator';
}> = {
  // Nakam - führt zur Gesundheitswesen-Landing Page
  'nakam': {
    referral_code: 'NAKAM2024',
    referral_name: 'Nakam',
    utm_source: 'influencer',
    utm_campaign: 'january2024',
    utm_medium: 'referral',
    redirectTo: 'gesundheitswesen',
  },
  'nakam2024': {
    referral_code: 'NAKAM2024',
    referral_name: 'Nakam',
    utm_source: 'influencer',
    utm_campaign: 'january2024',
    utm_medium: 'referral',
    redirectTo: 'gesundheitswesen',
  },
  // Weitere Influencer können hier hinzugefügt werden
  'partner1': {
    referral_code: 'PARTNER1',
    referral_name: 'Partner 1',
    utm_source: 'partner',
    utm_medium: 'referral',
    redirectTo: 'cv-generator',
  },
};

export default function ReferralRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    const referralData = REFERRAL_MAPPING[code.toLowerCase()];

    if (!referralData) {
      console.warn(`Unknown referral code: ${code}`);
      navigate('/');
      return;
    }

    // Track den Referral-Click im Hintergrund
    trackReferralClick({
      referral_code: referralData.referral_code,
      referral_name: referralData.referral_name,
      referral_source: referralData.utm_source,
      utm_source: referralData.utm_source,
      utm_medium: referralData.utm_medium || 'referral',
      utm_campaign: referralData.utm_campaign,
    });

    // Setze UTM-Parameter für die Weiterleitung
    const params = new URLSearchParams();
    params.set('ref', referralData.referral_code);
    params.set('ref_name', referralData.referral_name);
    params.set('utm_source', referralData.utm_source);
    if (referralData.utm_medium) params.set('utm_medium', referralData.utm_medium);
    if (referralData.utm_campaign) params.set('utm_campaign', referralData.utm_campaign);

    // Weiterleitung basierend auf redirectTo
    const targetPath = referralData.redirectTo === 'gesundheitswesen' 
      ? '/gesundheitswesen' 
      : '/cv-generator';
    
    navigate(`${targetPath}?${params.toString()}`, { replace: true });
  }, [code, navigate]);

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

