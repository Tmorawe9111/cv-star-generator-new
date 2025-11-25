import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface CompanyFollowRequest {
  id: string;
  follower_id: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    main_location: string | null;
  };
  created_at: string;
}

interface FollowedCompany {
  id: string;
  followee_id: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    main_location: string | null;
  };
  created_at: string;
}

export function useFollowRelations() {
  const { user } = useAuth();
  const [companyFollowRequests, setCompanyFollowRequests] = useState<CompanyFollowRequest[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<FollowedCompany[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCompanyFollowRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      // First get the follow records
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('id, follower_id, created_at')
        .eq('followee_id', user.id)
        .eq('followee_type', 'profile')
        .eq('follower_type', 'company')
        .eq('status', 'pending');

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setCompanyFollowRequests([]);
        return;
      }

      // Then get the company details
      const companyIds = followsData.map(f => f.follower_id);
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, logo_url, industry, main_location')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      // Combine the data
      const combined = followsData.map(follow => {
        const company = companiesData?.find(c => c.id === follow.follower_id);
        return {
          id: follow.id,
          follower_id: follow.follower_id,
          created_at: follow.created_at,
          company: company || { id: follow.follower_id, name: 'Unbekannt', logo_url: null, industry: null, main_location: null }
        };
      });

      setCompanyFollowRequests(combined as any);
    } catch (error) {
      console.error('Error fetching company follow requests:', error);
      setCompanyFollowRequests([]);
    }
  }, [user]);

  const fetchFollowedCompanies = useCallback(async () => {
    if (!user) return;
    
    try {
      // First get the follow records
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('id, followee_id, created_at')
        .eq('follower_id', user.id)
        .eq('follower_type', 'profile')
        .eq('followee_type', 'company')
        .eq('status', 'accepted');

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowedCompanies([]);
        return;
      }

      // Then get the company details
      const companyIds = followsData.map(f => f.followee_id);
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, logo_url, industry, main_location')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      // Combine the data
      const combined = followsData.map(follow => {
        const company = companiesData?.find(c => c.id === follow.followee_id);
        return {
          id: follow.id,
          followee_id: follow.followee_id,
          created_at: follow.created_at,
          company: company || { id: follow.followee_id, name: 'Unbekannt', logo_url: null, industry: null, main_location: null }
        };
      });

      setFollowedCompanies(combined as any);
    } catch (error) {
      console.error('Error fetching followed companies:', error);
      setFollowedCompanies([]);
    }
  }, [user]);

  const acceptCompanyFollow = useCallback(async (followId: string, companyId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // 1. Update follow request to accepted
      const { error: updateError } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('id', followId);

      if (updateError) throw updateError;

      // 2. Automatically follow back (Profile → Company)
      const { error: insertError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          follower_type: 'profile',
          followee_id: companyId,
          followee_type: 'company',
          status: 'accepted'
        });

      if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
        throw insertError;
      }

      // 3. Immediately remove from pending requests list
      setCompanyFollowRequests(prev => prev.filter(req => req.id !== followId));

      toast({
        title: 'Anfrage angenommen',
        description: 'Sie folgen dem Unternehmen jetzt und es kann Ihre Posts sehen.',
      });

      // 4. Refetch both lists to ensure consistency
      await Promise.all([fetchCompanyFollowRequests(), fetchFollowedCompanies()]);
    } catch (error) {
      console.error('Error accepting company follow:', error);
      toast({
        title: 'Fehler',
        description: 'Die Anfrage konnte nicht angenommen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, fetchCompanyFollowRequests, fetchFollowedCompanies]);

  const declineCompanyFollow = useCallback(async (followId: string) => {
    setLoading(true);
    try {
      // Delete the follow request instead of updating to 'rejected'
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', followId);

      if (error) throw error;

      // Immediately remove from pending requests list
      setCompanyFollowRequests(prev => prev.filter(req => req.id !== followId));

      toast({
        title: 'Anfrage abgelehnt',
        description: 'Die Follow-Anfrage wurde abgelehnt.',
      });

      // Refetch to ensure consistency
      await fetchCompanyFollowRequests();
    } catch (error) {
      console.error('Error declining company follow:', error);
      toast({
        title: 'Fehler',
        description: 'Die Anfrage konnte nicht abgelehnt werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchCompanyFollowRequests]);

  const unfollowCompany = useCallback(async (followId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', followId);

      if (error) throw error;

      toast({
        title: 'Erfolgreich',
        description: 'Sie folgen dem Unternehmen nicht mehr.',
      });

      await fetchFollowedCompanies();
    } catch (error) {
      console.error('Error unfollowing company:', error);
      toast({
        title: 'Fehler',
        description: 'Das Unternehmen konnte nicht entfolgt werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchFollowedCompanies]);

  useEffect(() => {
    if (user) {
      fetchCompanyFollowRequests();
      fetchFollowedCompanies();
    }
  }, [user, fetchCompanyFollowRequests, fetchFollowedCompanies]);

  // Realtime subscription for follows table to automatically update when status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('follows-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `followee_id=eq.${user.id}`,
        },
        (payload) => {
          // Refetch when any follow request changes
          fetchCompanyFollowRequests();
          fetchFollowedCompanies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCompanyFollowRequests, fetchFollowedCompanies]);

  return {
    companyFollowRequests,
    followedCompanies,
    loading,
    acceptCompanyFollow,
    declineCompanyFollow,
    unfollowCompany,
    refetch: useCallback(() => {
      fetchCompanyFollowRequests();
      fetchFollowedCompanies();
    }, [fetchCompanyFollowRequests, fetchFollowedCompanies]),
  };
}
