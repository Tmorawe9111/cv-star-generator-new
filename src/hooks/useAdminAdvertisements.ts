import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Advertisement record from the database.
 */
export interface Advertisement {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  image_url?: string | null;
  badge?: string | null;
  category?: string | null;
  position: "left" | "right" | "both";
  priority: number;
  active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  target_branche?: string[] | null;
  target_status?: string[] | null;
  target_regions?: string[] | null;
  click_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating or updating an advertisement.
 */
export type AdvertisementInput = Partial<Omit<Advertisement, "id" | "created_at" | "updated_at" | "click_count">> &
  Pick<Advertisement, "title" | "url">;

/**
 * Fetches and mutates advertisements for the admin panel.
 * Used by Admin Advertisements page.
 *
 * @returns { data, isLoading, error, refetch, createAd, updateAd, deleteAd }
 */
export function useAdminAdvertisements() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-advertisements"],
    queryFn: async (): Promise<Advertisement[]> => {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Advertisement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: AdvertisementInput) => {
      const { error } = await supabase.from("advertisements").insert([
        {
          ...input,
          click_count: 0,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: string; input: AdvertisementInput }) => {
      const { error } = await supabase
        .from("advertisements")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] }),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createAd: createMutation.mutateAsync,
    updateAd: updateMutation.mutateAsync,
    deleteAd: deleteMutation.mutateAsync,
  };
}
