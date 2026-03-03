import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Raw row from referral_analytics view.
 */
export interface ReferralAnalyticsRow {
  referral_source: string | null;
  referral_name: string | null;
  referral_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  total_clicks: number;
  unique_sessions: number;
  registrations: number;
  completed_profiles: number;
  cv_creations: number;
  click_to_registration_rate: number;
  registration_to_profile_rate: number;
  click_to_profile_rate: number;
  first_click: string | null;
  last_click: string | null;
  click_date: string | null;
}

/**
 * Fetches referral analytics from the referral_analytics view.
 * Used by Admin Referral Analytics page.
 *
 * @param dateRange - Optional: '7d' | '30d' | '90d' | 'all' to filter by click_date
 * @returns { data, isLoading, error, refetch }
 */
export function useReferralAnalytics(dateRange: "7d" | "30d" | "90d" | "all" = "all") {
  const query = useQuery({
    queryKey: ["referral-analytics", dateRange],
    queryFn: async (): Promise<ReferralAnalyticsRow[]> => {
      let q = supabase
        .from("referral_analytics")
        .select("*")
        .order("total_clicks", { ascending: false });

      if (dateRange !== "all") {
        const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte("click_date", cutoff);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ReferralAnalyticsRow[];
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
