import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublicProfile = {
  id: string;
  vorname: string | null;
  nachname: string | null;
  avatar_url: string | null;
  full_name: string;
  company_id: string | null;
  company_name: string | null;
  company_logo: string | null;
  employment_status: string | null;
};

export function usePublicProfile(userId?: string) {
  return useQuery({
    queryKey: ["profiles_public", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PublicProfile> => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Profile not found");
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}