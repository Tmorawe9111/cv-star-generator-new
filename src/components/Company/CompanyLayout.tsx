import { useEffect, useState } from "react";
import { CompanySidebar } from "@/components/Company/CompanySidebar";
import { CompanyHeader } from "@/components/Company/CompanyHeader";
import { CompanyPortalFooter } from "@/components/Company/CompanyPortalFooter";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import BaseLayout from "@/components/layout/BaseLayout";
import { useCompanyOnboarding } from "@/hooks/useCompanyOnboarding";
import { BrancheSelector } from "@/components/Company/onboarding/BrancheSelector";
import { TargetGroupSelector } from "@/components/Company/onboarding/TargetGroupSelector";
import { PlanSelector } from "@/components/Company/onboarding/PlanSelector";
import { ProfileCompletion } from "@/components/Company/onboarding/ProfileCompletion";
import { FirstJob } from "@/components/Company/onboarding/FirstJob";
import { TeamInvite } from "@/components/Company/onboarding/TeamInvite";
import { WelcomePopup } from "@/components/Company/onboarding/WelcomePopup";
import { supabase } from "@/integrations/supabase/client";
import { ONBOARDING_STEPS } from "@/hooks/useCompanyOnboarding";
import { TokenDepletedModal } from "@/components/Company/TokenDepletedModal";
import { AppleOnboardingModal } from "@/components/Company/onboarding/AppleOnboardingModal";

// Mapping für Branchen-Keys zu lesbaren Namen
const BRANCH_NAMES: Record<string, string> = {
  'handwerk': 'Handwerk',
  'it': 'IT',
  'gesundheit': 'Gesundheit',
  'buero': 'Büro & Verwaltung',
  'verkauf': 'Verkauf & Handel',
  'gastronomie': 'Gastronomie',
  'bau': 'Bau & Architektur',
};

