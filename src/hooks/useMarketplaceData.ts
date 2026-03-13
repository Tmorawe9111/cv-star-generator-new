import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import type {
  MarketplacePerson,
  MarketplaceCompany,
  MarketplacePost,
  MarketplaceJob,
} from "@/types/marketplace";

/** Fisher-Yates shuffle algorithm */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Online status detection */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export interface UseMarketplaceDataOptions {
  userId: string | undefined;
  sessionId: string;
}

export interface UseMarketplaceDataResult {
  people: MarketplacePerson[];
  companies: MarketplaceCompany[];
  posts: MarketplacePost[];
  jobs: MarketplaceJob[];
  authors: Record<string, { name: string; avatar_url: string | null }>;
  companyMap: Record<string, { name: string; logo_url: string | null }>;
  followedCompanyIds: Set<string>;
  isLoading: boolean;
  invalidateAll: () => Promise<void>;
  invalidatePosts: () => Promise<void>;
}

export function useMarketplaceData({
  userId,
  sessionId,
}: UseMarketplaceDataOptions): UseMarketplaceDataResult {
  const queryClient = useQueryClient();
  const [authors, setAuthors] = useState<
    Record<string, { name: string; avatar_url: string | null }>
  >({});
  const [companyMap, setCompanyMap] = useState<
    Record<string, { name: string; logo_url: string | null }>
  >({});
  const [followedCompanyIds, setFollowedCompanyIds] = useState<Set<string>>(
    new Set()
  );

  const peopleQuery = useQuery<MarketplacePerson[]>({
    queryKey: ["mp-people-mobile", sessionId, userId],
    queryFn: async () => {
      if (!userId) return [];

      let { data, error } = await supabase
        .from("profiles")
        .select(
          "id, vorname, nachname, avatar_url, bio, branche, stadt, ort, status, schule, ausbildungsberuf, ausbildungsbetrieb, aktueller_beruf, berufserfahrung, schulbildung"
        )
        .limit(50);

      if (error?.code === "42703") {
        const result = await supabase
          .from("profiles")
          .select("id, vorname, nachname, avatar_url, bio, branche, ort, status")
          .limit(50);
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Error fetching profiles:", error);
        return [];
      }

      const filtered = (data || []).filter(
        (p: { vorname?: string; nachname?: string; id?: string }) =>
          (p.vorname || p.nachname) && p.id !== userId
      );

      const { data: currentConnections } = await supabase
        .from("connections")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq("status", "accepted");

      const currentUserConnectionIds = new Set(
        (currentConnections || []).map((c: { requester_id: string; addressee_id: string }) =>
          c.requester_id === userId ? c.addressee_id : c.requester_id
        )
      );

      const enrichedProfiles = await Promise.all(
        filtered.map(
          async (
            profile: Record<string, unknown> & { id: string }
          ): Promise<MarketplacePerson> => {
            const enriched: MarketplacePerson = { ...profile } as MarketplacePerson;

            const { data: profileConnections } = await supabase
              .from("connections")
              .select("requester_id, addressee_id")
              .or(
                `requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`
              )
              .eq("status", "accepted");

            const profileConnectionIds = new Set(
              (profileConnections || []).map(
                (c: { requester_id: string; addressee_id: string }) =>
                  c.requester_id === profile.id ? c.addressee_id : c.requester_id
              )
            );

            const mutualIds = Array.from(currentUserConnectionIds).filter(
              (id) =>
                profileConnectionIds.has(id) &&
                id !== profile.id &&
                id !== userId
            );

            if (mutualIds.length > 0) {
              const { data: mutualProfiles } = await supabase
                .from("profiles")
                .select("id, vorname, nachname, avatar_url")
                .in("id", mutualIds.slice(0, 3));

              enriched.mutualConnections = (mutualProfiles || []).map(
                (p: {
                  id: string;
                  vorname?: string;
                  nachname?: string;
                  avatar_url?: string | null;
                }) => ({
                  id: p.id,
                  avatar_url: p.avatar_url ?? null,
                  name: `${p.vorname || ""} ${p.nachname || ""}`.trim() || "Unbekannt",
                })
              );
              enriched.mutualCount = mutualIds.length;
            }

            return enriched;
          }
        )
      );

      return shuffleArray(enrichedProfiles).slice(0, 20) as MarketplacePerson[];
    },
  });

  const companiesQuery = useQuery<MarketplaceCompany[]>({
    queryKey: ["mp-companies-mobile", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, logo_url, industry, city")
        .limit(30);
      if (error) return [];
      return shuffleArray(data || []).slice(0, 15) as MarketplaceCompany[];
    },
  });

  const postsQuery = useQuery<MarketplacePost[]>({
    queryKey: ["mp-posts-mobile", sessionId],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("id, content, image_url, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !postsData) return [];

      const postIds = postsData.map((p: { id: string }) => p.id);

      const { data: likesData } = await supabase
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds);

      const { data: commentsData } = await supabase
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIds);

      const likesMap: Record<string, number> = {};
      const commentsMap: Record<string, number> = {};

      (likesData || []).forEach((l: { post_id: string }) => {
        likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
      });
      (commentsData || []).forEach((c: { post_id: string }) => {
        commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
      });

      return postsData.map(
        (p: { id: string; [key: string]: unknown }) =>
          ({
            ...p,
            likes_count: likesMap[p.id] || 0,
            comments_count: commentsMap[p.id] || 0,
          }) as MarketplacePost
      );
    },
  });

  const jobsQuery = useQuery<MarketplaceJob[]>({
    queryKey: ["mp-jobs-mobile", sessionId, userId],
    queryFn: async () => {
      if (userId) {
        const { data, error } = await supabase.rpc("get_jobs_by_branch", {
          p_viewer_id: userId,
          p_limit: 20,
          p_offset: 0,
        });

        if (error) {
          console.error("[MarketplaceMobile] get_jobs_by_branch error:", error);
          return [];
        }
        if (data && data.length > 0) {
          const transformed = (data as Array<Record<string, unknown>>).map(
            (job) => ({
              id: job.id,
              title: job.title,
              company_id: job.company_id,
              location: null,
              employment_type: null,
              salary_min: null,
              salary_max: null,
            })
          );
          return shuffleArray(transformed).slice(0, 10) as MarketplaceJob[];
        }
        return [];
      }

      const { data, error } = await supabase
        .from("job_posts")
        .select("id, title, company_id, city, employment_type, salary_min, salary_max")
        .eq("status", "active")
        .limit(20);
      if (error) return [];
      const jobs = (data || []).map((j: Record<string, unknown>) => ({
        ...j,
        location: j.city ?? j.location ?? null,
      }));
      return shuffleArray(jobs).slice(0, 10) as MarketplaceJob[];
    },
  });

  useEffect(() => {
    if (!postsQuery.data || postsQuery.data.length === 0) return;
    const ids = Array.from(new Set(postsQuery.data.map((p) => p.user_id)));
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, vorname, nachname, avatar_url")
        .in("id", ids);
      if (data) {
        const map: Record<string, { name: string; avatar_url: string | null }> = {};
        data.forEach(
          (p: { id: string; vorname?: string; nachname?: string; avatar_url?: string | null }) => {
            map[p.id] = {
              name: [p.vorname, p.nachname].filter(Boolean).join(" ") || "Unbekannt",
              avatar_url: p.avatar_url ?? null,
            };
          }
        );
        setAuthors(map);
      }
    })();
  }, [postsQuery.data]);

  useEffect(() => {
    if (!jobsQuery.data || jobsQuery.data.length === 0) return;
    const ids = Array.from(new Set(jobsQuery.data.map((j) => j.company_id)));
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, logo_url")
        .in("id", ids);
      if (data) {
        const map: Record<string, { name: string; logo_url: string | null }> = {};
        data.forEach(
          (c: { id: string; name: string; logo_url?: string | null }) => {
            map[c.id] = { name: c.name, logo_url: c.logo_url ?? null };
          }
        );
        setCompanyMap(map);
      }
    })();
  }, [jobsQuery.data]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", userId)
        .eq("follower_type", "profile")
        .eq("followee_type", "company")
        .eq("status", "accepted");
      if (data) {
        setFollowedCompanyIds(new Set(data.map((f: { followee_id: string }) => f.followee_id)));
      }
    })();
  }, [userId]);

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mp-people-mobile"] }),
      queryClient.invalidateQueries({ queryKey: ["mp-companies-mobile"] }),
      queryClient.invalidateQueries({ queryKey: ["mp-posts-mobile"] }),
      queryClient.invalidateQueries({ queryKey: ["mp-jobs-mobile"] }),
    ]);
  };

  const invalidatePosts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["mp-posts-mobile"] });
  };

  const allCompanies = (companiesQuery.data || []).filter(
    (c) => !followedCompanyIds.has(c.id)
  );

  return {
    people: peopleQuery.data || [],
    companies: allCompanies,
    posts: postsQuery.data || [],
    jobs: jobsQuery.data || [],
    authors,
    companyMap,
    followedCompanyIds,
    isLoading:
      peopleQuery.isLoading ||
      companiesQuery.isLoading ||
      postsQuery.isLoading ||
      jobsQuery.isLoading,
    invalidateAll,
    invalidatePosts,
  };
}
