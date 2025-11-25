import React from 'react';
import CommunityFeed from '@/components/community/CommunityFeed';
import { ComposerTeaser } from '@/components/dashboard/ComposerTeaser';
import FeedSortBar from '@/components/community/FeedSortBar';
import { LeftPanel } from '@/components/dashboard/LeftPanel';
import { RightPanel } from '@/components/dashboard/RightPanel';

const Dashboard = () => {

  return (
    <main className="w-full min-h-dvh pb-[56px] md:pb-0">
      <h1 className="sr-only">Dashboard</h1>
      
      {/* Inhalt direkt unter der Navbar - kompensiere BaseLayout Padding auf Mobile */}
      <div className="-mx-3 sm:-mx-4 md:mx-auto">
        <div className="mx-auto max-w-screen-2xl grid grid-cols-12 gap-0 md:gap-3 lg:gap-6 px-0 md:px-3 lg:px-6">
          
          {/* (1) Left Panel - sticky */}
          <aside
            className="hidden lg:block col-span-3"
            aria-label="Linke Spalte"
          >
            <div className="sticky top-12 md:top-14">
              <LeftPanel />
            </div>
          </aside>

          {/* Main - Center Column */}
          <section className="col-span-12 lg:col-span-9 xl:col-span-6 relative w-full">
            {/* (2) Desktop: ComposerTeaser - nur auf Desktop sichtbar */}
            <div className="hidden md:block mb-3 w-full">
              <ComposerTeaser />
            </div>
            
            {/* (2b) Desktop: FeedSortBar - nur auf Desktop sichtbar */}
            <div className="hidden md:block mb-3 w-full">
              <FeedSortBar />
            </div>
            
            {/* (3) Post-Liste - direkt ohne Padding nach oben */}
            <div className="space-y-1 md:space-y-2 relative z-10 w-full" role="feed">
              <CommunityFeed />
            </div>
          </section>

          {/* (4) Right Panel - teilweise sticky */}
          <aside
            className="hidden xl:block col-span-3"
            aria-label="Rechte Spalte"
          >
            <RightPanel />
          </aside>
        </div>
      </div>

      
      {/* NewPostComposer is in AuthenticatedLayout - no need here */}
    </main>
  );
};

export default Dashboard;
