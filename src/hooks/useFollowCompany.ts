import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTrackInteraction, extractCompanyMetadata } from '@/hooks/useTrackInteraction';
import { trackCompanyFollow, trackCompanyUnfollow } from '@/lib/telemetry';

export function useFollowCompany(companyId?: string, companyData?: { branche?: string; city?: string; name?: string }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { track } = useTrackInteraction();

  const fetchStatus = useCallback(async () => {
    if (!user || !companyId) return;
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followee_id', companyId)
      .eq('follower_type', 'profile')
      .eq('followee_type', 'company')
      .maybeSingle();
    if (!error) setIsFollowing(!!data);
  }, [user, companyId]);

  useEffect(() => {
    setIsFollowing(false);
    if (!companyId) return;
    fetchStatus();
  }, [companyId, fetchStatus]);

  const toggleFollow = useCallback(async () => {
    if (!user || !companyId) {
      window.location.href = '/auth';
      return;
    }
    setLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followee_id', companyId)
          .eq('follower_type', 'profile')
          .eq('followee_type', 'company');
        if (!error) {
          setIsFollowing(false);
          trackCompanyUnfollow(companyId, user.id, companyData);
        }
      } else {
        // Check if company already follows this user (pending or accepted)
        const { data: companyFollowsUser } = await supabase
          .from('follows')
          .select('id, status')
          .eq('follower_type', 'company')
          .eq('follower_id', companyId)
          .eq('followee_type', 'profile')
          .eq('followee_id', user.id)
          .maybeSingle();
        
        // Insert user following company
        const { error: insertError } = await supabase
          .from('follows')
          .insert({ 
            follower_id: user.id, 
            followee_id: companyId,
            follower_type: 'profile',
            followee_type: 'company',
            status: 'accepted'
          });
        
        if (insertError) throw insertError;
        
        // Track follow interaction for personalization
        const metadata = companyData ? extractCompanyMetadata(companyData) : {};
        track('follow', 'company', companyId, metadata);
        
        // Track for analytics
        trackCompanyFollow(companyId, user.id, companyData);
        
        // If company already follows user (mutual follow), accept the company's follow request
        if (companyFollowsUser && companyFollowsUser.status === 'pending') {
          const { error: updateError } = await supabase
            .from('follows')
            .update({ status: 'accepted' })
            .eq('id', companyFollowsUser.id);
          
          if (updateError) {
            console.error('Error accepting company follow request:', updateError);
          }
        }
        
        setIsFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  }, [user, companyId, isFollowing]);

  return { isFollowing, loading, toggleFollow, refetch: fetchStatus };
}
