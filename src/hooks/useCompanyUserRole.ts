import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CompanyUserRole = "owner" | "admin" | "recruiter" | "viewer" | "marketing";

export function useCompanyUserRole(companyId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["company-user-role", companyId, user?.id],
    enabled: !!companyId && !!user?.id,
    queryFn: async (): Promise<CompanyUserRole | null> => {
      if (!companyId || !user?.id) return null;
      const { data, error } = await supabase
        .from("company_users")
        .select("role, accepted_at")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("[useCompanyUserRole] error", error);
        return null;
      }
      if (!data?.accepted_at) return null;
      const role = String(data.role || "").toLowerCase();
      if (role === "owner" || role === "admin" || role === "recruiter" || role === "viewer" || role === "marketing") {
        return role;
      }
      return null;
    },
    staleTime: 30_000,
  });
}

export function isCompanyAdminRole(role: CompanyUserRole | null | undefined) {
  return role === "owner" || role === "admin";
}


