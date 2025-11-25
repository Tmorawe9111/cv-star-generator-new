import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@/components/profile/ProfileCard";

type Variant = "dashboard" | "search" | "unlocked";

export function useProfiles(params: {
  companyId: string;
  variant: Variant;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}) {
  const { companyId, variant, limit = 24, offset = 0, enabled = true } = params;

  return useQuery({
    queryKey: ["profiles-with-match", companyId, variant, limit, offset],
    enabled: !!companyId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .rpc("profiles_with_match", {
          p_company_id: companyId,
          p_variant: variant,
          p_limit: limit,
          p_offset: offset,
        });

      if (error) throw error;

      // Return profiles without individual match score calculations for faster loading
      // Match scores can be calculated on-demand or in batches if needed
      return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        avatar_url: r.avatar_url,
        role: r.role,
        city: r.city,
        fs: r.fs,
        seeking: r.seeking,
        skills: r.skills || [],
        match: r.match_score ?? 0, // Use match_score from RPC if available
      }));
    },
  });
}