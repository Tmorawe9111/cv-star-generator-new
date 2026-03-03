import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Match row from candidate_match_cache with joined candidate and job.
 */
export interface AdminMatchRow {
  id: string;
  score: number;
  is_explore: boolean;
  created_at: string;
  candidate?: { id: string; full_name: string; email: string } | null;
  job?: { title: string; company?: { name: string } } | null;
}

/**
 * Fetches admin matching overview from candidate_match_cache.
 * Used by Admin Matches page.
 *
 * @returns { data, isLoading, error, refetch }
 */
export function useAdminMatches() {
  const query = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async (): Promise<AdminMatchRow[]> => {
      const { data, error } = await supabase
        .from("candidate_match_cache")
        .select(
          `
          *,
          candidate:candidates(id, full_name, email),
          job:job_id(title, company:companies!job_posts_company_id_fkey(name))
        `
        )
        .order("score", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as AdminMatchRow[];
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
