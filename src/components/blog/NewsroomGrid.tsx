import React from 'react';
import { NewsroomCard } from './NewsroomCard';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featured_image?: string | null;
  category?: string | null;
  published_at?: string | null;
  industry_sector?: string | null;
}

interface NewsroomGridProps {
  articles: BlogPost[];
}

export function NewsroomGrid({ articles }: NewsroomGridProps) {
  // Der erste Artikel ist immer der Hero
  const heroArticle = articles[0];
  // Der Rest sind Standard-Artikel
  const standardArticles = articles.slice(1);

  return (
    <section className="bg-white min-h-screen pb-24">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        {/* Header - Minimalistisch wie Apple */}
        <div className="py-20 border-b border-gray-100 mb-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
            Newsroom
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl">
            Aktuelle Einblicke in Pflege, Handwerk und Industrie.
          </p>
        </div>

        {/* 1. HERO SECTION (Der große Artikel ganz oben) */}
        {heroArticle && (
          <div className="mb-24 border-b border-gray-100 pb-16">
            <NewsroomCard article={heroArticle} variant="hero" />
          </div>
        )}

        {/* 2. STANDARD GRID (Die 2er oder 3er Reihe) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {standardArticles.map((article) => (
            <NewsroomCard key={article.id} article={article} variant="standard" />
          ))}
        </div>

        {/* Optional: "Load More" Button im Apple Style */}
        {articles.length > 0 && (
          <div className="mt-20 text-center">
            <a
              href="/blog/archive"
              className="text-gray-600 font-semibold hover:text-gray-900 text-lg inline-block transition-colors"
            >
              View Archive
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

