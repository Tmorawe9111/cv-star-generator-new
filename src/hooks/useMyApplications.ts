import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export type ApplicationStatus = "new" | "unlocked" | "interview" | "offer" | "rejected" | "hired" | "archived";

export type MyApplication = {
  id: string;
  job_id: string;
  company_id?: string;
  status: ApplicationStatus;
  created_at: string;
  unlocked_at?: string;
  updated_at?: string;
  is_new?: boolean;
  reason_short?: string | null;
  reason_custom?: string | null;
  job?: {
    id: string;
    title: string;
    city?: string | null;
    employment_type?: string | null;
    company?: {
      id: string;
      name: string;
      logo_url?: string | null;
    } | null;
  } | null;
};

export function useMyApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // IMPORTANT:
      // We intentionally do NOT rely on PostgREST relationship embeds here.
      // In this codebase the FK between applications(job_id) and job_posts(id) can be missing/changed,
      // which would make embeds fail and "silently" look like an empty list in the UI.
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select(
          "id, job_id, company_id, status, created_at, updated_at, unlocked_at, is_new, reason_short, reason_custom"
        )
        .eq("candidate_id", user!.id)
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;

      const safeApps = (apps || []) as any[];
      if (safeApps.length === 0) return [] as MyApplication[];

      const jobIds = Array.from(new Set(safeApps.map((a) => a.job_id).filter(Boolean)));
      const companyIds = Array.from(new Set(safeApps.map((a) => a.company_id).filter(Boolean)));

      // Fetch job details (best effort — job might be private/inactive, still show application row)
      const jobById = new Map<string, any>();
      if (jobIds.length > 0) {
        const { data: jobs, error: jobsError } = await supabase
          .from("job_posts")
          .select(
            `
            id,
            title,
            city,
            employment_type,
            company:companies!job_posts_company_id_fkey (
              id,
              name,
              logo_url
            )
          `
          )
          .in("id", jobIds as any);
        if (!jobsError) {
          (jobs || []).forEach((j: any) => jobById.set(j.id, j));
        }
      }

      // Fetch company fallback (for jobs that can't be loaded anymore)
      const companyById = new Map<string, any>();
      if (companyIds.length > 0) {
        const { data: companies, error: companiesError } = await supabase
          .from("companies")
          .select("id, name, logo_url")
          .in("id", companyIds as any);
        if (!companiesError) {
          (companies || []).forEach((c: any) => companyById.set(c.id, c));
        }
      }

      return safeApps.map((a) => {
        const job = a.job_id ? jobById.get(a.job_id) : null;
        const companyFallback = a.company_id ? companyById.get(a.company_id) : null;

        // If job can't be loaded (inactive/private/deleted), keep application visible with a placeholder job
        const mergedJob =
          job ??
          (a.job_id
            ? {
                id: a.job_id,
                title: "Stellenanzeige nicht mehr verfügbar",
                city: null,
                employment_type: null,
                company: companyFallback,
              }
            : null);

        if (mergedJob && !mergedJob.company && companyFallback) {
          mergedJob.company = companyFallback;
        }

        return {
          ...a,
          job: mergedJob,
        } as MyApplication;
      });
    },
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("applications")
        .update({ status: "archived" })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("Bewerbung zurückgezogen");
    },
    onError: () => {
      toast.error("Fehler beim Zurückziehen der Bewerbung");
    },
  });
}
