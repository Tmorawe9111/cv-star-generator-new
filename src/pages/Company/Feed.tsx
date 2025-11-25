import React from 'react';
import CommunityFeed from '@/components/community/CommunityFeed';
import CompanyFeedLeft from '@/components/company/feed/CompanyFeedLeft';
import CompanyFeedRight from '@/components/company/feed/CompanyFeedRight';
import FeedSortBar from '@/components/community/FeedSortBar';
import CompanyComposerTeaser from '@/components/dashboard/CompanyComposerTeaser';

const CompanyFeed: React.FC = () => {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-background">
      <h1 className="sr-only">Unternehmens‑Feed</h1>

      <div className="mx-auto grid min-h-screen max-w-screen-2xl grid-cols-1 gap-6 px-3 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-8 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        {/* Linke Spalte */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <CompanyFeedLeft />
          </div>
        </aside>

        {/* Mitte */}
        <section className="relative flex min-h-screen flex-col">
          <div className="sticky top-0 z-10 -mx-3 mb-4 bg-background/95 px-3 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl">
            <CompanyComposerTeaser />
            <div className="mt-3">
              <FeedSortBar />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="w-full space-y-4 pb-24">
              <CommunityFeed />
            </div>
          </div>
        </section>

        {/* Rechte Spalte */}
        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-4">
            <CompanyFeedRight />
          </div>
        </aside>
      </div>
    </main>
  );
};

export default CompanyFeed;
