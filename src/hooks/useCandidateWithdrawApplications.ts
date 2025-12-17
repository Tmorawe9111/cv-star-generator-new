import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCandidateWithdrawApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { applicationId: string; reason?: string; setInvisible?: boolean }) => {
      const { error } = await supabase.rpc("candidate_withdraw_application", {
        p_application_id: args.applicationId,
        p_reason: args.reason || null,
        p_set_invisible: !!args.setInvisible,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("Bewerbung abgesagt");
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Konnte Bewerbung nicht absagen");
    },
  });
}

export function useCandidateWithdrawAllApplications() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { reason?: string; setInvisible?: boolean }) => {
      const { data, error } = await supabase.rpc("candidate_withdraw_all_applications", {
        p_reason: args.reason || null,
        p_set_invisible: args.setInvisible ?? true,
      });
      if (error) throw error;
      return Number(data || 0);
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      qc.invalidateQueries({ queryKey: ["profile-status"] });
      toast.success(`Bewerbungen abgesagt (${count})`);
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Konnte Bewerbungen nicht absagen");
    },
  });
}


