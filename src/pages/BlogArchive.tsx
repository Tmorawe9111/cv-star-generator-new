import React from 'react';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { BlogArchive } from '@/components/blog/BlogArchive';

export default function BlogArchivePage() {
  const { data: posts, isLoading } = useBlogPosts({ status: 'published' });

  const seoData = useSEO({
    title: 'Newsroom Archiv – BeVisiblle',
    description: 'Alle Artikel im Archiv. Durchsuche nach Themen, Jahren und Monaten.',
    keywords: ['Blog', 'Archiv', 'Artikel', 'Newsroom'],
  });

  return (
    <>
      <SEOHead {...seoData} />
      <BaseLayout>
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : posts && posts.length > 0 ? (
          <BlogArchive articles={posts} />
        ) : (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4 text-gray-900">Noch keine Artikel</h1>
              <p className="text-gray-500">Die ersten Artikel werden hier erscheinen.</p>
            </div>
          </div>
        )}
      </BaseLayout>
    </>
  );
}

