import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author_id: string | null;
  industry_sector: 'pflege' | 'handwerk' | 'industrie' | 'allgemein' | null;
  target_audience: 'schueler' | 'azubi' | 'profi' | 'unternehmen' | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  featured_image: string | null;
  category: string | null;
  tags: string[] | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseBlogPostsOptions {
  industry?: 'pflege' | 'handwerk' | 'industrie' | 'allgemein';
  targetAudience?: 'schueler' | 'azubi' | 'profi' | 'unternehmen';
  category?: string;
  limit?: number;
  offset?: number;
  status?: 'published' | 'draft' | 'archived';
}

export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const { industry, targetAudience, category, limit = 10, offset = 0, status = 'published' } = options;

  return useQuery({
    queryKey: ['blog-posts', industry, targetAudience, category, limit, offset, status],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (industry) {
        query = query.eq('industry_sector', industry);
      }

      if (targetAudience) {
        query = query.eq('target_audience', targetAudience);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BlogPost[];
    }
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug
  });
}

