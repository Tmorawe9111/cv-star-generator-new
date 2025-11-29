import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  // Social Media Meta Tags
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  og_url?: string;
  twitter_card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_site?: string;
  twitter_creator?: string;
  // Video Support
  video_url?: string;
  video_embed_code?: string;
  // Additional Media
  gallery_images?: string[];
  external_links?: Array<{ url: string; title: string; description?: string }>;
  // Social Sharing
  enable_social_sharing?: boolean;
  canonical_url?: string;
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
  // Social Media Meta Tags
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  og_url?: string;
  twitter_card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_site?: string;
  twitter_creator?: string;
  // Video Support
  video_url?: string;
  video_embed_code?: string;
  // Additional Media
  gallery_images?: string[];
  external_links?: Array<{ url: string; title: string; description?: string }>;
  // Social Sharing
  enable_social_sharing?: boolean;
  canonical_url?: string;
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

// Schnelle Bildkompression - optimiert für Geschwindigkeit
async function compressImage(file: File, maxWidth: number = 1600, quality: number = 0.75): Promise<File> {
  return new Promise((resolve, reject) => {
    // Verwende createImageBitmap für bessere Performance (wenn verfügbar)
    const useImageBitmap = typeof createImageBitmap !== 'undefined';
    
    const processImage = (img: HTMLImageElement | ImageBitmap) => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Schnellere Skalierung - nur wenn wirklich nötig
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (!ctx) {
        reject(new Error('Canvas context nicht verfügbar'));
        return;
      }

      // Optimierte Rendering-Einstellungen
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium'; // 'medium' ist schneller als 'high'

      ctx.drawImage(img, 0, 0, width, height);

      // Schnellere Kompression mit niedrigerer Qualität
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Bildkompression fehlgeschlagen'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg', // Immer JPEG für bessere Kompression
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg', // Immer JPEG für schnellere Kompression
        quality
      );
    };

    if (useImageBitmap) {
      // Schnellere Methode mit createImageBitmap
      createImageBitmap(file)
        .then(processImage)
        .catch(() => {
          // Fallback zu normaler Methode
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => processImage(img);
            img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
            img.src = e.target?.result as string;
          };
          reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
          reader.readAsDataURL(file);
        });
    } else {
      // Fallback für ältere Browser
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImage(img);
        img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
      reader.readAsDataURL(file);
    }
  });
}

// Upload image to Supabase Storage mit Progress-Callback
export function useUploadBlogImage() {
  const { user } = useAuth();

  return async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    if (!user) throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');

    try {
      // Schnellere Kompression - nur bei großen Dateien (>1MB)
      let fileToUpload = file;
      let contentType = file.type || 'image/jpeg';
      
      if (file.size > 1024 * 1024) { // Nur komprimieren wenn > 1MB
        onProgress?.(10);
        fileToUpload = await compressImage(file, 1600, 0.75); // Schnellere Einstellungen
        contentType = 'image/jpeg'; // Komprimierte Dateien sind immer JPEG
        onProgress?.(30);
        console.log(`Bild komprimiert: ${(file.size / 1024).toFixed(0)}KB → ${(fileToUpload.size / 1024).toFixed(0)}KB`);
      } else {
        onProgress?.(20);
        // Behalte den originalen Content-Type für kleine Dateien
        contentType = file.type || 'image/jpeg';
      }

      // Bestimme Dateiendung basierend auf Content-Type oder Dateiname
      let fileExt = 'jpg';
      if (contentType.includes('png')) fileExt = 'png';
      else if (contentType.includes('webp')) fileExt = 'webp';
      else if (contentType.includes('gif')) fileExt = 'gif';
      else {
        const originalExt = file.name.split('.').pop()?.toLowerCase();
        if (originalExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(originalExt)) {
          fileExt = originalExt;
        }
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      onProgress?.(40);

      console.log(`Uploading to blog-images: ${filePath}, Content-Type: ${contentType}, Size: ${(fileToUpload.size / 1024).toFixed(0)}KB`);

      // Verwende den korrekten Bucket 'blog-images'
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(filePath, fileToUpload, {
          cacheControl: '31536000', // 1 Jahr Cache
          upsert: false,
          contentType: contentType,
        });

      onProgress?.(90);

      if (error) {
        console.error('Image upload error details:', {
          message: error.message,
          name: error.name,
        });
        
        // Spezifische Fehlermeldungen
        if (error.message?.includes('new row violates row-level security policy') || 
            error.message?.includes('RLS') ||
            error.message?.includes('permission denied') ||
            error.message?.includes('42501')) {
          throw new Error('Keine Berechtigung zum Hochladen. Bitte kontaktieren Sie einen Administrator.');
        } else if (error.message?.includes('Bucket not found') || 
                   error.message?.includes('404') ||
                   error.message?.includes('not found')) {
          throw new Error('Storage-Bucket nicht gefunden. Bitte kontaktieren Sie einen Administrator.');
        } else if (error.message?.includes('File size limit') || 
                   error.message?.includes('too large') ||
                   error.message?.includes('413')) {
          throw new Error('Datei ist zu groß. Bitte wählen Sie ein kleineres Bild.');
        } else {
          throw new Error(`Fehler beim Hochladen: ${error.message || 'Unbekannter Fehler'}`);
        }
      }

      if (!data) {
        throw new Error('Upload erfolgreich, aber keine Daten zurückgegeben.');
      }

      const { data: publicUrlData } = supabase.storage.from('blog-images').getPublicUrl(filePath);
      onProgress?.(100);
      
      if (!publicUrlData?.publicUrl) {
        throw new Error('URL konnte nicht generiert werden.');
      }

      console.log(`Upload erfolgreich: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Upload process error:', error);
      // Wenn es bereits eine benutzerfreundliche Fehlermeldung ist, weiterwerfen
      if (error.message && !error.message.includes('Fehler beim Hochladen')) {
        throw error;
      }
      throw new Error(error.message || 'Unbekannter Fehler beim Hochladen');
    }
  };
}

