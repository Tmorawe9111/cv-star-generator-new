import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdLink } from '@/components/community/AdSpace';

/**
 * Hook to fetch and manage advertisement links with targeting/clustering
 * Filters ads based on user profile (branche, status, region)
 */
export const useAdLinks = (position?: 'left' | 'right') => {
  const [links, setLinks] = useState<AdLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile for targeting
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('branche, status, ort')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setUserProfile(data);
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    const loadAdLinks = async () => {
      try {
        // Try to fetch from Supabase table (if exists)
        const now = new Date().toISOString();
        let query = supabase
          .from('advertisements')
          .select('*')
          .or(`position.eq.${position || 'right'},position.eq.both`)
          .eq('active', true);

        const { data, error } = await query
          .order('priority', { ascending: true })
          .limit(20);
        
        // Filter by date range in JavaScript (more reliable)
        const dateFiltered = data?.filter((ad: any) => {
          if (ad.start_date && new Date(ad.start_date) > new Date()) return false;
          if (ad.end_date && new Date(ad.end_date) < new Date()) return false;
          return true;
        }) || [];
        
        if (!error && dateFiltered.length > 0) {
          // Filter ads based on targeting/clustering
          const filteredAds = dateFiltered.filter((ad: any) => {
            // If no targeting set, show to everyone
            const hasTargeting = 
              (ad.target_branche && ad.target_branche.length > 0) ||
              (ad.target_status && ad.target_status.length > 0) ||
              (ad.target_regions && ad.target_regions.length > 0);

            if (!hasTargeting) return true;

            // Check if user matches targeting criteria
            if (userProfile) {
              // Check branche
              if (ad.target_branche && ad.target_branche.length > 0) {
                if (!userProfile.branche || !ad.target_branche.includes(userProfile.branche)) {
                  return false;
                }
              }

              // Check status
              if (ad.target_status && ad.target_status.length > 0) {
                if (!userProfile.status || !ad.target_status.includes(userProfile.status)) {
                  return false;
                }
              }

              // Check region (simple check - can be enhanced)
              if (ad.target_regions && ad.target_regions.length > 0) {
                const userRegion = userProfile.ort || '';
                const matchesRegion = ad.target_regions.some((region: string) =>
                  userRegion.toLowerCase().includes(region.toLowerCase()) ||
                  region.toLowerCase().includes(userRegion.toLowerCase())
                );
                if (!matchesRegion) {
                  return false;
                }
              }
            }

            return true;
          });

          setLinks(filteredAds.slice(0, 5).map((ad: any) => ({
            id: ad.id,
            title: ad.title,
            url: ad.url,
            description: ad.description,
            imageUrl: ad.image_url,
            badge: ad.badge,
            category: ad.category
          })));
          setLoading(false);
          return;
        }

        // Fallback: Use default links if no data from database
        const defaultLinks: AdLink[] = [
          {
            id: '1',
            title: 'Premium Mitgliedschaft',
            url: '/premium',
            description: 'Erhalte Zugang zu exklusiven Features und erweiterten Funktionen',
            badge: 'Anzeige',
            category: 'Membership'
          },
          {
            id: '2',
            title: 'Karriere-Webinar',
            url: '/webinar',
            description: 'Lerne von Branchenexperten und entwickle dich weiter',
            badge: 'Neu',
            category: 'Event'
          },
          {
            id: '3',
            title: 'Job-Alerts aktivieren',
            url: '/jobs/alerts',
            description: 'Verpasse keine neuen Stellenangebote in deiner Branche',
            badge: 'Sponsored',
            category: 'Feature'
          }
        ];

        setLinks(defaultLinks);
      } catch (error) {
        console.error('Error loading ad links:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdLinks();
  }, [position]);

  return { links, loading };
};

