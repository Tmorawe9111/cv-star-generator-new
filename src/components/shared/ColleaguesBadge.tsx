import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ColleaguesDialog } from './ColleaguesDialog';
import { cn } from '@/lib/utils';

interface ColleaguesBadgeProps {
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  className?: string;
}

export function ColleaguesBadge({ companyId, companyName, companyLogo, className }: ColleaguesBadgeProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: counts } = useQuery({
    queryKey: ['colleague-counts', companyId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_colleague_counts', {
        p_user_id: user?.id || '',
        p_company_id: companyId
      });

      if (error) throw error;
      return data?.[0] || { current_colleagues: 0, former_colleagues: 0 };
    },
    enabled: !!companyId && !!user?.id
  });

  if (!counts || (counts.current_colleagues === 0 && counts.former_colleagues === 0)) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
          "bg-primary/10 hover:bg-primary/20 transition-colors",
          "text-xs font-medium text-primary",
          className
        )}
      >
        <Users className="h-3 w-3" />
        <span>
          {counts.current_colleagues > 0 && `${counts.current_colleagues} Kollegen`}
          {counts.current_colleagues > 0 && counts.former_colleagues > 0 && ' · '}
          {counts.former_colleagues > 0 && `${counts.former_colleagues} Ehemalige`}
        </span>
      </button>

      <ColleaguesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        companyName={companyName}
        companyLogo={companyLogo}
      />
    </>
  );
}

