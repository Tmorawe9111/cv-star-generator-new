import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author_id?: string;
  industry_sector?: 'pflege' | 'handwerk' | 'industrie' | 'allgemein';
  target_audience?: 'schueler' | 'azubi' | 'profi' | 'unternehmen';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  featured_image?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  industry_sector?: 'pflege' | 'handwerk' | 'industrie' | 'allgemein';
  target_audience?: 'schueler' | 'azubi' | 'profi' | 'unternehmen';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  featured_image?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
}

// Fetch all blog posts (for admin)
export function useBlogPostsAdmin(filter?: { status?: string; industry_sector?: string; target_audience?: string }) {
  return useQuery({
    queryKey: ['blogPostsAdmin', filter],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      if (filter?.industry_sector) {
        query = query.eq('industry_sector', filter.industry_sector);
      }
      if (filter?.target_audience) {
        query = query.eq('target_audience', filter.target_audience);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BlogPost[];
    },
  });
}

// Fetch single blog post
export function useBlogPost(id: string) {
  return useQuery({
    queryKey: ['blogPost', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!id,
  });
}

// Create blog post
export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: BlogPostInput) => {
      if (!user) throw new Error('Not authenticated');

      const postData = {
        ...input,
        author_id: user.id,
        published_at: input.status === 'published' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPostsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });
}

// Update blog post
export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<BlogPostInput> }) => {
      const updateData: any = {
        ...input,
        updated_at: new Date().toISOString(),
      };

      // Set published_at when status changes to published
      if (input.status === 'published' && !input.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blogPostsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blogPost', variables.id] });
    },
  });
}

// Delete blog post
export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPostsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });
}

