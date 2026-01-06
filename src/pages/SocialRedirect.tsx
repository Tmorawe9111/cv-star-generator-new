import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { trackReferralClick } from '@/hooks/useReferralTracking';
import { supabase } from '@/integrations/supabase/client';

export default function SocialRedirect() {
  const { platform } = useParams<{ platform: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!platform) {
      navigate('/');
      return;
    }

    // Normalize platform (ig, instagram -> instagram, fb, facebook -> facebook)
    const normalizedPlatform = platform.toLowerCase() === 'ig' || platform.toLowerCase() === 'instagram' 
      ? 'instagram' 
      : platform.toLowerCase() === 'fb' || platform.toLowerCase() === 'facebook'
      ? 'facebook'
      : platform.toLowerCase();

    // Get creator code from query parameter (c=creator_code)
    const creatorCode = searchParams.get('c') || searchParams.get('creator') || searchParams.get('ref');
    
    if (!creatorCode) {
      // No creator code - redirect to default landing page
      navigate('/cv-generator', { replace: true });
      return;
    }

    // Try to load creator from localStorage (from admin panel) or use default
    const loadCreatorData = async () => {
      try {
        // Try to load from localStorage first (from admin panel)
        const savedCreators = localStorage.getItem('creators');
        let creatorData = null;
        
        if (savedCreators) {
          const creators = JSON.parse(savedCreators);
          creatorData = creators.find((c: any) => 
            c.code.toLowerCase() === creatorCode.toLowerCase()
          );
        }

        // If found in localStorage, use it
        if (creatorData) {
          const referralCode = `${creatorData.code.toUpperCase()}_${normalizedPlatform.toUpperCase()}`;
          
          trackReferralClick({
            referral_code: referralCode,
            referral_name: creatorData.name,
            referral_source: normalizedPlatform,
            utm_source: normalizedPlatform,
            utm_medium: 'social',
            utm_campaign: creatorData.utm_campaign || `creator_${creatorData.code.toLowerCase()}`,
          });

          const params = new URLSearchParams();
          params.set('ref', referralCode);
          params.set('ref_name', creatorData.name);
          params.set('utm_source', normalizedPlatform);
          params.set('utm_medium', 'social');
          if (creatorData.utm_campaign) params.set('utm_campaign', creatorData.utm_campaign);

          const targetPath = creatorData.redirectTo === 'gesundheitswesen' 
            ? '/gesundheitswesen' 
            : '/cv-generator';
          
          navigate(`${targetPath}?${params.toString()}`, { replace: true });
          return;
        }

        // Fallback: Create default referral data from creator code
        const defaultData = {
          referral_code: `${creatorCode.toUpperCase()}_${normalizedPlatform.toUpperCase()}`,
          referral_name: creatorCode,
          utm_source: normalizedPlatform,
          utm_medium: 'social',
          utm_campaign: `creator_${creatorCode.toLowerCase()}`,
          redirectTo: 'cv-generator' as const,
        };

        trackReferralClick({
          referral_code: defaultData.referral_code,
          referral_name: defaultData.referral_name,
          referral_source: defaultData.utm_source,
          utm_source: defaultData.utm_source,
          utm_medium: defaultData.utm_medium,
          utm_campaign: defaultData.utm_campaign,
        });

        const params = new URLSearchParams();
        params.set('ref', defaultData.referral_code);
        params.set('ref_name', defaultData.referral_name);
        params.set('utm_source', defaultData.utm_source);
        params.set('utm_medium', defaultData.utm_medium);
        params.set('utm_campaign', defaultData.utm_campaign);

        navigate(`/${defaultData.redirectTo}?${params.toString()}`, { replace: true });
      } catch (error) {
        console.error('Error loading creator data:', error);
        navigate('/cv-generator', { replace: true });
      }
    };

    loadCreatorData();
  }, [platform, searchParams, navigate]);

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

