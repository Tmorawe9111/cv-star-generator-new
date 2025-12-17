import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export type ApplicationStatus = "new" | "unlocked" | "interview" | "offer" | "rejected" | "hired" | "archived";

export type MyApplication = {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  created_at: string;
  unlocked_at?: string;
  is_new?: boolean;
  job: {
    id: string;
    title: string;
    city?: string;
    employment_type?: string;
    company: {
      id: string;
      name: string;
      logo_url?: string;
    };
  };
};

export function useMyApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          job_id,
          status,
          created_at,
          unlocked_at,
          is_new,
          job:job_posts!job_id (
            id,
            title,
            city,
            employment_type,
            company:companies!company_id (
              id,
              name,
              logo_url
            )
          )
        `)
        .eq("candidate_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as MyApplication[];
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
