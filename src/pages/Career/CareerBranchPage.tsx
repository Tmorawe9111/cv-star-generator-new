import { useLocation, Navigate } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { SEOHead } from '@/components/seo/SEOHead';
import { getBranchByPath } from '@/config/careerBranches';
import CareerBranchLandingPage from '@/components/career/CareerBranchLandingPage';

/**
 * Dynamische Karriere-Unterseite für jede Branche.
 * Routen: /karriere/pflege, /karriere/pflege/funktionsdienste, /karriere/handwerk,
 *         /karriere/industriemechaniker, /karriere/buromanagement, /karriere/ausbildung
 */
export default function CareerBranchPage() {
  const { pathname } = useLocation();
  const branch = getBranchByPath(pathname);

  if (!branch) {
    return <Navigate to="/" replace />;
  }

  const seoData = useSEO({
    title: branch.seoTitle,
    description: branch.seoDescription,
    keywords: branch.seoKeywords,
  });

  return (
    <>
      <SEOHead {...seoData} />
      <CareerBranchLandingPage branch={branch} />
    </>
  );
}
