import React from 'react';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { NewsroomGrid } from '@/components/blog/NewsroomGrid';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';

export default function Blog() {
  const { data: posts, isLoading, error } = useBlogPosts({ status: 'published' });

  const seoData = useSEO({
    title: 'Newsroom – BeVisiblle',
    description: 'Aktuelle Einblicke in Pflege, Handwerk und Industrie. Ratgeber für Schüler, Azubis und Fachkräfte.',
    keywords: ['Blog', 'Ratgeber', 'Ausbildung', 'Karriere', 'Tipps'],
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
                <p className="text-sm text-gray-500">Lade Artikel...</p>
              </div>
            </div>
          ) : error ? (
            <div className="min-h-screen flex items-center justify-center pt-20">
              <div className="text-center max-w-md px-4">
                <h1 className="text-2xl font-bold mb-4 text-gray-900">Fehler beim Laden</h1>
                <p className="text-gray-500 mb-6">Die Blog-Artikel konnten nicht geladen werden.</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-2 bg-[#5170ff] text-white rounded-full hover:bg-[#5170ff]/90 transition-colors"
                >
                  Seite neu laden
                </button>
              </div>
            </div>
          ) : hasPosts ? (
            <NewsroomGrid articles={posts} />
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