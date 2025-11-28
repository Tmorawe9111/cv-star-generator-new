import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentHub {
  id: string;
  slug: string;
  title: string;
  industry_sector: 'pflege' | 'handwerk' | 'industrie';
  target_audience: 'schueler' | 'azubi' | 'profi' | 'unternehmen' | null;
  meta_title: string | null;
  meta_description: string | null;
  content: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useContentHub(slug: string) {
  return useQuery({
    queryKey: ['content-hub', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_hubs')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as ContentHub;
    },
    enabled: !!slug
  });
}

export function useContentHubsByIndustry(industry: 'pflege' | 'handwerk' | 'industrie') {
  return useQuery({
    queryKey: ['content-hubs', industry],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_hubs')
        .select('*')
        .eq('industry_sector', industry)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContentHub[];
    }
  });
}

