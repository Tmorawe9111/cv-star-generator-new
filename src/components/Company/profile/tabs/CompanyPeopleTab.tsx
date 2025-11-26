import { useCompanyPeople } from "@/hooks/useCompanyPeople";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Users, Building2, MapPin, Calendar, ChevronRight, Briefcase, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { AddEmployeeDialog } from "../AddEmployeeDialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { FirstEmployeeCTA } from "@/components/shared/FirstEmployeeCTA";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CompanyPeopleTabProps {
  companyId: string;
  isOwner?: boolean;
}

interface Employee {
  user_id: string;
  vorname: string;
  nachname: string;
  avatar_url: string | null;
  job_position: string;
  job_location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  show_as_former: boolean;
}

export function CompanyPeopleTab({ companyId, isOwner }: CompanyPeopleTabProps) {
  const { data: people, refetch, isLoading: legacyLoading } = useCompanyPeople(companyId);
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAllCurrent, setShowAllCurrent] = useState(false);
  const [showAllFormer, setShowAllFormer] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // New: Fetch employees from user_experiences
  const { data: linkedEmployees, isLoading: linkedLoading } = useQuery({
    queryKey: ['company-employees', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_company_employees', {
        p_company_id: companyId,
        p_include_former: true
      });

      if (error) {
        console.log('get_company_employees not available yet:', error.message);
        return [];
      }
      return data as Employee[];
    },
    enabled: !!companyId
  });

  const currentEmployees = linkedEmployees?.filter(e => e.is_current) || [];
  const formerEmployees = linkedEmployees?.filter(e => !e.is_current && e.show_as_former) || [];
  const hasLinkedEmployees = (currentEmployees.length + formerEmployees.length) > 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
  };

  const displayedCurrent = showAllCurrent ? currentEmployees : currentEmployees.slice(0, 6);
  const displayedFormer = showAllFormer ? formerEmployees : formerEmployees.slice(0, 6);

  const isLoading = legacyLoading || linkedLoading;

  // Handle removing employee link (Veto-Recht)
  const handleRemoveEmployee = async () => {
    if (!employeeToRemove) return;
    
    setIsRemoving(true);
    try {
      const { data, error } = await supabase.rpc('company_remove_employee_link', {
        p_company_id: companyId,
        p_user_id: employeeToRemove.user_id
      });

      if (error) throw error;

      toast({
        title: 'Verknüpfung aufgehoben',
        description: `${employeeToRemove.vorname} ${employeeToRemove.nachname} wurde benachrichtigt.`,
      });

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['company-employees', companyId] });
    } catch (error) {
      console.error('Error removing employee:', error);
      toast({
        title: 'Fehler',
        description: 'Die Verknüpfung konnte nicht aufgehoben werden.',
        variant: 'destructive'
      });
    } finally {
      setIsRemoving(false);
      setEmployeeToRemove(null);
    }
  };

  const EmployeeCard = ({ employee, isCurrent }: { employee: Employee; isCurrent: boolean }) => (
    <div
      className={cn(
        "relative p-4 rounded-2xl border border-gray-100 bg-white shadow-sm",
        "hover:shadow-md hover:border-primary/30 transition-all"
      )}
    >
      <Link to={`/profil/${employee.user_id}`} className="block">
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
            <p className="text-sm text-primary font-medium truncate">{employee.job_position}</p>
            
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
              {employee.job_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {employee.job_location}
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
      
      {/* Veto Button for owners */}
      {isOwner && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
          onClick={(e) => {
            e.preventDefault();
            setEmployeeToRemove(employee);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {isOwner && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Mitarbeiter hinzufügen
          </Button>
        </div>
      )}
      
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Lade Mitarbeiter...
        </div>
      )}

      {/* New: Linked Employees Section */}
      {hasLinkedEmployees && (
        <div className="space-y-8 mb-8">
          {/* Current Employees */}
          {currentEmployees.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Aktuelle Mitarbeiter
                </h2>
                <span className="text-sm text-gray-500">({currentEmployees.length})</span>
              </div>

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
            </section>
          )}

          {/* Former Employees */}
          {formerEmployees.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-gray-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Ehemalige Mitarbeiter
                </h2>
                <span className="text-sm text-gray-500">({formerEmployees.length})</span>
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
      )}

      {/* Legacy: Manual employees (from company_users) */}
      {!isLoading && !hasLinkedEmployees && !people?.length && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold text-gray-700 mb-2">Noch keine Teammitglieder</p>
              <p className="text-muted-foreground mb-4 text-sm">
                Mitarbeiter werden hier angezeigt, sobald sie ihre Erfahrung mit diesem Unternehmen verknüpfen.
              </p>
              {isOwner && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Mitarbeiter hinzufügen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Legacy employees grid */}
      {people && people.length > 0 && !hasLinkedEmployees && (
        <div className="grid md:grid-cols-2 gap-4">
          {people.map((person) => (
            <Card key={person.user_id}>
              <CardContent className="p-4">
                <Link to={`/u/${person.user_id}`} className="flex items-center gap-3 group">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={person.avatar_url || undefined} />
                    <AvatarFallback>{person.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold group-hover:text-primary transition-colors">
                      {person.full_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Mitarbeiter
                    </div>
                  </div>
                  {isOwner && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        // handleRemovePerson(person.user_id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Employee Dialog */}
      {isOwner && (
        <AddEmployeeDialog 
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          companyId={companyId}
          onSuccess={refetch}
        />
      )}

      {/* Remove Employee Confirmation Dialog */}
      <AlertDialog open={!!employeeToRemove} onOpenChange={() => setEmployeeToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verknüpfung aufheben?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Verknüpfung von <strong>{employeeToRemove?.vorname} {employeeToRemove?.nachname}</strong> mit 
              deinem Unternehmen wird aufgehoben. Die Person wird benachrichtigt und erscheint nicht mehr 
              im Team-Bereich.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveEmployee}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? 'Wird entfernt...' : 'Verknüpfung aufheben'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
