import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Job post with company info for admin list.
 */
export interface AdminJobRow {
  id: string;
  title: string;
  status: string;
  is_active: boolean;
  created_at: string;
  company?: { name: string; logo_url?: string } | null;
}

/**
 * Fetches job posts for admin with optional search and status filter.
 * Used by Admin Jobs page.
 *
 * @param search - Optional title search string
 * @param statusFilter - 'all' | 'active' | 'inactive'
 * @returns { data, isLoading, error, refetch }
 */
export function useAdminJobs(search = "", statusFilter = "all") {
  const query = useQuery({
    queryKey: ["admin-jobs", search, statusFilter],
    queryFn: async (): Promise<AdminJobRow[]> => {
      let q = supabase
        .from("job_posts")
        .select(
          `
          *,
          company:companies!job_posts_company_id_fkey(name, logo_url)
        `
        )
        .order("created_at", { ascending: false });

      if (search) {
        q = q.ilike("title", `%${search}%`);
      }

      if (statusFilter !== "all") {
        q = q.eq("is_active", statusFilter === "active");
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as AdminJobRow[];
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
