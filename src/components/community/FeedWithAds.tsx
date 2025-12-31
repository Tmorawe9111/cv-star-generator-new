import React from 'react';
import { CommunityFeed } from './CommunityFeed';
import { AdSpace } from './AdSpace';
import { useAdLinks } from '@/hooks/useAdLinks';
import { cn } from '@/lib/utils';

/**
 * Community Feed with Advertisement Spaces
 * Displays ads on left and right side of the feed
 */
export const FeedWithAds: React.FC = () => {
  const { links: leftAds, loading: leftLoading } = useAdLinks('left');
  const { links: rightAds, loading: rightLoading } = useAdLinks('right');

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left Ad Space - Hidden on mobile, visible on large screens */}
        <aside className="hidden lg:block lg:col-span-2">
          <div className="sticky top-4">
            {!leftLoading && leftAds.length > 0 && (
              <AdSpace
                links={leftAds}
                title="Werbung"
                position="left"
                variant="compact"
                className="mb-4"
              />
            )}
          </div>
        </aside>

        {/* Main Feed */}
        <main className="lg:col-span-8">
          <CommunityFeed />
        </main>

        {/* Right Ad Space - Hidden on mobile, visible on large screens */}
        <aside className="hidden lg:block lg:col-span-2">
          <div className="sticky top-4">
            {!rightLoading && rightAds.length > 0 && (
              <AdSpace
                links={rightAds}
                title="Werbung"
                position="right"
                variant="default"
                className="mb-4"
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

