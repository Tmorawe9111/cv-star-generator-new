import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { PLANS, PlanKey } from "@/lib/billing-v2/plans";

interface JobLimitInfo {
  canCreate: boolean;
  currentCount: number;
  maxAllowed: number;
  planId: string | null;
  reason?: "free" | "limit_reached" | null;
}

export function useJobLimits() {
  const { company } = useCompany();
  const queryClient = useQueryClient();

  // Listen for company data updates from admin panel
  useEffect(() => {
    const handleCompanyUpdate = (event: CustomEvent<{ companyId: string }>) => {
      if (company?.id === event.detail.companyId) {
        console.log("[useJobLimits] Company data updated, invalidating query...");
        queryClient.invalidateQueries({ queryKey: ["job-limits", company.id] });
        queryClient.invalidateQueries({ queryKey: ["active-company-plan", company.id] });
      }
    };

    window.addEventListener('company-data-updated', handleCompanyUpdate as EventListener);
    return () => {
      window.removeEventListener('company-data-updated', handleCompanyUpdate as EventListener);
    };
  }, [company?.id, queryClient]);

  return useQuery({
    queryKey: ["job-limits", company?.id],
    queryFn: async (): Promise<JobLimitInfo> => {
      if (!company?.id) {
        return {
          canCreate: false,
          currentCount: 0,
          maxAllowed: 0,
          planId: null,
          reason: "free",
        };
      }

      // Get active job count (only published and active)
      const { count: activeCount, error: countError } = await supabase
        .from("job_posts")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("status", "published")
        .eq("is_active", true);

      if (countError) {
        console.error("Error counting jobs:", countError);
      }

      const currentCount = activeCount || 0;
      
      // Get active plan with custom limits from company_plan_assignments
      const { data: activePlanData, error: planError } = await supabase
        .rpc("get_active_company_plan", { p_company_id: company.id });

      if (planError && planError.code !== 'PGRST116') {
        console.error("Error fetching active plan:", planError);
      }

      const activePlan = activePlanData?.[0];
      const planId = (activePlan?.plan_id || company.active_plan_id || company.selected_plan_id) as PlanKey | null;

      // If no active plan assignment, check if plan is still active
      const now = new Date();
      const nextBillingDate = company.next_billing_date ? new Date(company.next_billing_date) : null;
      const isPlanActive = nextBillingDate ? nextBillingDate > now : true;

      // Check if free plan or plan is not active
      if (!planId || planId === "free" || (!activePlan && !isPlanActive)) {
        return {
          canCreate: false,
          currentCount,
          maxAllowed: 0,
          planId: planId || "free",
          reason: "free",
        };
      }

      // Use custom_jobs from company_plan_assignments if available, otherwise use plan defaults
      let maxAllowed: number;
      if (activePlan && activePlan.jobs !== null && activePlan.jobs !== undefined) {
        // Custom limit from company_plan_assignments
        maxAllowed = activePlan.jobs;
      } else {
        // Fallback to standard plan limits
        const plan = PLANS[planId as PlanKey];
        if (!plan) {
          return {
            canCreate: false,
            currentCount,
            maxAllowed: 0,
            planId,
            reason: "free",
          };
        }
        maxAllowed = plan.maxActiveJobs;
      }

      // -1 means unlimited
      const canCreate = maxAllowed === -1 || currentCount < maxAllowed;

      return {
        canCreate,
        currentCount,
        maxAllowed: maxAllowed === -1 ? 999999 : maxAllowed, // Show a large number for unlimited
        planId,
        reason: canCreate ? null : "limit_reached",
      };
    },
    enabled: !!company?.id,
  });
}

