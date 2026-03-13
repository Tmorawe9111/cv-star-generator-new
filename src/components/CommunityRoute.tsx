/**
 * Shows DarkCommunityPage (marketing) when not logged in,
 * Community app when logged in (with AuthenticatedLayout)
 */
import { useAuth } from '@/hooks/useAuth';
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';

const DarkCommunityPage = lazy(() => import('@/pages/DarkCommunityPage'));
const Community = lazy(() => import('@/pages/Community/Community'));

export default function CommunityRoute() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
        <DarkCommunityPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
      <Routes>
        <Route path="/community" element={<AuthenticatedLayout />}>
          <Route index element={<Community />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
