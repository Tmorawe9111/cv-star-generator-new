import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, Building2, MapPin, Calendar, ChevronRight, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyTeamTabProps {
  companyId: string;
  isOwner?: boolean;
}

interface Employee {
  user_id: string;
  vorname: string;
  nachname: string;
  avatar_url: string | null;
  position: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  show_as_former: boolean;
}

export function CompanyTeamTab({ companyId, isOwner }: CompanyTeamTabProps) {
  const [showAllCurrent, setShowAllCurrent] = useState(false);
  const [showAllFormer, setShowAllFormer] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['company-employees', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_company_employees', {
        p_company_id: companyId,
        p_include_former: true
      });

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!companyId
  });

  const currentEmployees = data?.filter(e => e.is_current) || [];
  const formerEmployees = data?.filter(e => !e.is_current && e.show_as_former) || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
  };

  const displayedCurrent = showAllCurrent ? currentEmployees : currentEmployees.slice(0, 6);
  const displayedFormer = showAllFormer ? formerEmployees : formerEmployees.slice(0, 6);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-semibold text-gray-700 mb-2">Noch keine Teammitglieder</p>
        <p className="text-sm text-gray-500">
          Mitarbeiter werden hier angezeigt, sobald sie ihre Erfahrung mit diesem Unternehmen verknüpfen.
        </p>
      </div>
    );
  }

  const EmployeeCard = ({ employee, isCurrent }: { employee: Employee; isCurrent: boolean }) => (
    <Link
      to={`/profil/${employee.user_id}`}
      className={cn(
        "block p-4 rounded-2xl border border-gray-100 bg-white shadow-sm",
        "hover:shadow-md hover:border-primary/30 transition-all",
        "active:scale-[0.98]"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-white shadow">
          <AvatarImage src={employee.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {employee.vorname?.[0]}{employee.nachname?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {employee.vorname} {employee.nachname}
          </p>
          <p className="text-sm text-primary font-medium truncate">{employee.position}</p>
          
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
            {employee.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {employee.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isCurrent ? (
                <>seit {formatDate(employee.start_date)}</>
              ) : (
                <>{formatDate(employee.start_date)} - {formatDate(employee.end_date!)}</>
              )}
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </div>
    </Link>
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-8">
      {/* Current Employees */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Aktuelle Mitarbeiter
            </h2>
            <span className="text-sm text-gray-500">({currentEmployees.length})</span>
          </div>
        </div>

        {currentEmployees.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <Briefcase className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Keine aktuellen Mitarbeiter verknüpft</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedCurrent.map(employee => (
                <EmployeeCard key={employee.user_id} employee={employee} isCurrent={true} />
              ))}
            </div>
            {currentEmployees.length > 6 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllCurrent(!showAllCurrent)}
                >
                  {showAllCurrent ? 'Weniger anzeigen' : `Alle ${currentEmployees.length} anzeigen`}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Former Employees */}
      {formerEmployees.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Ehemalige Mitarbeiter
              </h2>
              <span className="text-sm text-gray-500">({formerEmployees.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedFormer.map(employee => (
              <EmployeeCard key={employee.user_id} employee={employee} isCurrent={false} />
            ))}
          </div>
          {formerEmployees.length > 6 && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllFormer(!showAllFormer)}
              >
                {showAllFormer ? 'Weniger anzeigen' : `Alle ${formerEmployees.length} anzeigen`}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

