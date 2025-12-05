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
  searchQuery?: string;
  limit?: number;
  offset?: number;
  status?: 'published' | 'draft' | 'archived';
}

export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const { industry, targetAudience, category, searchQuery, limit = 10, offset = 0, status = 'published' } = options;

  return useQuery({
    queryKey: ['blog-posts', industry, targetAudience, category, searchQuery, limit, offset, status],
    queryFn: async () => {
      // Timeout mit Promise.race für bessere Kontrolle
      const queryPromise = (async () => {
        try {
          // Optimierte Query - nur notwendige Felder für bessere Performance
          let query = supabase
            .from('blog_posts')
            .select('id, title, slug, excerpt, featured_image, category, industry_sector, published_at, created_at, status')
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

          // Always filter by status - default to published
          const finalStatus = status || 'published';
          query = query.eq('status', finalStatus);

          if (industry) {
            query = query.eq('industry_sector', industry);
          }

          if (targetAudience) {
            query = query.eq('target_audience', targetAudience);
          }

          if (category) {
            query = query.eq('category', category);
          }

          // Search functionality - search in title and excerpt
          // Note: Supabase doesn't support OR queries directly, so we filter client-side
          // For better performance, we could use PostgreSQL full-text search in the future

          const { data, error } = await query;

          if (error) {
            console.error('[useBlogPosts] Query error:', error);
            
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
              return [] as BlogPost[];
            }
            
            if (error.code === '42501' || error.message?.includes('permission denied')) {
              return [] as BlogPost[];
            }
            
            return [] as BlogPost[];
          }
          
          // Filter by search query client-side if needed
          let filteredData = data || [];
          if (searchQuery && searchQuery.trim().length > 0) {
            const queryLower = searchQuery.toLowerCase().trim();
            filteredData = filteredData.filter((post: BlogPost) => {
              const titleMatch = post.title?.toLowerCase().includes(queryLower);
              const excerptMatch = post.excerpt?.toLowerCase().includes(queryLower);
              return titleMatch || excerptMatch;
            });
          }
          
          return filteredData as BlogPost[];
        } catch (err: any) {
          console.error('[useBlogPosts] Exception:', err);
          return [] as BlogPost[];
        }
      })();

      // Moderater Timeout (8 Sekunden) - lang genug für normale Queries, kurz genug um nicht zu hängen
      const timeoutPromise = new Promise<BlogPost[]>((resolve) => {
        setTimeout(() => {
          console.warn('[useBlogPosts] Query timeout after 8 seconds - returning empty array');
          resolve([]);
        }, 8000);
      });

      return Promise.race([queryPromise, timeoutPromise]);
    },
    retry: 0, // Keine Retries für schnelleres Feedback
    staleTime: 5 * 60 * 1000, // 5 Minuten
    refetchOnWindowFocus: false,
    throwOnError: false,
    gcTime: 10 * 60 * 1000, // 10 Minuten Cache
    // Wichtig: Query sollte nicht blockieren - zeige Cache-Daten sofort
    placeholderData: (previousData) => previousData,
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

// Optimierte Hook für Archive - lädt ALLE Artikel ohne Limit
export function useBlogPostsArchive() {
  return useQuery({
    queryKey: ['blog-posts-archive'],
    queryFn: async () => {
      try {
        // Lade ALLE veröffentlichten Artikel für das Archiv
        // Nur notwendige Felder für bessere Performance
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, featured_image, category, industry_sector, published_at, created_at')
          .eq('status', 'published')
          .not('published_at', 'is', null)
          .order('published_at', { ascending: false });

        if (error) {
          console.error('[useBlogPostsArchive] Query error:', error);
          
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            return [] as BlogPost[];
          }
          
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            return [] as BlogPost[];
          }
          
          return [] as BlogPost[];
        }
        
        return (data || []) as BlogPost[];
      } catch (err: any) {
        console.error('[useBlogPostsArchive] Exception:', err);
        return [] as BlogPost[];
      }
    },
    retry: 0,
    staleTime: 10 * 60 * 1000, // 10 Minuten (Archive ändert sich selten)
    refetchOnWindowFocus: false,
    throwOnError: false,
    gcTime: 30 * 60 * 1000, // 30 Minuten Cache für Archive
    placeholderData: (previousData) => previousData, // Zeige Cache sofort
  });
}

