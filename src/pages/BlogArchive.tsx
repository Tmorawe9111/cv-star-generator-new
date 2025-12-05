import React from 'react';
import { useBlogPostsArchive } from '@/hooks/useBlogPosts';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { BlogArchive } from '@/components/blog/BlogArchive';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';

export default function BlogArchivePage() {
  const { data: posts, isLoading } = useBlogPostsArchive();

  const seoData = useSEO({
    title: 'Newsroom Archiv – BeVisiblle',
    description: 'Alle Artikel im Archiv. Durchsuche nach Themen, Jahren und Monaten.',
    keywords: ['Blog', 'Archiv', 'Artikel', 'Newsroom'],
  });

  const hasPosts = posts && posts.length > 0;

  return (
    <>
      <SEOHead {...seoData} />
      <CareerHubHeader />
      <BaseLayout>
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
          {isLoading && !posts ? (
            <div className="min-h-screen flex items-center justify-center pt-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Lade Archiv...</p>
              </div>
            </div>
          ) : posts && posts.length > 0 ? (
            <BlogArchive articles={posts} />
          ) : (
            <div className="min-h-screen flex items-center justify-center pt-20">
              <div className="text-center max-w-md px-4">
                <h1 className="text-3xl font-bold mb-4 text-gray-900">Noch keine Artikel</h1>
                <p className="text-gray-500 mb-2">
                  Die ersten Artikel werden hier erscheinen.
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  Schauen Sie später noch einmal vorbei.
                </p>
              </div>
            </div>
          )}
        </div>
      </BaseLayout>
    </>
  );
}