export function CompanyLayout() {
  const { user, isLoading: authLoading } = useAuth();
  const { company, loading: companyLoading, refetch } = useCompany();
  const { loading: onboardingLoading, state, updateStep, completeOnboarding, skipStep } = useCompanyOnboarding();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTokenDepletedModal, setShowTokenDepletedModal] = useState(false);
  const [showAppleOnboarding, setShowAppleOnboarding] = useState(false);

  // Check for pending company signup from magic link
  useEffect(() => {
    const processPendingSignup = async () => {
      if (!user || company) return;
      
      const pendingData = localStorage.getItem('pending_company_signup');
      if (!pendingData) return;

      try {
        const data = JSON.parse(pendingData);
        const { data: companyId, error } = await supabase.rpc('create_company_account', {
          p_name: data.companyName,
          p_primary_email: user.email || '',
          p_city: data.city,
          p_country: data.country,
          p_size_range: data.size,
          p_contact_person: data.contactPerson,
          p_phone: data.phone,
          p_created_by: user.id,
          p_website: data.website || null,
          p_industry: data.industry || null
        });

        if (!error && companyId) {
          // Generate support code
          const { generateSupportCode } = await import('@/lib/support-code');
          const supportCode = await generateSupportCode();
          
          // Update with plan info, support code, and ensure onboarding is not completed
          await supabase
            .from('companies')
            .update({ 
              selected_plan_id: data.selectedPlan,
              onboarding_completed: false,  // Ensure onboarding is not completed
              support_code: supportCode,
              account_status: 'pending' // Set to pending until admin verifies support code
            })
            .eq('id', companyId);

          // Fire-and-forget Slack notification (magic link signup completion)
          try {
            void supabase.functions.invoke('slack-signup-notify', {
              body: {
                kind: 'company',
                test: false,
                source: 'CompanyLayout.pending_company_signup',
                company: {
                  companyName: data.companyName,
                  industry: data.industry,
                  zip: null,
                  city: data.city,
                  employeeCount: data.size,
                  website: data.website || null,
                  contactPerson: {
                    // We only stored a combined name in localStorage; keep it in firstName for display.
                    firstName: data.contactPerson,
                    lastName: null,
                    email: user.email,
                    phone: data.phone,
                  },
                },
              },
            });
          } catch {
            // ignore
          }
          
          localStorage.removeItem('pending_company_signup');
          await refetch();
        }
      } catch (err) {
        console.error('Error processing pending signup:', err);
      }
    };

    processPendingSignup();
  }, [user, company, refetch]);

  // Check if Apple Onboarding should be shown (new onboarding system)
  useEffect(() => {
    // Wait for company data to be loaded
    if (companyLoading || onboardingLoading) return;
    
    // If no company yet, don't show onboarding
    if (!company) return;

    // Check if onboarding is not completed (explicitly check for false or null)
    const shouldShow = company.onboarding_completed === false || company.onboarding_completed === null;
    
    if (shouldShow) {
      // Small delay to ensure page is fully loaded and rendered
      const timer = setTimeout(() => {
        setShowAppleOnboarding(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // If onboarding is completed, ensure modal is closed
      setShowAppleOnboarding(false);
    }
  }, [company, companyLoading, onboardingLoading, company?.onboarding_completed]);

  // Check if tokens are depleted and show modal
  useEffect(() => {
    if (company && (company.active_tokens === null || company.active_tokens <= 0)) {
      // Only show if onboarding is complete (don't interrupt onboarding)
      if (state.isComplete && !showAppleOnboarding) {
        // Small delay to avoid showing immediately on page load
        const timer = setTimeout(() => {
          setShowTokenDepletedModal(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [company?.active_tokens, state.isComplete, showAppleOnboarding]);

  // Show loading state
  if (authLoading || companyLoading || onboardingLoading) {
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

  // Redirect to signup if no company
  if (!company) {
    return <Navigate to="/unternehmensregistrierung" replace />;
  }

  // Render onboarding popups if not completed
  // Only show if: not completed, no job exists, and has paid plan
  const renderOnboardingPopup = () => {
    if (state.isComplete) return null;
    
    // Additional check: don't show if company has a job or no paid plan
    if (state.firstJobCreated || !state.selectedPlanId || state.selectedPlanId === 'free') {
      return null;
    }

    const totalSteps = 7;
    const handleNext = async (nextStep: number, data?: any, markCompleted = true) => {
      try {
        await updateStep(nextStep as any, data, markCompleted);
      } catch (error) {
        console.error('Error updating step:', error);
      }
    };

    const handleSkip = async (currentStep: number) => {
      await skipStep(currentStep as any);
    };

    switch (state.currentStep) {
      case ONBOARDING_STEPS.BRANCH:
        return (
          <BrancheSelector
            onNext={(industryKey) => {
              // Convert key to readable name for storage
              const industryName = BRANCH_NAMES[industryKey] || industryKey;
              handleNext(ONBOARDING_STEPS.TARGET_GROUPS, { industry: industryName }, true);
            }}
            onSkip={() => handleSkip(ONBOARDING_STEPS.BRANCH)}
            stepNumber={ONBOARDING_STEPS.BRANCH}
            totalSteps={totalSteps}
          />
        );
      case ONBOARDING_STEPS.TARGET_GROUPS:
        return (
          <TargetGroupSelector
            onNext={(targetGroups) => handleNext(ONBOARDING_STEPS.PLAN, { targetGroups }, true)}
            onSkip={() => handleSkip(ONBOARDING_STEPS.TARGET_GROUPS)}
            stepNumber={ONBOARDING_STEPS.TARGET_GROUPS}
            totalSteps={totalSteps}
          />
        );
      case ONBOARDING_STEPS.PLAN:
        return (
          <PlanSelector
            selectedPlanId={state.selectedPlanId}
            onNext={(planKey, interval) => {
              // Save plan selection when proceeding
              handleNext(ONBOARDING_STEPS.PROFILE, { 
                selectedPlanId: planKey, 
                planInterval: interval 
              }, true);
            }}
            onSkip={() => handleSkip(ONBOARDING_STEPS.PLAN)}
            stepNumber={ONBOARDING_STEPS.PLAN}
            totalSteps={totalSteps}
          />
        );
      case ONBOARDING_STEPS.PROFILE:
        return (
          <ProfileCompletion
            onNext={() => handleNext(ONBOARDING_STEPS.FIRST_JOB, undefined, true)}
            onSkip={() => handleSkip(ONBOARDING_STEPS.PROFILE)}
            stepNumber={ONBOARDING_STEPS.PROFILE}
            totalSteps={totalSteps}
          />
        );
      case ONBOARDING_STEPS.FIRST_JOB:
        return (
          <FirstJob
            onNext={() => handleNext(ONBOARDING_STEPS.TEAM_INVITE, undefined, true)}
            onSkip={() => handleSkip(ONBOARDING_STEPS.FIRST_JOB)}
            stepNumber={ONBOARDING_STEPS.FIRST_JOB}
            totalSteps={totalSteps}
            hasJob={state.firstJobCreated}
          />
        );
      case ONBOARDING_STEPS.TEAM_INVITE:
        return (
          <TeamInvite
            onNext={() => handleNext(ONBOARDING_STEPS.WELCOME, undefined, true)}
            onSkip={() => handleSkip(ONBOARDING_STEPS.TEAM_INVITE)}
            stepNumber={ONBOARDING_STEPS.TEAM_INVITE}
            totalSteps={totalSteps}
            hasTeam={state.teamInvited}
          />
        );
      case ONBOARDING_STEPS.WELCOME:
        return (
          <WelcomePopup
            onComplete={completeOnboarding}
            stepNumber={ONBOARDING_STEPS.WELCOME}
            totalSteps={totalSteps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff]">
      <CompanyHeader
        collapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
      />
      <div className="flex flex-1 overflow-hidden">
        <CompanySidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
        <main className="flex-1 overflow-y-auto">
          <BaseLayout>
            <Outlet />
          </BaseLayout>
        </main>
      </div>
      <CompanyPortalFooter />
      {renderOnboardingPopup()}

      {company && (
        <>
          <AppleOnboardingModal
            open={showAppleOnboarding}
            onOpenChange={(open) => {
              setShowAppleOnboarding(open);
              // Mark onboarding as complete when modal is closed (if user completed it)
              if (!open && company) {
                supabase
                  .from('companies')
                  .update({ onboarding_completed: true })
                  .eq('id', company.id)
                  .then(() => refetch());
              }
            }}
          />
          <TokenDepletedModal
            open={showTokenDepletedModal}
            onOpenChange={setShowTokenDepletedModal}
            companyId={company.id}
            context="general"
          />
        </>
      )}
    </div>
  );
}