import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const { data: posts, isLoading } = useBlogPosts({ status: 'published' });
  const post = posts?.find((p) => p.slug === slug);

  const seoData = useSEO({
    title: post?.seo_title || post?.title || 'Blog-Artikel',
    description: post?.seo_description || post?.excerpt || '',
    keywords: post?.seo_keywords || [],
  });

  const getIndustryLabel = (industry?: string) => {
    const labels: Record<string, string> = {
      pflege: 'Pflege',
      handwerk: 'Handwerk',
      industrie: 'Industrie',
      allgemein: 'Allgemein',
    };
    return labels[industry || ''] || null;
  };

  const getAudienceLabel = (audience?: string) => {
    const labels: Record<string, string> = {
      schueler: 'Schüler',
      azubi: 'Azubi',
      profi: 'Profi',
      unternehmen: 'Unternehmen',
    };
    return labels[audience || ''] || null;
  };

  useEffect(() => {
    if (post) {
      // JSON-LD Schema für BlogPosting
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.seo_title || post.title,
        description: post.seo_description || post.excerpt,
        image: post.featured_image || undefined,
        datePublished: post.published_at || post.created_at,
        dateModified: post.updated_at,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': window.location.href,
        },
      };
      const existing = document.getElementById('jsonld-blog') as HTMLScriptElement | null;
      const script = existing ?? (document.createElement('script') as HTMLScriptElement);
      script.type = 'application/ld+json';
      script.id = 'jsonld-blog';
      if (!existing) document.head.appendChild(script);
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [post]);

  if (isLoading) {
    return (
      <BaseLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </BaseLayout>
    );
  }

  if (!post) {
    return (
      <BaseLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Artikel nicht gefunden</h1>
            <Button onClick={() => navigate('/blog')}>Zurück zum Blog</Button>
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <>
      <SEOHead {...seoData} />
      <BaseLayout>
        <article className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/blog')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Blog
            </Button>

            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {getIndustryLabel(post.industry_sector) && (
                  <Badge variant="outline">{getIndustryLabel(post.industry_sector)}</Badge>
                )}
                {getAudienceLabel(post.target_audience) && (
                  <Badge variant="secondary">{getAudienceLabel(post.target_audience)}</Badge>
                )}
                {post.category && (
                  <Badge variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {post.category}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
              
              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-4">{post.excerpt}</p>
              )}
              
              {post.published_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), 'dd. MMMM yyyy', { locale: de })}
                </div>
              )}
            </header>

            {post.featured_image && (
              <img 
                src={post.featured_image} 
                alt={post.title}
                className="w-full h-auto rounded-lg mb-8"
              />
            )}

            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-sm font-semibold mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t text-center">
              <h2 className="text-2xl font-semibold mb-4">Bereit für deinen Traumjob?</h2>
              <Button size="lg" onClick={() => navigate('/cv-generator')}>
                Jetzt CV erstellen
              </Button>
            </div>
          </div>
        </article>
      </BaseLayout>
    </>
  );
}

