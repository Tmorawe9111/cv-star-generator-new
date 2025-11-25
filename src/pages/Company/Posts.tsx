import React from 'react';
import CommunityFeed from '@/components/community/CommunityFeed';
import FeedSortBar from '@/components/community/FeedSortBar';
import CompanyComposerTeaser from '@/components/dashboard/CompanyComposerTeaser';
import CompanyFeedLeft from '@/components/Company/feed/CompanyFeedLeft';
import CompanyFeedRight from '@/components/Company/feed/CompanyFeedRight';

const CompanyPosts: React.FC = () => {
  return (
    <main className="w-full overflow-x-hidden">
      <h1 className="sr-only">Unternehmens‑Community</h1>
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 lg:gap-6">
          {/* Linke Spalte */}
          <aside className="hidden lg:block w-[280px] xl:w-[320px] shrink-0">
            <div className="sticky top-20 space-y-4">
              <CompanyFeedLeft />
            </div>
          </aside>

          {/* Mitte - Community Feed */}
          <section className="flex-1 min-w-0">
            <div className="w-full space-y-4">
              {/* Company Composer */}
              <CompanyComposerTeaser />
              
              {/* Feed Sort Bar */}
              <div className="my-2">
                <FeedSortBar />
              </div>
              
              {/* Community Feed - zeigt alle Posts (User + Company) */}
              <CommunityFeed />
            </div>
          </section>

          {/* Rechte Spalte */}
          <aside className="hidden xl:block w-[320px] shrink-0">
            <div className="sticky top-20 space-y-4">
              <CompanyFeedRight />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default CompanyPosts;