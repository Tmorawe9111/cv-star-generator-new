import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAssignedJobIds(companyId?: string | null, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["assigned-job-ids", companyId, user?.id],
    enabled: !!companyId && !!user?.id && enabled,
    queryFn: async () => {
      if (!companyId || !user?.id) return [] as string[];
      const { data, error } = await (supabase as any)
        .from("company_job_assignments")
        .select("job_id")
        .eq("company_id", companyId)
        .eq("recruiter_user_id", user.id);
      if (error) {
        console.warn("[useAssignedJobIds] error", error);
        return [] as string[];
      }
      return ((data as any[]) || []).map((r) => r.job_id).filter(Boolean);
    },
    staleTime: 15_000,
  });
}


