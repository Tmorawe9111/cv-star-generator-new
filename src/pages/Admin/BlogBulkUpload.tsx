import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Loader2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import slugify from 'slugify';
import { useNavigate } from 'react-router-dom';

interface BlogPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  industry_sector?: 'pflege' | 'handwerk' | 'industrie' | 'allgemein';
  target_audience?: 'schueler' | 'azubi' | 'profi' | 'unternehmen';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  featured_image?: string;
  featured_image_base64?: string; // Base64-kodiertes Bild
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  published_at?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_image_base64?: string; // Base64-kodiertes Bild
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_image_base64?: string; // Base64-kodiertes Bild
  gallery_images?: string[];
  gallery_images_base64?: string[]; // Base64-kodierte Bilder
  enable_social_sharing?: boolean;
}

interface ValidationError {
  index: number;
  field: string;
  message: string;
}

export default function BlogBulkUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [parsedBlogs, setParsedBlogs] = useState<BlogPostInput[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadProgress, setImageUploadProgress] = useState<Record<number, number>>({});

  const generateSlug = (title: string): string => {
    return slugify(title, { lower: true, strict: true, trim: true });
  };

  // Konvertiert Base64-String zu File-Objekt
  const base64ToFile = (base64String: string, filename: string): File => {
    // Entferne Data-URL-Präfix falls vorhanden (z.B. "data:image/jpeg;base64,")
    const base64Data = base64String.includes(',') 
      ? base64String.split(',')[1] 
      : base64String;
    
    // Erkenne MIME-Type aus Base64-Präfix oder filename
    let mimeType = 'image/jpeg';
    if (base64String.startsWith('data:image/png')) mimeType = 'image/png';
    else if (base64String.startsWith('data:image/webp')) mimeType = 'image/webp';
    else if (base64String.startsWith('data:image/gif')) mimeType = 'image/gif';
    else if (filename.toLowerCase().endsWith('.png')) mimeType = 'image/png';
    else if (filename.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';
    else if (filename.toLowerCase().endsWith('.gif')) mimeType = 'image/gif';

    // Konvertiere Base64 zu Binary
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    return new File([blob], filename, { type: mimeType });
  };

  // Lädt ein Bild zu Supabase Storage hoch
  const uploadImageToStorage = async (
    base64String: string | undefined,
    existingUrl: string | undefined,
    filename: string,
    blogIndex: number
  ): Promise<string | null> => {
    // Wenn bereits eine URL vorhanden ist und kein Base64, verwende die URL
    if (existingUrl && !base64String) {
      return existingUrl;
    }

    // Wenn kein Base64 vorhanden ist, return null
    if (!base64String) {
      return existingUrl || null;
    }

    if (!user) {
      throw new Error('Nicht authentifiziert');
    }

    try {
      // Konvertiere Base64 zu File
      const file = base64ToFile(base64String, filename);
      
      // Erstelle eindeutigen Dateinamen
      const timestamp = Date.now();
      const fileExt = filename.split('.').pop() || 'jpg';
      const storagePath = `${user.id}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload zu Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error(`Upload error for ${filename}:`, uploadError);
        throw uploadError;
      }

      // Hole Public URL
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        throw new Error('Konnte Public URL nicht abrufen');
      }

      console.log(`✅ Bild hochgeladen: ${filename} -> ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error(`Fehler beim Upload von ${filename}:`, error);
      throw error;
    }
  };

  const validateBlogPost = (blog: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    if (!blog.title || blog.title.trim().length === 0) {
      errors.push({ index, field: 'title', message: 'Titel ist erforderlich' });
    }
    if (!blog.content || blog.content.trim().length === 0) {
      errors.push({ index, field: 'content', message: 'Content ist erforderlich' });
    }

    // SEO fields (warn if missing, but don't block)
    if (!blog.seo_title) {
      errors.push({ index, field: 'seo_title', message: 'SEO Titel fehlt (wird aus Titel generiert)' });
    }
    if (!blog.seo_description || blog.seo_description.length < 120) {
      errors.push({ index, field: 'seo_description', message: 'SEO Beschreibung sollte mindestens 120 Zeichen haben' });
    }
    if (!blog.seo_keywords || blog.seo_keywords.length === 0) {
      errors.push({ index, field: 'seo_keywords', message: 'SEO Keywords fehlen' });
    }

    // Industry sector validation
    if (blog.industry_sector && !['pflege', 'handwerk', 'industrie', 'allgemein'].includes(blog.industry_sector)) {
      errors.push({ index, field: 'industry_sector', message: 'Ungültiger industry_sector (pflege, handwerk, industrie, allgemein)' });
    }

    // Target audience validation
    if (blog.target_audience && !['schueler', 'azubi', 'profi', 'unternehmen'].includes(blog.target_audience)) {
      errors.push({ index, field: 'target_audience', message: 'Ungültige target_audience (schueler, azubi, profi, unternehmen)' });
    }

    return errors;
  };

  const parseJSON = useCallback(() => {
    try {
      const blogs = JSON.parse(jsonInput);
      const blogArray = Array.isArray(blogs) ? blogs : [blogs];
      
      const processedBlogs: BlogPostInput[] = blogArray.map((blog: any, index: number) => {
        // Auto-generate slug if missing
        const slug = blog.slug || generateSlug(blog.title);
        
        // Auto-generate SEO fields if missing
        const seoTitle = blog.seo_title || blog.title;
        const seoDescription = blog.seo_description || blog.excerpt || blog.title.substring(0, 160);
        
        // Ensure arrays are arrays
        const seoKeywords = Array.isArray(blog.seo_keywords) 
          ? blog.seo_keywords 
          : blog.seo_keywords 
            ? blog.seo_keywords.split(',').map((k: string) => k.trim())
            : [];
        
        const tags = Array.isArray(blog.tags)
          ? blog.tags
          : blog.tags
            ? blog.tags.split(',').map((t: string) => t.trim())
            : [];

        return {
          title: blog.title || '',
          slug,
          excerpt: blog.excerpt || '',
          content: blog.content || '',
          industry_sector: blog.industry_sector || 'allgemein',
          target_audience: blog.target_audience || 'profi',
          seo_title: seoTitle,
          seo_description: seoDescription,
          seo_keywords: seoKeywords,
          featured_image: blog.featured_image || '',
          category: blog.category || '',
          tags,
          status: blog.status || 'published',
          published_at: blog.published_at || (blog.status === 'published' ? new Date().toISOString() : undefined),
          og_title: blog.og_title || seoTitle,
          og_description: blog.og_description || seoDescription,
          og_image: blog.og_image || blog.featured_image || '',
          twitter_title: blog.twitter_title || seoTitle,
          twitter_description: blog.twitter_description || seoDescription,
          twitter_image: blog.twitter_image || blog.featured_image || '',
          enable_social_sharing: blog.enable_social_sharing !== false,
        };
      });

      // Validate all blogs
      const errors: ValidationError[] = [];
      processedBlogs.forEach((blog, index) => {
        const blogErrors = validateBlogPost(blog, index);
        errors.push(...blogErrors);
      });

      setParsedBlogs(processedBlogs);
      setValidationErrors(errors);

      if (errors.length > 0) {
        toast.warning(`${errors.length} Validierungsfehler gefunden. Bitte prüfen Sie die Vorschau.`);
      } else {
        toast.success(`${processedBlogs.length} Blog(s) erfolgreich geparst und validiert!`);
      }
    } catch (error: any) {
      toast.error(`JSON Parse Fehler: ${error.message}`);
      setParsedBlogs([]);
      setValidationErrors([]);
    }
  }, [jsonInput]);

  const parseCSV = useCallback(() => {
    try {
      const lines = csvInput.split('\n').filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('CSV muss mindestens eine Header-Zeile und eine Daten-Zeile haben');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const blogs: BlogPostInput[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const blog: any = {};
        
        headers.forEach((header, index) => {
          blog[header] = values[index] || '';
        });

        // Convert string arrays
        if (blog.seo_keywords) {
          blog.seo_keywords = blog.seo_keywords.split(';').map((k: string) => k.trim());
        }
        if (blog.tags) {
          blog.tags = blog.tags.split(';').map((t: string) => t.trim());
        }

        const slug = blog.slug || generateSlug(blog.title);
        const seoTitle = blog.seo_title || blog.title;
        const seoDescription = blog.seo_description || blog.excerpt || blog.title.substring(0, 160);

        blogs.push({
          title: blog.title || '',
          slug,
          excerpt: blog.excerpt || '',
          content: blog.content || '',
          industry_sector: blog.industry_sector || 'allgemein',
          target_audience: blog.target_audience || 'profi',
          seo_title: seoTitle,
          seo_description: seoDescription,
          seo_keywords: blog.seo_keywords || [],
          featured_image: blog.featured_image || '',
          category: blog.category || '',
          tags: blog.tags || [],
          status: blog.status || 'published',
          published_at: blog.published_at || (blog.status === 'published' ? new Date().toISOString() : undefined),
          og_title: blog.og_title || seoTitle,
          og_description: blog.og_description || seoDescription,
          og_image: blog.og_image || blog.featured_image || '',
          twitter_title: blog.twitter_title || seoTitle,
          twitter_description: blog.twitter_description || seoDescription,
          twitter_image: blog.twitter_image || blog.featured_image || '',
          enable_social_sharing: blog.enable_social_sharing !== 'false',
        });
      }

      // Validate all blogs
      const errors: ValidationError[] = [];
      blogs.forEach((blog, index) => {
        const blogErrors = validateBlogPost(blog, index);
        errors.push(...blogErrors);
      });

      setParsedBlogs(blogs);
      setValidationErrors(errors);

      if (errors.length > 0) {
        toast.warning(`${errors.length} Validierungsfehler gefunden. Bitte prüfen Sie die Vorschau.`);
      } else {
        toast.success(`${blogs.length} Blog(s) erfolgreich geparst und validiert!`);
      }
    } catch (error: any) {
      toast.error(`CSV Parse Fehler: ${error.message}`);
      setParsedBlogs([]);
      setValidationErrors([]);
    }
  }, [csvInput]);

  const uploadBlogs = async () => {
    if (!user) {
      toast.error('Bitte melden Sie sich an');
      return;
    }

    if (parsedBlogs.length === 0) {
      toast.error('Keine Blogs zum Hochladen');
      return;
    }

    // Filter out blogs with critical errors (missing title or content)
    const criticalErrors = validationErrors.filter(e => e.field === 'title' || e.field === 'content');
    if (criticalErrors.length > 0) {
      toast.error(`Bitte beheben Sie zuerst ${criticalErrors.length} kritische Fehler`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Schritt 1: Bilder hochladen (wenn Base64 vorhanden)
      const blogsWithImages = await Promise.all(
        parsedBlogs.map(async (blog, index) => {
          const imageUrls: {
            featured_image?: string;
            og_image?: string;
            twitter_image?: string;
            gallery_images?: string[];
          } = {};

          // Upload featured_image
          if (blog.featured_image_base64 || blog.featured_image) {
            try {
              setImageUploadProgress(prev => ({ ...prev, [index]: 10 }));
              const featuredUrl = await uploadImageToStorage(
                blog.featured_image_base64,
                blog.featured_image,
                `featured-${blog.slug || index}.jpg`,
                index
              );
              if (featuredUrl) {
                imageUrls.featured_image = featuredUrl;
                imageUrls.og_image = featuredUrl; // Default OG image to featured
              }
            } catch (error: any) {
              console.error(`Fehler beim Upload von featured_image für Blog ${index + 1}:`, error);
              toast.warning(`Bild-Upload für "${blog.title}" fehlgeschlagen: ${error.message}`);
            }
          }

          // Upload og_image (falls separat angegeben)
          if (blog.og_image_base64 || blog.og_image) {
            try {
              setImageUploadProgress(prev => ({ ...prev, [index]: 30 }));
              const ogUrl = await uploadImageToStorage(
                blog.og_image_base64,
                blog.og_image,
                `og-${blog.slug || index}.jpg`,
                index
              );
              if (ogUrl) imageUrls.og_image = ogUrl;
            } catch (error: any) {
              console.error(`Fehler beim Upload von og_image für Blog ${index + 1}:`, error);
            }
          }

          // Upload twitter_image (falls separat angegeben)
          if (blog.twitter_image_base64 || blog.twitter_image) {
            try {
              setImageUploadProgress(prev => ({ ...prev, [index]: 50 }));
              const twitterUrl = await uploadImageToStorage(
                blog.twitter_image_base64,
                blog.twitter_image,
                `twitter-${blog.slug || index}.jpg`,
                index
              );
              if (twitterUrl) imageUrls.twitter_image = twitterUrl;
            } catch (error: any) {
              console.error(`Fehler beim Upload von twitter_image für Blog ${index + 1}:`, error);
            }
          }

          // Upload gallery_images (falls Base64 vorhanden)
          if (blog.gallery_images_base64 && blog.gallery_images_base64.length > 0) {
            try {
              setImageUploadProgress(prev => ({ ...prev, [index]: 70 }));
              const galleryUrls = await Promise.all(
                blog.gallery_images_base64.map((base64, imgIndex) =>
                  uploadImageToStorage(
                    base64,
                    blog.gallery_images?.[imgIndex],
                    `gallery-${blog.slug || index}-${imgIndex}.jpg`,
                    index
                  )
                )
              );
              imageUrls.gallery_images = galleryUrls.filter((url): url is string => url !== null);
            } catch (error: any) {
              console.error(`Fehler beim Upload von gallery_images für Blog ${index + 1}:`, error);
            }
          }

          setImageUploadProgress(prev => ({ ...prev, [index]: 100 }));

          return {
            ...blog,
            ...imageUrls,
          };
        })
      );

      // Schritt 2: Blogs mit hochgeladenen Bildern vorbereiten
      const blogsToUpload = blogsWithImages.map((blog, index) => {
        // Ensure status is set correctly
        const finalStatus = blog.status || 'published';
        const isPublished = finalStatus === 'published';
        
        return {
          ...blog,
          author_id: user.id,
          status: finalStatus,
          published_at: isPublished ? (blog.published_at || new Date().toISOString()) : null,
          // Ensure all required fields are present
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Ensure slug is unique by appending timestamp if needed
          slug: blog.slug || generateSlug(blog.title),
          // Remove base64 fields before upload
          featured_image_base64: undefined,
          og_image_base64: undefined,
          twitter_image_base64: undefined,
          gallery_images_base64: undefined,
        };
      });

      // Upload in batches with fallback to individual uploads
      const batchSize = 5;
      let uploaded = 0;
      let failed = 0;
      const failedBlogs: { index: number; title: string; error: string }[] = [];

      // Process in batches
      for (let i = 0; i < blogsToUpload.length; i += batchSize) {
        const batch = blogsToUpload.slice(i, i + batchSize);
        
        try {
          // Try batch insert first (faster)
          const { data, error } = await supabase
            .from('blog_posts')
            .insert(batch)
            .select();

          if (error) {
            console.error(`Batch upload error (${i}-${i + batch.length - 1}):`, error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            
            // Fallback to individual uploads for this batch
            for (let j = 0; j < batch.length; j++) {
              const singleBlog = batch[j];
              
              try {
                const { data: singleData, error: singleError } = await supabase
                  .from('blog_posts')
                  .insert(singleBlog)
                  .select()
                  .single();

                if (singleError) {
                  console.error(`Single upload error for "${singleBlog.title}":`, singleError);
                  console.error('Single error details:', JSON.stringify(singleError, null, 2));
                  failed++;
                  failedBlogs.push({
                    index: i + j,
                    title: singleBlog.title,
                    error: singleError.message || JSON.stringify(singleError)
                  });
                } else {
                  uploaded++;
                  console.log(`✅ Successfully uploaded: "${singleBlog.title}"`);
                }
              } catch (singleErr: any) {
                console.error(`Exception for "${singleBlog.title}":`, singleErr);
                failed++;
                failedBlogs.push({
                  index: i + j,
                  title: singleBlog.title,
                  error: singleErr.message || 'Unbekannter Fehler'
                });
              }
              
              setUploadProgress(Math.round(((i + j + 1) / blogsToUpload.length) * 100));
            }
          } else {
            // Batch upload successful
            uploaded += data?.length || 0;
            console.log(`✅ Successfully uploaded batch ${Math.floor(i / batchSize) + 1} (${data?.length || 0} blogs)`);
            setUploadProgress(Math.round(((i + batch.length) / blogsToUpload.length) * 100));
          }
        } catch (error: any) {
          console.error(`Unexpected batch error:`, error);
          // Fallback to individual uploads
          for (let j = 0; j < batch.length; j++) {
            const singleBlog = batch[j];
            try {
              const { data: singleData, error: singleError } = await supabase
                .from('blog_posts')
                .insert(singleBlog)
                .select()
                .single();

              if (singleError) {
                failed++;
                failedBlogs.push({
                  index: i + j,
                  title: singleBlog.title,
                  error: singleError.message
                });
              } else {
                uploaded++;
              }
            } catch (singleErr: any) {
              failed++;
              failedBlogs.push({
                index: i + j,
                title: singleBlog.title,
                error: singleErr.message || 'Unbekannter Fehler'
              });
            }
            setUploadProgress(Math.round(((i + j + 1) / blogsToUpload.length) * 100));
          }
        }
      }

      // Show results
      if (uploaded > 0) {
        toast.success(`${uploaded} Blog(s) erfolgreich hochgeladen!`);
      }

      if (failed > 0) {
        console.error('Failed blogs:', failedBlogs);
        toast.error(
          `${failed} Blog(s) konnten nicht hochgeladen werden. Details in der Konsole.`,
          {
            duration: 10000,
          }
        );
        
        // Show detailed error message
        const errorDetails = failedBlogs.map(f => `"${f.title}": ${f.error}`).join('\n');
        console.error('Fehlerdetails:\n', errorDetails);
      }

      // Only clear and navigate if all succeeded
      if (failed === 0 && uploaded > 0) {
        setParsedBlogs([]);
        setJsonInput('');
        setCsvInput('');
        setValidationErrors([]);
        navigate('/admin/blog');
      } else if (uploaded > 0) {
        // Some succeeded, some failed - keep the failed ones for retry
        toast.info('Einige Blogs wurden hochgeladen. Fehlgeschlagene bleiben in der Vorschau für erneuten Versuch.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload Fehler: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        title: 'Beispiel Blog Titel',
        excerpt: 'Kurze Beschreibung des Blogs',
        content: '<p>Vollständiger HTML Content des Blog-Artikels...</p>',
        industry_sector: 'pflege',
        target_audience: 'schueler',
        seo_title: 'SEO-optimierter Titel für Suchmaschinen',
        seo_description: 'SEO-optimierte Beschreibung mit mindestens 120 Zeichen für bessere Sichtbarkeit in Suchmaschinen und Social Media Plattformen.',
        seo_keywords: ['Pflege', 'Ausbildung', 'Karriere'],
        featured_image: 'https://bevisiblle.de/images/blog-featured.jpg',
        // ODER Base64-kodiertes Bild:
        // featured_image_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
        category: 'Ausbildung',
        tags: ['Pflege', 'Karriere'],
        status: 'published',
        og_title: 'Open Graph Titel',
        og_description: 'Open Graph Beschreibung',
        og_image: 'https://bevisiblle.de/images/blog-og.jpg',
        // ODER Base64:
        // og_image_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
        twitter_title: 'Twitter Card Titel',
        twitter_description: 'Twitter Card Beschreibung',
        twitter_image: 'https://bevisiblle.de/images/blog-twitter.jpg',
        // ODER Base64:
        // twitter_image_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
        // Galerie-Bilder (Base64-Array):
        // gallery_images_base64: [
        //   'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
        //   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        // ]
      },
    ];

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog-template.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template heruntergeladen!');
  };

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-4xl font-semibold tracking-tight">Blog Bulk Upload</h1>
        <p className="text-muted-foreground text-base">
          Laden Sie mehrere Blogs auf einmal hoch - SEO/GEO optimiert
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight">Upload</CardTitle>
                <CardDescription className="text-base">
                  JSON oder CSV Format - Automatische SEO-Optimierung
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="json" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="csv">CSV</TabsTrigger>
              </TabsList>

              <TabsContent value="json" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="json-input">JSON Input (Array von Blog-Objekten)</Label>
                  <Textarea
                    id="json-input"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[{"title": "Blog Titel", "content": "...", ...}]'
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
                <Button onClick={parseJSON} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  JSON Parsen & Validieren
                </Button>
              </TabsContent>

              <TabsContent value="csv" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-input">CSV Input (Komma-getrennt, Semikolon für Arrays)</Label>
                  <Textarea
                    id="csv-input"
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                    placeholder='title,content,industry_sector,target_audience,seo_title,seo_description,seo_keywords...'
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
                <Button onClick={parseCSV} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  CSV Parsen & Validieren
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Preview & Validation Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Vorschau & Validierung
            </CardTitle>
            <CardDescription className="text-base">
              {parsedBlogs.length > 0 && (
                <span>
                  {parsedBlogs.length} Blog(s) geparst • {validationErrors.length} Warnung(en)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parsedBlogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Blogs geparst</p>
                <p className="text-sm mt-2">Laden Sie JSON oder CSV hoch und klicken Sie auf "Parsen"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {validationErrors.map((error, idx) => (
                          <div key={idx} className="text-xs">
                            <strong>Blog #{error.index + 1}</strong> - {error.field}: {error.message}
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Blog Preview List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {parsedBlogs.map((blog, index) => {
                    const blogErrors = validationErrors.filter(e => e.index === index);
                    const hasCriticalErrors = blogErrors.some(e => e.field === 'title' || e.field === 'content');

                    return (
                      <Card key={index} className={`border ${hasCriticalErrors ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base font-semibold">
                                #{index + 1}: {blog.title || 'Kein Titel'}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{blog.industry_sector}</Badge>
                                <Badge variant="outline">{blog.target_audience}</Badge>
                                <Badge className={blog.status === 'published' ? 'bg-green-500' : 'bg-gray-500'}>
                                  {blog.status}
                                </Badge>
                              </div>
                            </div>
                            {blogErrors.length > 0 ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-xs space-y-1">
                            <div><strong>Slug:</strong> {blog.slug}</div>
                            <div><strong>SEO Titel:</strong> {blog.seo_title || '❌ Fehlt'}</div>
                            <div><strong>SEO Beschreibung:</strong> {blog.seo_description?.substring(0, 100) || '❌ Fehlt'}...</div>
                            <div><strong>Keywords:</strong> {blog.seo_keywords?.join(', ') || '❌ Fehlt'}</div>
                            {blogErrors.length > 0 && (
                              <div className="mt-2 text-red-600">
                                <strong>Fehler:</strong>
                                <ul className="list-disc list-inside">
                                  {blogErrors.map((err, idx) => (
                                    <li key={idx}>{err.message}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Upload Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={uploadBlogs}
                    disabled={uploading || validationErrors.some(e => e.field === 'title' || e.field === 'content')}
                    className="w-full"
                    size="lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Upload läuft... {uploadProgress}%
                        {Object.keys(imageUploadProgress).length > 0 && (
                          <span className="ml-2 text-xs">
                            (Bilder: {Math.round(Object.values(imageUploadProgress).reduce((a, b) => a + b, 0) / Object.keys(imageUploadProgress).length)}%)
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {parsedBlogs.length} Blog(s) hochladen
                      </>
                    )}
                  </Button>
                  {validationErrors.some(e => e.field === 'title' || e.field === 'content') && (
                    <p className="text-xs text-red-600 mt-2 text-center">
                      Bitte beheben Sie zuerst die kritischen Fehler
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Anleitung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Erforderliche Felder:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><code>title</code> - Blog Titel</li>
              <li><code>content</code> - HTML Content</li>
            </ul>
          </div>
          <div>
            <strong>SEO-Felder (empfohlen):</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><code>seo_title</code> - Wird automatisch aus title generiert falls fehlend</li>
              <li><code>seo_description</code> - Mindestens 120 Zeichen (wird aus excerpt generiert)</li>
              <li><code>seo_keywords</code> - Array von Keywords</li>
              <li><code>industry_sector</code> - pflege, handwerk, industrie, allgemein</li>
              <li><code>target_audience</code> - schueler, azubi, profi, unternehmen</li>
            </ul>
          </div>
          <div>
            <strong>Bild-Upload:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><code>featured_image</code> - URL oder <code>featured_image_base64</code> - Base64-String</li>
              <li><code>og_image</code> - URL oder <code>og_image_base64</code> - Base64-String</li>
              <li><code>twitter_image</code> - URL oder <code>twitter_image_base64</code> - Base64-String</li>
              <li><code>gallery_images_base64</code> - Array von Base64-Strings für Galerie-Bilder</li>
              <li>Base64-Format: <code>data:image/jpeg;base64,/9j/4AAQSkZJRg...</code> oder nur <code>/9j/4AAQSkZJRg...</code></li>
              <li>Bilder werden automatisch zu Supabase Storage hochgeladen</li>
            </ul>
          </div>
          <div>
            <strong>Automatische Features:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Slug wird automatisch aus Titel generiert</li>
              <li>SEO-Felder werden automatisch gefüllt falls fehlend</li>
              <li>Open Graph & Twitter Cards werden automatisch generiert</li>
              <li>published_at wird automatisch gesetzt für published Status</li>
              <li>Base64-Bilder werden automatisch zu Supabase hochgeladen</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

