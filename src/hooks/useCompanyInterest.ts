import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Hook for company members to show interest (follow) in a user profile
// Uses company_user_interests table with RLS
export function useCompanyInterest(targetUserId?: string) {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [interested, setInterested] = useState(false);
  const [loading, setLoading] = useState(false);

  // Determine acting company (fetch from company_users)
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (!error && data) setCompanyId(data.company_id);
    };
    load();
  }, [user]);

  const fetchStatus = useCallback(async () => {
    if (!user || !targetUserId || !companyId) return;
    const { data, error } = await supabase
      .from('company_user_interests')
      .select('id')
      .eq('company_id', companyId)
      .eq('user_id', targetUserId)
      .maybeSingle();
    if (!error) setInterested(!!data);
  }, [user, targetUserId, companyId]);

  useEffect(() => {
    setInterested(false);
    fetchStatus();
  }, [fetchStatus]);

  const toggle = useCallback(async () => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    if (!targetUserId || !companyId) return;
    setLoading(true);
    try {
      if (interested) {
        // Remove interest
        const { error } = await supabase
          .from('company_user_interests')
          .delete()
          .eq('company_id', companyId)
          .eq('user_id', targetUserId);
        if (!error) setInterested(false);
      } else {
        // Check if user also has interest in company (mutual interest)
        // User shows interest by following the company (accepted follow)
        const { data: userFollowsCompany } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_type', 'profile')
          .eq('follower_id', targetUserId)
          .eq('followee_type', 'company')
          .eq('followee_id', companyId)
          .eq('status', 'accepted')
          .maybeSingle();
        
        const hasMutualInterest = !!userFollowsCompany;
        
        // Insert company interest
        const { error: insertError } = await supabase
          .from('company_user_interests')
          .insert({ company_id: companyId, user_id: targetUserId, created_by: user.id });
        
        if (insertError) throw insertError;
        
        // If mutual interest (user follows company), deduct 3 tokens
        if (hasMutualInterest) {
          const { data: tokenResult, error: tokenError } = await supabase.rpc('use_company_token', {
            p_company_id: companyId,
            p_profile_id: targetUserId,
            p_token_cost: 3,
            p_reason: 'mutual_interest'
          });
          
          if (tokenError || !tokenResult?.success) {
            console.error('Error deducting tokens:', tokenError || tokenResult);
            // Still set interested to true, but show warning
            setInterested(true);
            return { success: true, tokensDeducted: false, error: tokenError || tokenResult?.error };
          }
          
          setInterested(true);
          return { success: true, tokensDeducted: true, newBalance: tokenResult.new_balance };
        } else {
          setInterested(true);
          return { success: true, tokensDeducted: false };
        }
      }
    } catch (error: any) {
      console.error('Error toggling interest:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, companyId, interested]);

  return { 
    interested, 
    loading, 
    toggle: async () => {
      try {
        return await toggle();
      } catch (error) {
        throw error;
      }
    }, 
    refetch: fetchStatus 
  };
}
