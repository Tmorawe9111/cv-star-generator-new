import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BaseLayout from "@/components/layout/BaseLayout";
import { AppSidebar } from "@/components/AppSidebar";
import BottomNav from "@/components/navigation/BottomNav";
import NewPostComposer from "@/components/community/NewPostComposer";
import { VisibilityPrompt } from "@/components/modals/VisibilityPrompt";
import { VisibilityInfoBanner } from "@/components/modals/VisibilityNudge";
import { useEntryGates } from "@/hooks/useEntryGates";
import { cn } from "@/lib/utils";
import { openVisibilityPrompt } from "@/lib/event-bus";

export function AuthenticatedLayout() {
  const { profile, isLoading, user } = useAuth();
  const location = useLocation();
  const entryGates = useEntryGates();
  const isJobsPage = location.pathname === '/community/jobs' || location.pathname === '/jobs';

  // Trigger entry gates on route change for dashboard/sidebar access
  React.useEffect(() => {
    const isDashboardRoute = location.pathname === '/dashboard' || 
                            location.pathname.startsWith('/talent') ||
                            location.pathname.startsWith('/marketplace') ||
                            location.pathname.startsWith('/notifications');
    
    if (user && isDashboardRoute) {
      entryGates.onNavigate();
    }
  }, [location.pathname, user?.id]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has complete CV profile for dashboard access
  const isDashboardRoute = location.pathname === '/dashboard' || 
                          location.pathname === '/startseite' ||
                          location.pathname === '/mein-bereich';
  
  if (isDashboardRoute && (!profile || !profile.profile_complete)) {
    // Redirect to CV generator if profile is incomplete
    return <Navigate to="/cv-generator" replace />;
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar - Mobile als Overlay, Desktop persistent */}
      <AppSidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Main Content - TopNavBar is now handled by UniversalLayout */}
        <div className={cn("flex-1 p-0 pb-20 md:pb-0", isJobsPage && "mt-0")}>
          {isJobsPage ? (
            <Outlet />
          ) : (
            <BaseLayout>
              <Outlet />
            </BaseLayout>
          )}
        </div>

        {/* BottomNav nur Mobile */}
        <BottomNav />

        {/* Global UI */}
        <VisibilityPrompt />
        <NewPostComposer />
        
        {/* Entry Gates - Address confirmation removed */}

        {entryGates.showVisibilityBanner && (
          <VisibilityInfoBanner onOpen={openVisibilityPrompt} onDismiss={entryGates.closeVisibilityBanner} />
        )}
      </main>
    </div>
  );
}