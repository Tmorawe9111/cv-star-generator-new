import { useQuery } from "@tanstack/react-query";
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
      
      // Check if plan is still active (even if cancelled, it should work until next_billing_date)
      const now = new Date();
      const nextBillingDate = company.next_billing_date ? new Date(company.next_billing_date) : null;
      const isPlanActive = nextBillingDate ? nextBillingDate > now : true;
      
      // Use active_plan_id if available, otherwise fall back to selected_plan_id
      const planId = (company.active_plan_id || company.selected_plan_id) as PlanKey | null;

      // Check if free plan or plan is not active
      if (!planId || planId === "free" || !isPlanActive) {
        return {
          canCreate: false,
          currentCount,
          maxAllowed: 0,
          planId: planId || "free",
          reason: "free",
        };
      }

      // Get plan limits
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

      const maxAllowed = plan.maxActiveJobs;
      const canCreate = maxAllowed === -1 || currentCount < maxAllowed;

      return {
        canCreate,
        currentCount,
        maxAllowed,
        planId,
        reason: canCreate ? null : "limit_reached",
      };
    },
    enabled: !!company?.id,
  });
}

