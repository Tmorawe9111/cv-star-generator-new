import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Creator record from the database.
 */
export interface Creator {
  id: string;
  code: string;
  name: string;
  platform: "instagram" | "facebook" | "both";
  utm_campaign?: string;
  redirectTo: "gesundheitswesen" | "cv-generator";
  created_at?: string;
}

/**
 * Input for creating or updating a creator (without id/created_at).
 */
export type CreatorInput = Omit<Creator, "id" | "created_at">;

/**
 * Fetches and mutates creators (Instagram/Facebook creator links).
 * Used by Admin Creator Management page.
 *
 * @returns { data, isLoading, error, refetch, createCreator, updateCreator, deleteCreator }
 */
export function useCreators() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["creators"],
    queryFn: async (): Promise<Creator[]> => {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        code: c.code as string,
        name: c.name as string,
        platform: c.platform as Creator["platform"],
        utm_campaign: (c.utm_campaign as string) || undefined,
        redirectTo: (c.redirect_to as Creator["redirectTo"]) ?? "cv-generator",
        created_at: c.created_at as string | undefined,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreatorInput) => {
      const { data, error } = await supabase
        .from("creators")
        .insert({
          code: input.code,
          name: input.name,
          platform: input.platform,
          utm_campaign: input.utm_campaign || null,
          redirect_to: input.redirectTo,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creators"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: string; input: CreatorInput }) => {
      const { data, error } = await supabase
        .from("creators")
        .update({
          code: input.code,
          name: input.name,
          platform: input.platform,
          utm_campaign: input.utm_campaign || null,
          redirect_to: input.redirectTo,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creators"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("creators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creators"] }),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createCreator: createMutation.mutateAsync,
    updateCreator: updateMutation.mutateAsync,
    deleteCreator: deleteMutation.mutateAsync,
  };
}
