import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type CompanyInterest = {
  id: string;
  company_id: string;
  job_id?: string;
  unlocked_at?: string;
  request_id?: string;
  request_status?: 'pending' | 'accepted' | 'rejected';
  token_cost?: number;
  created_at?: string;
  company: {
    id: string;
    name: string;
    logo_url?: string;
    industry?: string;
  };
  job?: {
    id: string;
    title: string;
    city?: string;
  };
};

export function useCompanyInterests() {
  const { user, profile } = useAuth();
  const candidateId = profile?.id;

  return useQuery({
    queryKey: ["company-interests", candidateId],
    enabled: !!candidateId,
    queryFn: async () => {
      console.log('useCompanyInterests: Fetching interests for candidateId:', candidateId);
      console.log('useCompanyInterests: user.id:', user?.id);
      console.log('useCompanyInterests: profile?.id:', profile?.id);
      console.log('useCompanyInterests: auth.uid() should match:', user?.id);
      
      const results: CompanyInterest[] = [];

      // 1. Get pending interest requests
      // RLS policy automatically filters by candidate_id = auth.uid()
      // But we also explicitly filter by candidate_id to ensure we get the right data
      const { data: pendingRequests, error: requestsError } = await supabase
        .from("company_interest_requests")
        .select(`
          id,
          company_id,
          candidate_id,
          status,
          token_cost,
          created_at,
          company:companies!company_id (
            id,
            name,
            logo_url,
            industry
          )
        `)
        .eq("status", "pending")
        .eq("candidate_id", candidateId!) // Explicitly filter by candidate_id
        .order("created_at", { ascending: false });

      console.log('useCompanyInterests: Pending requests:', pendingRequests, 'Error:', requestsError);
      if (requestsError) {
        console.error('useCompanyInterests: Error fetching pending requests:', requestsError);
        throw requestsError;
      }

      // Add pending requests
      if (pendingRequests) {
        pendingRequests.forEach((req: any) => {
          results.push({
            id: `request-${req.id}`,
            company_id: req.company_id,
            request_id: req.id,
            request_status: 'pending',
            token_cost: req.token_cost,
            created_at: req.created_at,
            company: req.company,
          });
        });
      }

      // 2. Get already unlocked profiles (accepted requests)
      const { data: unlockedProfiles, error: unlockedError } = await supabase
        .from("company_candidates")
        .select(`
          id,
          company_id,
          candidate_id,
          unlocked_at,
          company:companies!company_id (
            id,
            name,
            logo_url,
            industry
          )
        `)
        .eq("candidate_id", candidateId!)
        .not("unlocked_at", "is", null)
        .order("unlocked_at", { ascending: false });

      console.log('useCompanyInterests: Unlocked profiles:', unlockedProfiles, 'Error:', unlockedError);
      if (unlockedError) {
        console.error('useCompanyInterests: Error fetching unlocked profiles:', unlockedError);
        throw unlockedError;
      }

      // Add unlocked profiles (only if not already in results as pending)
      if (unlockedProfiles) {
        unlockedProfiles.forEach((profile: any) => {
          // Check if this company already has a pending request
          const hasPendingRequest = results.some(
            (r) => r.company_id === profile.company_id && r.request_status === 'pending'
          );
          
          if (!hasPendingRequest) {
            results.push({
              id: `unlocked-${profile.id}`,
              company_id: profile.company_id,
              unlocked_at: profile.unlocked_at,
              request_status: 'accepted',
              company: profile.company,
            });
          }
        });
      }

      console.log('useCompanyInterests: Final results:', results);
      return results;
    },
  });
}
