import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useExportCandidates(companyId: string) {
  const mutation = useMutation({
    mutationFn: async ({ format, profileIds }: { format: "csv" | "xlsx"; profileIds: string[] }) => {
      const { data, error } = await supabase.functions.invoke("export-candidates", {
        body: { company_id: companyId, profile_ids: profileIds, format }
      });
      if (error) throw error;
      return data.url as string;
    },
    onError: (error: any) => {
      toast.error(error.message || "Fehler beim Exportieren");
    }
  });

  return {
    isPending: mutation.isPending,
    export: async (format: "csv" | "xlsx", profileIds: string[]) => {
      const url = await mutation.mutateAsync({ format, profileIds });
      toast.success("Export erfolgreich erstellt");
      return url;
    }
  };
}