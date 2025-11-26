import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, GraduationCap, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DualAffiliationBadgesProps {
  userId: string;
  className?: string;
}

interface Affiliation {
  type: 'company' | 'school';
  entity_id: string | null;
  entity_name: string;
  entity_logo: string | null;
  position_or_degree: string | null;
  start_date: string | null;
  graduation_year: number | null;
}

export function DualAffiliationBadges({ userId, className }: DualAffiliationBadgesProps) {
  const { data: affiliations } = useQuery({
    queryKey: ['user-affiliations', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_current_affiliations', {
        p_user_id: userId
      });

      if (error) {
        console.log('get_user_current_affiliations not available:', error.message);
        return [];
      }
      return data as Affiliation[];
    },
    enabled: !!userId
  });

  if (!affiliations || affiliations.length === 0) {
    return null;
  }

  const companies = affiliations.filter(a => a.type === 'company');
  const schools = affiliations.filter(a => a.type === 'school');

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {companies.map((company, idx) => (
        <Link
          key={`company-${idx}`}
          to={company.entity_id ? `/firma/${company.entity_id}` : '#'}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
            "bg-blue-50 hover:bg-blue-100 transition-colors",
            "border border-blue-200"
          )}
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src={company.entity_logo || undefined} />
            <AvatarFallback className="bg-blue-200 text-blue-700 text-xs">
              <Building2 className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-blue-700">
            <Briefcase className="h-3 w-3 inline mr-1" />
            Im Team bei {company.entity_name}
          </span>
        </Link>
      ))}

      {schools.map((school, idx) => (
        <Link
          key={`school-${idx}`}
          to={school.entity_id ? `/schule/${school.entity_id}` : '#'}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
            "bg-amber-50 hover:bg-amber-100 transition-colors",
            "border border-amber-200"
          )}
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src={school.entity_logo || undefined} />
            <AvatarFallback className="bg-amber-200 text-amber-700 text-xs">
              <GraduationCap className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-amber-700">
            <GraduationCap className="h-3 w-3 inline mr-1" />
            {school.graduation_year 
              ? `Jahrgang ${school.graduation_year} bei ${school.entity_name}`
              : `Aktuell bei ${school.entity_name}`
            }
          </span>
        </Link>
      ))}
    </div>
  );
}

