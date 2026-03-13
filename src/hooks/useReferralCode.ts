import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ReferralStats {
  successful_referrals: number;
  is_contest_eligible: boolean;
}

export function useReferralCode() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async (): Promise<ReferralStats> => {
      if (!user?.id) return { successful_referrals: 0, is_contest_eligible: false };

      const userCode = `USER_${user.id.slice(0, 8).toUpperCase()}`;
      const { data } = await supabase
        .from('referral_tracking')
        .select('id')
        .eq('referral_code', userCode)
        .not('profile_completed_at', 'is', null);

      const count = Array.isArray(data) ? data.length : 0;

      return {
        successful_referrals: count,
        is_contest_eligible: count >= 1,
      };
    },
    enabled: !!user?.id,
  });

  const validateCode = async (code: string): Promise<boolean> => {
    if (!code || code.trim().length < 6) return false;
    const normalized = code.trim().toUpperCase();
    if (normalized.startsWith('USER_')) return true;
    const { data } = await supabase.from('creators').select('code').eq('code', normalized).eq('is_active', true).single();
    return !!data;
  };

  return {
    stats: stats ?? { successful_referrals: 0, is_contest_eligible: false },
    isLoading,
    validateCode,
  };
}
