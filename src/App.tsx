import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { CVGeneratorGate } from "@/components/CVGeneratorGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, lazy, Suspense } from "react";
import { useSupabaseInit } from "@/hooks/useSupabaseInit";
import TopNavBar from "@/components/navigation/TopNavBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReferralTracker } from "@/components/ReferralTracker";

// Critical pages - loaded immediately for landing page
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

// Landing Page
const BeVisiblleLandingPage = lazy(() => import("@/components/landing/BeVisiblleLandingPage"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const CompanyLanding = lazy(() => import("./pages/CompanyLanding"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Gesundheitswesen = lazy(() => import("./pages/Gesundheitswesen"));

// CV Creation Flows
const CVFlowSelector = lazy(() => import("@/components/cv-creation/CVFlowSelector"));
const VoiceFlowContainer = lazy(() => import("@/components/cv-creation/flows/VoiceFlow/VoiceFlowContainer"));
const ChatFlowContainer = lazy(() => import("@/components/cv-creation/flows/ChatFlow/ChatFlowContainer"));

// Lazy load non-critical pages to reduce initial bundle size
const Blog = lazy(() => import("./pages/Blog"));
const BlogArchive = lazy(() => import("./pages/BlogArchive"));
const BlogPostDetail = lazy(() => import("./pages/BlogPostDetail"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const Help = lazy(() => import("./pages/Help"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Support = lazy(() => import("./pages/Support"));
const Kontakt = lazy(() => import("./pages/Kontakt"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Unternehmen = lazy(() => import("./pages/Unternehmen"));
const CompanyLandingPage = lazy(() => import("@/components/marketing/CompanyLandingPage"));
const ProfileCreationFlow = lazy(() => import("@/components/profile-creation/ProfileCreationFlow"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Impressum = lazy(() => import("./pages/Impressum"));
const AGB = lazy(() => import("./pages/AGB"));
const Talent = lazy(() => import("./pages/Talent"));
const CVGenerator = lazy(() => import("./components/CVGenerator"));
const CVPrintPage = lazy(() => import("./pages/cv/CVPrintPage"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ValuesOnboarding = lazy(() => import("./pages/onboarding/ValuesOnboarding"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Settings = lazy(() => import("./pages/Settings"));
const BaseLayout = lazy(() => import("@/components/layout/BaseLayout"));
const DiscoverAzubis = lazy(() => import("./pages/DiscoverAzubis"));
const DiscoverCompaniesPage = lazy(() => import("./pages/DiscoverCompanies"));
const CompaniesSearch = lazy(() => import("./pages/CompaniesSearch"));
const ProduktAzubis = lazy(() => import("./pages/ProduktAzubis"));
const ProduktUnternehmen = lazy(() => import("./pages/ProduktUnternehmen"));
const CommunityContacts = lazy(() => import("./pages/Community/Contacts"));
const CommunityCompanies = lazy(() => import("./pages/Community/Companies"));
const CommunityMessages = lazy(() => import("./pages/Community/Messages"));
const CommunityJobs = lazy(() => import("./pages/Community/Jobs"));
const Community = lazy(() => import("./pages/Community/Community"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const MyCareer = lazy(() => import("./pages/MyCareer"));

// Company components - lazy loaded
const CompanyLayout = lazy(() => import("@/components/Company/CompanyLayout").then(m => ({ default: m.CompanyLayout })));
const CompanyOnboarding = lazy(() => import('@/pages/Company/Onboarding'));
const CompanySignup = lazy(() => import('@/pages/signup/CompanySignup'));
const AppleOnboardingWizard = lazy(() => import('@/components/Company/onboarding/AppleOnboardingWizard').then(m => ({ default: m.AppleOnboardingWizard })));
const CompanyDashboard = lazy(() => import("./pages/Company/CompanyDashboard"));
const CompanyProfile = lazy(() => import("./pages/Company/Profile"));
const CompanySearch = lazy(() => import("./pages/Company/Search"));
const CompanyAnalytics = lazy(() => import("./pages/Company/Analytics"));
const CompanyNotifications = lazy(() => import("./pages/Company/Notifications"));
const CompanySettings = lazy(() => import("./pages/Company/Settings"));
const CompanySettingsLocations = lazy(() => import("./pages/Company/SettingsLocations"));
const CompanySettingsProducts = lazy(() => import("./pages/Company/SettingsProducts"));
const CompanySettingsTeam = lazy(() => import("./pages/Company/SettingsTeam"));
const CompanySettingsNotifications = lazy(() => import("./pages/Company/SettingsNotifications"));
const CompanySettingsIntegrations = lazy(() => import("./pages/Company/SettingsIntegrations"));
const CompanySettingsSecurity = lazy(() => import("./pages/Company/SettingsSecurity"));
const CompanySettingsMatchingTargets = lazy(() => import("./pages/Company/SettingsMatchingTargets"));
const CompanyRoleGate = lazy(() => import("@/components/Company/CompanyRoleGate").then(m => ({ default: m.CompanyRoleGate })));
const CompanyPosts = lazy(() => import("./pages/Company/Posts"));
const CompanyProfileView = lazy(() => import("./pages/Company/ProfileView"));
const CandidateHistory = lazy(() => import("./pages/Company/CandidateHistory"));
const CompanyBilling = lazy(() => import("./pages/Company/Billing"));
const CompanyBillingV2 = lazy(() => import("./pages/Company/BillingV2"));
const CompanyUnlocked = lazy(() => import("./pages/Company/Unlocked"));
const CompanyComingSoon = lazy(() => import("./pages/Company/ComingSoon"));
const CompanyFeed = lazy(() => import("./pages/Company/Feed"));
const CompanyMatchList = lazy(() => import("./pages/Company/CompanyMatchList"));
const CompanyMatchesPage = lazy(() => import("./pages/Company/Matches"));
const CandidatesPipelinePage = lazy(() => import("./pages/Company/CandidatesPipeline"));
const MatchingProfilePage = lazy(() => import("./pages/Company/MatchingProfile"));
const CompanyNeeds = lazy(() => import("./pages/Company/Needs"));
const CompanyJobsList = lazy(() => import("./pages/Company/JobsListNew"));
const JobCreate = lazy(() => import("./pages/Company/JobCreate"));
const JobEdit = lazy(() => import("./pages/Company/JobEdit"));
const JobDetail = lazy(() => import("./pages/Company/JobDetail"));
const JobAdBuilder = lazy(() => import("./pages/Company/JobAdBuilder"));
const PublicJobDetail = lazy(() => import("./pages/Jobs/PublicJobDetail"));
const PublicJobDetailPage = lazy(() => import("./pages/Jobs/PublicJobDetailPage"));

// Admin components - lazy loaded
const AdminLayout = lazy(() => import("./pages/Admin/AdminLayout"));
const PagesList = lazy(() => import("./pages/Admin/PagesList"));
const PageEditor = lazy(() => import("./pages/Admin/PageEditor"));
const SeoInsights = lazy(() => import("./pages/Admin/SeoInsights"));
const ScheduledPosts = lazy(() => import("./pages/Admin/ScheduledPosts"));
const AdminSettings = lazy(() => import("./pages/Admin/AdminSettings"));
const PublicPage = lazy(() => import("./pages/PublicPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfile"));
const PublicCompanyView = lazy(() => import("./pages/Companies/PublicCompanyView"));
const PublicCompanyViewNew = lazy(() => import("./pages/Companies/PublicCompanyViewNew"));

// Career Hubs - SEO Landing Pages
const PflegeHub = lazy(() => import("./pages/Career/PflegeHub"));
const HandwerkHub = lazy(() => import("./pages/Career/HandwerkHub"));
const IndustrieHub = lazy(() => import("./pages/Career/IndustrieHub"));
const CareerHubDetail = lazy(() => import("./pages/Career/CareerHubDetail"));
const Overview = lazy(() => import("./pages/Admin/Overview"));
const UsersPage = lazy(() => import("./pages/Admin/Users"));
const CompaniesPage = lazy(() => import("./pages/Admin/Companies"));
const PlansPage = lazy(() => import("./pages/Admin/Plans"));
const PlanManagement = lazy(() => import("./pages/Admin/PlanManagement"));
const JobsPage = lazy(() => import("./pages/Admin/Jobs"));
const MatchesPage = lazy(() => import("./pages/Admin/Matches"));
const AnalyticsPage = lazy(() => import("./pages/Admin/Analytics"));
const UserAnalyticsPage = lazy(() => import("./pages/Admin/UserAnalytics"));
const CompanyAnalyticsPage = lazy(() => import("./pages/Admin/CompanyAnalytics"));
const ContentPage = lazy(() => import("./pages/Admin/Content"));
const BlogList = lazy(() => import("./pages/Admin/BlogList"));
const BlogEditor = lazy(() => import("./pages/Admin/BlogEditor"));
const BlogBulkUpload = lazy(() => import("./pages/Admin/BlogBulkUpload"));
const BulkImport = lazy(() => import("./pages/Admin/BulkImport"));
const SupportPage = lazy(() => import("./pages/Admin/Support"));
const AdminTools = lazy(() => import("./pages/Admin/Tools"));
const AdminAuthGate = lazy(() => import("@/components/admin/AdminAuthGate"));
const CreateAdmin = lazy(() => import("./pages/Admin/CreateAdmin"));
const AdminLogin = lazy(() => import("./pages/Admin/Login"));
const PendingVerifications = lazy(() => import("./pages/Admin/PendingVerifications"));
const Advertisements = lazy(() => import("./pages/Admin/Advertisements"));
const ReferralAnalytics = lazy(() => import("./pages/Admin/ReferralAnalytics"));
const CreatorManagement = lazy(() => import("./pages/Admin/CreatorManagement"));
const ReferralRedirect = lazy(() => import("./pages/ReferralRedirect"));
const SocialRedirect = lazy(() => import("./pages/SocialRedirect"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 Minuten - Daten sind 2 Min "frisch"
      gcTime: 5 * 60 * 1000, // 5 Minuten - Cache bleibt 5 Min erhalten
      refetchOnWindowFocus: false, // Kein Refetch beim Tab-Wechsel
      refetchOnMount: false, // Kein Refetch beim Remount wenn Daten noch fresh sind
      retry: 1, // Nur 1 Retry bei Fehlern
    },
  },
});
const FEATURE_BILLING_V2 = import.meta.env.NEXT_PUBLIC_FEATURE_BILLING_V2 === "1";

// Helper to check if user is a company
function useIsCompanyUser() {
  const { user } = useAuth();
  return user?.user_metadata?.is_company === true || user?.user_metadata?.is_company === "true";
}

// Protected route for company pages - blocks regular users
function CompanyProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkCompanyAccess() {
      if (authLoading) return;

      if (!user) {
        setUserType('not_company');
        setIsLoading(false);
        return;
      }

      const hasIsCompanyMeta =
        user.user_metadata?.is_company === true ||
        user.user_metadata?.is_company === "true";

      if (hasIsCompanyMeta) {
        setUserType("company");
      } else {
        setUserType("not_company");
      }
      setIsLoading(false);
    }

    checkCompanyAccess();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ⛔️ HARTE SPERRE: Normale User werden zum Feed umgeleitet
  if (userType !== 'company') {
    console.log('🚫 User tried to access company area - redirecting to /feed');
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}

// Protected route for user pages - blocks company users
function UserProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [isCompany, setIsCompany] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsCompany(false);
      setIsLoading(false);
      return;
    }

    const hasIsCompanyMeta =
      user.user_metadata?.is_company === true ||
      user.user_metadata?.is_company === "true";

    setIsCompany(hasIsCompanyMeta);
    setIsLoading(false);
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ⛔️ HARTE SPERRE: Companies werden zum Dashboard umgeleitet
  if (isCompany) {
    console.log('🚫 Company tried to access user area - redirecting to /unternehmen/startseite');
    return <Navigate to="/unternehmen/startseite" replace />;
  }

  return <>{children}</>;
}

// Layout wrapper that conditionally shows TopNavBar
function LayoutContent({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const isCompanyRoute = (location.pathname.startsWith('/company/') || location.pathname.startsWith('/unternehmen/')) && 
                         location.pathname !== '/unternehmensregistrierung' && 
                         location.pathname !== '/unternehmensregistrierung';
  const isLandingPage = location.pathname === '/';
  const isAuthRoute = location.pathname === '/auth' || location.pathname === '/anmelden';
  const isCvRoute = location.pathname.startsWith('/cv-generator') || 
                    location.pathname.startsWith('/cv-layout-selector') ||
                    location.pathname.startsWith('/lebenslauf') ||
                    location.pathname === '/registrieren';
  const isLegalRoute = ['/impressum','/datenschutz','/agb','/ueber-uns'].includes(location.pathname);
  const isJobsPage = location.pathname === '/community/jobs' || location.pathname === '/jobs' || location.pathname === '/stellenangebote' || location.pathname.startsWith('/stelle/') || location.pathname.startsWith('/jobs/');
  
  // Show TopNavBar ONLY in the portal (app) sections, not on marketing/login/landing
  const portalPrefixes = [
    '/dashboard',
    '/startseite',
    '/mein-bereich',
    '/marketplace',
    '/community',
    '/notifications',
    '/benachrichtigungen',
    '/settings',
    '/einstellungen',
    '/profile',
    '/profil',
    '/companies',
    '/firmen',
    '/entdecken',
    '/u/',
    '/@',
    // Jobs routes removed - they show LandingHeader for public, TopNavBar for authenticated users
    // '/jobs',
    // '/stellenangebote',
    // '/stelle/',
    '/firma/',
    '/foryou',
    '/feed',
    '/meine-karriere',
    '/bewerbungen'
  ];
  const isPortalRoute = portalPrefixes.some(p => location.pathname.startsWith(p));
  
  // For authenticated users on job routes, show TopNavBar (they're in the portal)
  // For non-authenticated users on job routes, show LandingHeader instead (handled in component)
  const isAuthenticatedJobRoute = user && isJobsPage;
  
  const showTopNav = (isPortalRoute || isAuthenticatedJobRoute) && !isLegalRoute && !isLandingPage && !isAuthRoute && !isCvRoute;
  
  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Referral Tracking - tracks UTM parameters and referral links */}
      <ReferralTracker />
      
      {/* TopNavBar conditionally rendered */}
      {showTopNav && <TopNavBar />}
      
      {/* Main content area with conditional background and padding */}
      <div className={
        isLandingPage 
          ? "flex-1 bg-black" 
          : isCompanyRoute 
            ? "flex-1 bg-white" 
            : showTopNav && !isJobsPage
              ? "flex-1 pt-12 md:pt-14 bg-white"
              : "flex-1 bg-white"
      }>
        {children}
      </div>
    </div>
  );
}

// Universal layout wrapper
function UniversalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}

const App = () => {
  const { isInitialized, error } = useSupabaseInit();

  // Show loading screen until Supabase is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show error screen only for critical errors (not timeouts)
  // Timeouts are handled gracefully and don't block the app
  if (error && !error.includes('timeout') && !error.includes('aborted')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h1 className="text-xl font-semibold mb-2">Verbindungsfehler</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <UniversalLayout>
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BeVisiblleLandingPage /></Suspense>} />
              
              {/* Marketing Landing Pages */}
              <Route path="/Gesundheitswesen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Gesundheitswesen /></Suspense>} />
              
              {/* Auth - German routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/anmelden" element={<Auth />} />
              
              {/* Referral Links - Kurze, saubere URLs */}
              <Route path="/ref/:code" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ReferralRedirect /></Suspense>} />
              
              {/* Social Media Links - Instagram & Facebook Creator Tracking */}
              <Route path="/ig/:creator" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><SocialRedirect /></Suspense>} />
              <Route path="/instagram/:creator" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><SocialRedirect /></Suspense>} />
              <Route path="/fb/:creator" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><SocialRedirect /></Suspense>} />
              <Route path="/facebook/:creator" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><SocialRedirect /></Suspense>} />
              
              {/* Registration / CV Generator - All lead to same destination */}
              <Route path="/registrieren" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CVGeneratorGate><CVGenerator /></CVGeneratorGate></Suspense>} />
              <Route path="/lebenslauf-erstellen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CVGeneratorGate><CVGenerator /></CVGeneratorGate></Suspense>} />
              <Route path="/lebenslaufgenerator" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CVGeneratorGate><CVGenerator /></CVGeneratorGate></Suspense>} />
              
              {/* Company Registration - German */}
              <Route path="/unternehmensregistrierung" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySignup /></Suspense>} />
              
              {/* Backup Routes */}
              <Route path="/cv-star" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}><BaseLayout className="bg-black text-white"><Index /></BaseLayout></Suspense>} />
              <Route path="/company-advanced" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyOnboarding /></Suspense>} />
              <Route path="/company/onboarding/apple" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><AppleOnboardingWizard /></Suspense>} />
              <Route path="/blog" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Blog /></Suspense>} />
              <Route path="/blog/archive" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BlogArchive /></Suspense>} />
              <Route path="/blog/:slug" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BlogPostDetail /></Suspense>} />
              <Route path="/sitemap.xml" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Sitemap /></Suspense>} />
              <Route path="/hilfe" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Help /></Suspense>} />
              <Route path="/faq" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><FAQ /></Suspense>} />
              <Route path="/support" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Support /></Suspense>} />
              <Route path="/p/:slug" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PublicPage /></Suspense>} />
              <Route path="/unternehmen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Unternehmen /></Suspense>} />
              <Route path="/company" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyLanding /></Suspense>} />
              <Route path="/features" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><Unternehmen /></BaseLayout></Suspense>} />
              <Route path="/produkt" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><Unternehmen /></BaseLayout></Suspense>} />
              <Route path="/kontakt" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Kontakt /></Suspense>} />
              <Route path="/feedback" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Feedback /></Suspense>} />
              <Route path="/ueber-uns" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><AboutUs /></Suspense>} />
              <Route path="/about" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><AboutUs /></Suspense>} />
              <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="/onboarding" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><ProfileCreationFlow /></BaseLayout></Suspense>} />
              <Route path="/unternehmen/onboarding" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyOnboarding /></Suspense>} />
              <Route path="/unternehmensregistrierung" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySignup /></Suspense>} />
              <Route path="/signup/company" element={<Navigate to="/unternehmensregistrierung" replace />} />
              <Route path="/talent" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><Talent /></BaseLayout></Suspense>} />
              <Route path="/datenschutz" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Datenschutz /></Suspense>} />
              <Route path="/impressum" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Impressum /></Suspense>} />
              <Route path="/agb" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><AGB /></Suspense>} />
              <Route path="/produkt/azubis" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ProduktAzubis /></Suspense>} />
              <Route path="/produkt/unternehmen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ProduktUnternehmen /></Suspense>} />
              <Route path="/bootstrap/create-admin" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><CreateAdmin /></BaseLayout></Suspense>} />
              
              {/* New CV Creation Flows */}
              <Route path="/cv-erstellen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CVFlowSelector /></Suspense>} />
              <Route path="/cv-erstellen/voice" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><VoiceFlowContainer /></Suspense>} />
              <Route path="/cv-erstellen/chat" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ChatFlowContainer /></Suspense>} />
              
              {/* Lebenslauf Generator - Open for everyone, but validates complete profiles */}
              <Route path="/cv-generator" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CVGeneratorGate><CVGenerator /></CVGeneratorGate></Suspense>} />
              <Route path="/cv-layout-selector" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CVGeneratorGate><CVGenerator /></CVGeneratorGate></Suspense>} />
              <Route path="/Lebenslauferstellen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CVGeneratorGate><CVGenerator /></CVGeneratorGate></Suspense>} />
              <Route path="/cv/print" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CVPrintPage /></Suspense>} />
              
              
              {/* Company signup route */}
              <Route path="/unternehmensregistrierung" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySignup /></Suspense>} />
              <Route path="/signup/company" element={<Navigate to="/unternehmensregistrierung" replace />} />
              
              {/* Redirect old onboarding to signup */}
              <Route path="/company/onboarding" element={<Navigate to="/unternehmensregistrierung" replace />} />

              {/* German Company routes - Primary */}
              <Route
                path="/unternehmen/*"
                element={
                  <CompanyProtectedRoute>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <CompanyLayout />
                    </Suspense>
                  </CompanyProtectedRoute>
                }
              >
                <Route path="startseite" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyDashboard /></Suspense>} />
                <Route path="profil" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyProfile /></Suspense>} />
                <Route path="analytics" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyAnalytics /></Suspense>} />
                <Route path="kandidatensuche" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySearch /></Suspense>} />
                <Route path="matching" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyMatchesPage /></Suspense>} />
                <Route path="freigeschaltet" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyUnlocked /></Suspense>} />
                <Route path="abrechnung" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyBillingV2 /></Suspense>} />
                <Route path="benachrichtigungen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyNotifications /></Suspense>} />
                <Route path="einstellungen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettings /></Suspense>} />
                <Route path="einstellungen/standorte" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsLocations /></Suspense>} />
                <Route path="einstellungen/produkte" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsProducts /></Suspense>} />
                <Route path="einstellungen/team" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsTeam /></Suspense>} />
                <Route path="einstellungen/benachrichtigungen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsNotifications /></Suspense>} />
                <Route path="einstellungen/integrationen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsIntegrations /></Suspense>} />
                <Route path="einstellungen/sicherheit" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsSecurity /></Suspense>} />
                <Route path="einstellungen/matching-targets" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsMatchingTargets /></Suspense>} />
                <Route path="beitraege" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyPosts /></Suspense>} />
                <Route path="feed" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyFeed /></Suspense>} />
                <Route path="profil/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyProfileView /></Suspense>} />
                <Route path="profil/:id/historie" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CandidateHistory /></Suspense>} />
                <Route
                  path="anforderungen"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <CompanyRoleGate allow={["owner","admin","recruiter","viewer"]}>
                        <CompanyNeeds />
                      </CompanyRoleGate>
                    </Suspense>
                  }
                />
                <Route
                  path="bewerber/pipeline"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <CompanyRoleGate allow={["owner","admin","recruiter","viewer"]}>
                        <CandidatesPipelinePage />
                      </CompanyRoleGate>
                    </Suspense>
                  }
                />
                <Route path="bewerber/gespeichert" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route
                  path="stellenanzeigen"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <CompanyRoleGate allow={["owner","admin","recruiter","viewer"]}>
                        <CompanyJobsList />
                      </CompanyRoleGate>
                    </Suspense>
                  }
                />
                <Route path="stellenanzeigen/neu" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><JobCreate /></Suspense>} />
                <Route path="stellenanzeigen/:id/bearbeiten" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><JobEdit /></Suspense>} />
                <Route path="stellenanzeigen/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><JobDetail /></Suspense>} />
                <Route path="statistiken/aufrufe" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="statistiken/reichweite" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="hilfe/center" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="hilfe/support" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
              </Route>

              {/* English Company routes - Fallback */}
              <Route
                path="/company/*"
                element={
                  <CompanyProtectedRoute>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <CompanyLayout />
                    </Suspense>
                  </CompanyProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyDashboard /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyProfile /></Suspense>} />
                <Route path="analytics" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyAnalytics /></Suspense>} />
                <Route path="search" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySearch /></Suspense>} />
                <Route path="unlocked" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyUnlocked /></Suspense>} />
                <Route path="billing" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyBilling /></Suspense>} />
                <Route
                  path="billing-v2"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <CompanyBillingV2 />
                    </Suspense>
                  }
                />
                <Route path="notifications" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyNotifications /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettings /></Suspense>} />
                <Route path="matching-profile" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><MatchingProfilePage /></Suspense>} />
                <Route path="posts" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyPosts /></Suspense>} />
                <Route path="feed" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyFeed /></Suspense>} />
                <Route path="profile/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyProfileView /></Suspense>} />
                <Route path="profile/:id/history" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CandidateHistory /></Suspense>} />

                <Route path="needs" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyNeeds /></Suspense>} />
                <Route path="candidates/pipeline" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CandidatesPipelinePage /></Suspense>} />
                <Route path="candidates/saved" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="candidates/token-history" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />

                <Route path="community/groups" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="community/events" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />

                <Route path="media/photos" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="media/videos" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />

                <Route path="jobs" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyJobsList /></Suspense>} />
                <Route path="jobs/new" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><JobCreate /></Suspense>} />
                <Route path="jobs/builder" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><JobAdBuilder /></Suspense>} />
                <Route path="jobs/:id/edit" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><JobEdit /></Suspense>} />
                <Route path="jobs/:id/applicants" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="jobs/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><JobDetail /></Suspense>} />

                <Route path="insights/views" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="insights/reach" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="insights/engagement" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="insights/followers" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />

                <Route path="settings/locations" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsLocations /></Suspense>} />
                <Route path="settings/products" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsProducts /></Suspense>} />
                <Route path="settings/team" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsTeam /></Suspense>} />
                <Route path="settings/notifications" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsNotifications /></Suspense>} />
                <Route path="settings/integrations" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsIntegrations /></Suspense>} />
                <Route path="settings/security" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsSecurity /></Suspense>} />
                <Route path="settings/matching-targets" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanySettingsMatchingTargets /></Suspense>} />

                <Route path="help/center" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="help/support" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                <Route path="help/feedback" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyComingSoon /></Suspense>} />
                
                {/* Company Matching Routes */}
              </Route>

              {/* Public Jobs Routes - German + Fallback */}
              <Route path="/stellenangebote" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityJobs /></Suspense>} />
              <Route path="/stelle/:slug" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PublicJobDetailPage /></Suspense>} />
              <Route path="/jobs" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityJobs /></Suspense>} />
              <Route path="/jobs/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PublicJobDetailPage /></Suspense>} />
              
              {/* Public Company Profiles - German vanity URL + UUID fallback */}
              <Route path="/firma/:slug" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PublicCompanyViewNew /></Suspense>} />
              <Route path="/firmen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompaniesSearch /></Suspense>} />
              
              {/* Public User Profiles - Vanity URL + UUID fallback */}
              {/* These routes are accessible to both regular users and company users */}
              <Route path="/@:username" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><UserProfilePage /></Suspense>} />
              <Route path="/profil/:username" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><UserProfilePage /></Suspense>} />
              <Route path="/u/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><UserProfilePage /></Suspense>} />
              
              {/* Authenticated USER routes - German + English fallbacks */}
              {/* ⛔️ Companies are blocked from these routes via UserProtectedRoute */}
              <Route element={<UserProtectedRoute><AuthenticatedLayout /></UserProtectedRoute>}>
                {/* Values Onboarding */}
                <Route path="/onboarding/values" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ValuesOnboarding /></Suspense>} />
                {/* Profile - German primary */}
                <Route path="/profil" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Profile /></Suspense>} />
                <Route path="/profile" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Profile /></Suspense>} />
                
                {/* Dashboard - German primary */}
                <Route path="/mein-bereich" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Dashboard /></Suspense>} />
                <Route path="/startseite" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Dashboard /></Suspense>} />
                <Route path="/dashboard" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Dashboard /></Suspense>} />
                
                <Route path="/marketplace" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Marketplace /></Suspense>} />
                <Route path="/companies/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PublicCompanyViewNew /></Suspense>} />
                
                {/* Community */}
                <Route path="/community" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Community /></Suspense>} />
                <Route path="/community/contacts" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityContacts /></Suspense>} />
                <Route path="/community/kontakte" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityContacts /></Suspense>} />
                <Route path="/community/companies" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityCompanies /></Suspense>} />
                <Route path="/community/firmen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityCompanies /></Suspense>} />
                <Route path="/community/messages" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityMessages /></Suspense>} />
                <Route path="/community/nachrichten" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityMessages /></Suspense>} />
                <Route path="/community/jobs" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityJobs /></Suspense>} />
                <Route path="/community/stellen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CommunityJobs /></Suspense>} />
                
                {/* Notifications - German */}
                <Route path="/benachrichtigungen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><NotificationsPage /></Suspense>} />
                <Route path="/notifications" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><NotificationsPage /></Suspense>} />
                
                {/* Career */}
                <Route path="/meine-karriere" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><MyCareer /></Suspense>} />
                <Route path="/bewerbungen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><MyCareer /></Suspense>} />
                
                <Route path="/companies" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompaniesSearch /></Suspense>} />
                
                {/* Settings - German */}
                <Route path="/einstellungen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Settings /></Suspense>} />
                <Route path="/settings" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Settings /></Suspense>} />
                
                <Route path="/entdecken/azubis" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><DiscoverAzubis /></Suspense>} />
                <Route path="/entdecken/unternehmen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><DiscoverCompaniesPage /></Suspense>} />
              </Route>

              {/* Admin Login - separate route without AdminAuthGate */}
              <Route path="/admin/login" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><AdminLogin /></Suspense>} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><AdminLayout /></Suspense>}>
                <Route index element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Overview /></Suspense>} />
                <Route path="users" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><UsersPage /></Suspense>} />
                <Route path="companies" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompaniesPage /></Suspense>} />
                <Route path="plans" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PlansPage /></Suspense>} />
                <Route path="plans/manage" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PlanManagement /></Suspense>} />
                <Route path="jobs" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><JobsPage /></Suspense>} />
                <Route path="matches" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><MatchesPage /></Suspense>} />
                <Route path="analytics" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><AnalyticsPage /></Suspense>} />
                <Route path="user-analytics" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><UserAnalyticsPage /></Suspense>} />
                <Route path="company-analytics" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CompanyAnalyticsPage /></Suspense>} />
                <Route path="content" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ContentPage /></Suspense>} />
                <Route path="blog" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BlogList /></Suspense>} />
                <Route path="blog/new" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BlogEditor /></Suspense>} />
                <Route path="blog/edit/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BlogEditor /></Suspense>} />
                <Route path="blog/bulk-upload" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BlogBulkUpload /></Suspense>} />
                <Route path="bulk-import" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BulkImport /></Suspense>} />
                {/* Legacy content routes remain accessible */}
                <Route path="pages" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PagesList /></Suspense>} />
                <Route path="pages/new" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PageEditor /></Suspense>} />
                <Route path="pages/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PageEditor /></Suspense>} />
                <Route path="seo" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><SeoInsights /></Suspense>} />
                <Route path="scheduled" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ScheduledPosts /></Suspense>} />
                <Route path="tools" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><AdminTools /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><AdminSettings /></Suspense>} />
                <Route path="pending-verifications" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><PendingVerifications /></Suspense>} />
                <Route path="advertisements" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><Advertisements /></Suspense>} />
                <Route path="referral-analytics" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ReferralAnalytics /></Suspense>} />
                <Route path="creators" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><CreatorManagement /></Suspense>} />
              </Route>
                
              {/* Legacy redirects - English to German */}
              <Route path="/company-dashboard" element={<Navigate to="/unternehmen/startseite" replace />} />
              <Route path="/signup" element={<Navigate to="/registrieren" replace />} />
              <Route path="/login" element={<Navigate to="/anmelden" replace />} />
              
              {/* Marketing page redirects */}
              <Route path="/fuer-unternehmen" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><CompanyLandingPage /></BaseLayout></Suspense>} />
              <Route path="/fuer-bewerber" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><Talent /></BaseLayout></Suspense>} />
              
              {/* Career Hubs - SEO Landing Pages (Deutsche URLs) */}
              <Route path="/karriere/pflege" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><PflegeHub /></BaseLayout></Suspense>} />
              <Route path="/karriere/handwerk" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><HandwerkHub /></BaseLayout></Suspense>} />
              <Route path="/karriere/industrie" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><IndustrieHub /></BaseLayout></Suspense>} />
              
              {/* Career Hub Details - Zielgruppen-spezifisch */}
              <Route path="/karriere/pflege/:audience" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><CareerHubDetail industry="pflege" /></BaseLayout></Suspense>} />
              <Route path="/karriere/handwerk/:audience" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><CareerHubDetail industry="handwerk" /></BaseLayout></Suspense>} />
              <Route path="/karriere/industrie/:audience" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><BaseLayout><CareerHubDetail industry="industrie" /></BaseLayout></Suspense>} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </UniversalLayout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
