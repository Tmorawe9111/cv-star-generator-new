import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserStatusFilter = "all" | "published" | "incomplete";

export interface AdminUser {
  id: string;
  email: string | null;
  created_at: string | null;
  profile_complete: boolean | null;
  profile_published: boolean | null;
  avatar_url: string | null;
  location_id?: number | null;
  status?: string | null; // schueler, azubi, ausgelernt
  branche?: string | null;
  last_sign_in_at?: string | null;
}

export interface UseUsersParams {
  search?: string;
  status?: UserStatusFilter;
  region?: string; // Bundesland (state)
  dateStart?: string; // ISO date (YYYY-MM-DD)
  dateEnd?: string;   // ISO date (YYYY-MM-DD)
  page?: number;
  pageSize?: number;
}

export function useUsers({ search = "", status = "all", region = "", dateStart, dateEnd, page = 1, pageSize = 10 }: UseUsersParams) {
  return useQuery({
    queryKey: ["admin-users", { search, status, region, dateStart, dateEnd, page, pageSize }],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Optional region -> location_id resolution
      let locationIds: number[] | null = null;
      if (region.trim()) {
        const { data: locs, error: locErr } = await supabase
          .from("locations")
          .select("id")
          .ilike("state", `%${region.trim()}%`)
          .limit(1000);
        if (locErr) throw locErr;
        locationIds = (locs || []).map((l: any) => l.id);
        if (locationIds.length === 0) {
          return { users: [], total: 0 };
        }
      }

      // Query profiles - ensure we get all users with profiles
      // Join with auth.users to get email if missing in profiles
      let query = supabase
        .from("profiles")
        .select("id,email,created_at,profile_complete,profile_published,avatar_url,location_id,status,branche", { count: "exact" })
        .not("id", "is", null) // Ensure ID exists
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search.trim()) {
        query = query.ilike("email", `%${search.trim()}%`);
      }

      if (status === "published") {
        query = query.eq("profile_published", true);
      } else if (status === "incomplete") {
        query = query.eq("profile_complete", false);
      }

      if (locationIds) {
        query = query.in("location_id", locationIds);
      }

      if (dateStart) {
        query = query.gte("created_at", new Date(dateStart).toISOString());
      }
      if (dateEnd) {
        // Add 1 day to include end date fully
        const end = new Date(dateEnd);
        end.setDate(end.getDate() + 1);
        query = query.lt("created_at", end.toISOString());
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Fetch last_sign_in_at from auth.users for all returned profiles
      const userIds = (data || []).map((u: any) => u.id);
      let authData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        if (authUsers?.users) {
          authData = authUsers.users.filter((u: any) => userIds.includes(u.id));
        }
      }

      // Merge auth data with profile data
      const users = (data || []).map((profile: any) => {
        const authUser = authData.find((au: any) => au.id === profile.id);
        return {
          ...profile,
          last_sign_in_at: authUser?.last_sign_in_at || null
        } as AdminUser;
      });

      return { users, total: count || 0 };
    },
    staleTime: 30_000,
  });
}
