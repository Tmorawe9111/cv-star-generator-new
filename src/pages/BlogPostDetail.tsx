import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlogPost } from '@/hooks/useBlogPosts';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { ArticleHeader } from '@/components/blog/ArticleHeader';
import { ArticleHero } from '@/components/blog/ArticleHero';
import { MoreFromSection } from '@/components/blog/MoreFromSection';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { ArticleStructuredData } from '@/components/seo/StructuredData';

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading } = useBlogPost(slug || '');

  const seoData = useSEO({
    title: post?.seo_title || post?.title || 'Blog-Artikel',
    description: post?.seo_description || post?.excerpt || '',
    keywords: post?.seo_keywords || [],
  });

  const getCategoryLabel = () => {
    if (post?.category) return post.category.toUpperCase();
    if (post?.industry_sector) {
      const labels: Record<string, string> = {
        pflege: 'PFLEGE',
        handwerk: 'HANDWERK',
        industrie: 'INDUSTRIE',
      };
      return labels[post.industry_sector] || 'KARRIERE';
    }
    return 'KARRIERE';
  };

  // Structured data is now handled by ArticleStructuredData component

  if (isLoading) {
    return (
      <>
        <CareerHubHeader />
        <BaseLayout>
          <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </BaseLayout>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <CareerHubHeader />
        <BaseLayout>
          <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Artikel nicht gefunden</h1>
              <Button onClick={() => navigate('/blog')}>Zurück zum Blog</Button>
            </div>
          </div>
        </BaseLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead {...seoData} />
      {post && (
        <ArticleStructuredData
          title={post.seo_title || post.title}
          description={post.seo_description || post.excerpt || ''}
          author={post.author || 'BeVisiblle Redaktion'}
          publishedAt={post.published_at || post.created_at}
          updatedAt={post.updated_at}
          image={post.featured_image}
          url={`https://bevisiblle.de/blog/${post.slug}`}
          slug={post.slug}
          industry={post.industry_sector as 'pflege' | 'handwerk' | 'industrie' | undefined}
        />
      )}
      <CareerHubHeader />
      <BaseLayout>
        <main className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen pb-24">
          <article className="pt-20 lg:pt-32">
            {/* Header (Zentriert, schmal) */}
            <div className="max-w-[720px] mx-auto px-6">
              <div className="mb-6">
                <Breadcrumbs items={[
                  { name: 'Home', url: '/' },
                  { name: 'Blog', url: '/blog' },
                  { name: post.title, url: `/blog/${post.slug}` }
                ]} />
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="mb-8 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <ArticleHeader
                label={getCategoryLabel()}
                date={post.published_at}
                title={post.title}
                content={post.content}
              />
            </div>

            {/* Hero Image (Breiter als Text -> "Breakout") */}
            <div className="max-w-[1024px] mx-auto px-6 my-12">
              <ArticleHero
                src={post.featured_image}
                caption={post.excerpt || undefined}
                alt={post.title}
              />
            </div>

            {/* Content (Wieder schmal) */}
            <div className="max-w-[720px] mx-auto px-6 prose prose-lg prose-slate prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:underline prose-img:rounded-2xl">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
          </article>

          {/* Footer "More from..." */}
          <div className="max-w-[1024px] mx-auto px-6 mt-24">
            <MoreFromSection />
          </div>
        </main>
      </BaseLayout>
    </>
  );
}

