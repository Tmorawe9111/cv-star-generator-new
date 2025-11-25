import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface OnboardingState {
  currentStep: OnboardingStep;
  isComplete: boolean;
  industry?: string;
  targetGroups?: string[];
  selectedPlanId?: string;
  skippedSteps?: number[]; // Steps that were skipped
  completedSteps?: number[]; // Steps that were completed
  profileCompleted?: boolean;
  firstJobCreated?: boolean;
  teamInvited?: boolean;
}

// Step definitions
export const ONBOARDING_STEPS = {
  BRANCH: 0,
  TARGET_GROUPS: 1,
  PLAN: 2,
  PROFILE: 3,
  FIRST_JOB: 4,
  TEAM_INVITE: 5,
  WELCOME: 6,
} as const;

export function useCompanyOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    isComplete: false,
  });
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Load current onboarding state
  useEffect(() => {
    const loadState = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user's company
        const { data: companyUser } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!companyUser) {
          setLoading(false);
          return;
        }

        setCompanyId(companyUser.company_id);

        // Get company onboarding state and profile data
        const { data: company } = await supabase
          .from('companies')
          .select('onboarding_step, onboarding_completed, industry, target_groups, selected_plan_id, logo_url, description, onboarding_skipped_steps, onboarding_completed_steps, main_location, country')
          .eq('id', companyUser.company_id)
          .single();

        // Check if any job posts exist (using job_posts table)
        const { count: jobCount } = await supabase
          .from('job_posts')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyUser.company_id);

        // Check if team members exist
        const { count: teamCount } = await supabase
          .from('company_users')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyUser.company_id)
          .not('user_id', 'is', null); // At least one user

        if (company) {
          // Get skipped and completed steps from database
          const skippedSteps = (company.onboarding_skipped_steps as number[]) || [];
          const completedSteps = (company.onboarding_completed_steps as number[]) || [];
          
          // Determine next step to show (first incomplete step)
          // Skipped steps can appear again until completed once
          const allSteps = [0, 1, 2, 3, 4, 5, 6];
          const currentStep = company.onboarding_step || 0;
          
          // Check if company has a paid plan (not free)
          const hasPaidPlan = company.selected_plan_id && 
                             company.selected_plan_id !== 'free' && 
                             company.selected_plan_id !== null;
          
          // Check if job exists
          const hasJob = (jobCount || 0) > 0;
          
          // Onboarding should only show if:
          // 1. Not completed
          // 2. No job exists yet
          // 3. Has a paid plan (not free)
          const shouldShowOnboarding = !company.onboarding_completed && 
                                      !hasJob && 
                                      hasPaidPlan;
          
          // If onboarding is not complete, show the current step or first incomplete
          // Skipped steps can appear again, so we only check completed steps
          // But only if conditions are met (no job, has paid plan)
          const nextStep = company.onboarding_completed || !shouldShowOnboarding
            ? 6 // Welcome step or skip if conditions not met
            : allSteps.find(step => !completedSteps.includes(step)) ?? currentStep;

          setState({
            currentStep: (nextStep || company.onboarding_step || 0) as OnboardingStep,
            isComplete: company.onboarding_completed || !shouldShowOnboarding, // Mark as complete if conditions not met
            industry: company.industry || undefined,
            targetGroups: company.target_groups ? (company.target_groups as string[]) : undefined,
            selectedPlanId: company.selected_plan_id || undefined,
            skippedSteps,
            completedSteps,
            profileCompleted: !!(company.logo_url && company.description),
            firstJobCreated: hasJob,
            teamInvited: (teamCount || 0) > 1, // More than just the admin
          });
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, [user]);

  const updateStep = async (step: OnboardingStep, data?: Partial<OnboardingState>, markCompleted = false) => {
    if (!companyId) return;

    try {
      const updateData: any = { onboarding_step: step };
      
      if (data?.industry) updateData.industry = data.industry;
      if (data?.targetGroups) updateData.target_groups = data.targetGroups;
      if (data?.selectedPlanId) updateData.selected_plan_id = data.selectedPlanId;
      if (data?.planInterval) updateData.plan_interval = data.planInterval;

      // Track completed steps
      if (markCompleted) {
        const currentCompleted = state.completedSteps || [];
        const newCompleted = [...new Set([...currentCompleted, state.currentStep])];
        updateData.onboarding_completed_steps = newCompleted;
      }

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        currentStep: step,
        completedSteps: markCompleted ? [...(prev.completedSteps || []), prev.currentStep] : prev.completedSteps,
        ...data,
      }));
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      toast({
        title: 'Fehler',
        description: 'Onboarding-Status konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const skipStep = async (step: OnboardingStep) => {
    if (!companyId) return;

    try {
      // Track that this step was skipped (but it can appear again)
      const currentSkipped = state.skippedSteps || [];
      const newSkipped = [...new Set([...currentSkipped, step])];
      
      // Update onboarding step to next incomplete step
      const allSteps = [0, 1, 2, 3, 4, 5, 6];
      const nextStep = allSteps.find(s => 
        s > step && 
        !state.completedSteps?.includes(s)
      ) ?? (step + 1);

      const { error } = await supabase
        .from('companies')
        .update({ 
          onboarding_step: nextStep,
          onboarding_skipped_steps: newSkipped,
        })
        .eq('id', companyId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        currentStep: nextStep as OnboardingStep,
        skippedSteps: newSkipped,
      }));

      toast({
        title: 'Schritt übersprungen',
        description: 'Sie können diesen Schritt später abschließen.',
      });
    } catch (error) {
      console.error('Error skipping step:', error);
      toast({
        title: 'Fehler',
        description: 'Schritt konnte nicht übersprungen werden',
        variant: 'destructive',
      });
    }
  };

  const completeOnboarding = async () => {
    if (!companyId) return;

    try {
      // 1. Mark onboarding as completed
      const { error: updateError } = await supabase
        .from('companies')
        .update({ 
          onboarding_completed: true,
          onboarding_step: 4 
        })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // 2. Automatically assign selected plan
      if (state.selectedPlanId) {
        const { error: planError } = await supabase.rpc('admin_assign_plan', {
          p_company_id: companyId,
          p_plan_id: state.selectedPlanId,
          p_billing_cycle: 'monthly',
          p_notes: 'Auto-assigned after onboarding'
        });

        if (planError) {
          console.error('Error assigning plan:', planError);
          // Don't throw - onboarding is still complete
        }
      }

      setState(prev => ({
        ...prev,
        isComplete: true,
        currentStep: 4,
      }));

      toast({
        title: 'Onboarding abgeschlossen!',
        description: 'Ihr Unternehmensprofil wurde erfolgreich erstellt.',
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Fehler',
        description: 'Onboarding konnte nicht abgeschlossen werden',
        variant: 'destructive',
      });
    }
  };

  // Get next incomplete step
  const getNextIncompleteStep = (): OnboardingStep => {
    const allSteps = [0, 1, 2, 3, 4, 5, 6] as OnboardingStep[];
    const completed = state.completedSteps || [];
    
    // If onboarding is complete, don't show any steps
    if (state.isComplete) return 6;
    
    // Find first step that's not completed (skipped steps can appear again)
    return allSteps.find(step => 
      !completed.includes(step)
    ) ?? 0;
  };

  return {
    loading,
    state,
    companyId,
    updateStep,
    completeOnboarding,
    skipStep,
    getNextIncompleteStep,
  };
}
