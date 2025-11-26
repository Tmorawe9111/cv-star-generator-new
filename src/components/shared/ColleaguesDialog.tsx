import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Users, Building2, MapPin, Calendar, UserPlus, ChevronRight, Briefcase, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ColleaguesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
}

interface Colleague {
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

export function ColleaguesDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  companyLogo
}: ColleaguesDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'current' | 'former'>('current');

  const { data, isLoading } = useQuery({
    queryKey: ['colleagues', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_company_employees', {
        p_company_id: companyId,
        p_include_former: true
      });

      if (error) throw error;
      return (data as Colleague[]).filter(c => c.user_id !== user?.id);
    },
    enabled: open && !!companyId
  });

  const currentColleagues = data?.filter(c => c.is_current) || [];
  const formerColleagues = data?.filter(c => !c.is_current && c.show_as_former) || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
  };

  const ColleagueCard = ({ colleague, isCurrent }: { colleague: Colleague; isCurrent: boolean }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <Link to={`/profil/${colleague.user_id}`} className="flex-shrink-0">
        <Avatar className="h-12 w-12 ring-2 ring-white shadow">
          <AvatarImage src={colleague.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {colleague.vorname?.[0]}{colleague.nachname?.[0]}
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link 
          to={`/profil/${colleague.user_id}`}
          className="font-semibold text-gray-900 hover:text-primary truncate block"
        >
          {colleague.vorname} {colleague.nachname}
        </Link>
        <p className="text-sm text-gray-600 truncate">
          {isCurrent ? colleague.position : `War: ${colleague.position}`}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {isCurrent ? (
              <>seit {formatDate(colleague.start_date)}</>
            ) : (
              <>{formatDate(colleague.start_date)} - {formatDate(colleague.end_date!)}</>
            )}
          </span>
        </div>
      </div>

      <Button variant="outline" size="sm" asChild>
        <Link to={`/profil/${colleague.user_id}`}>
          <UserPlus className="h-4 w-4 mr-1" />
          Vernetzen
        </Link>
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={companyLogo || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>Kollegen bei {companyName}</DialogTitle>
              <DialogDescription>
                Entdecke aktuelle und ehemalige Kollegen
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'former')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Aktuell ({currentColleagues.length})
            </TabsTrigger>
            <TabsTrigger value="former" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Ehemalige ({formerColleagues.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="current" className="m-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : currentColleagues.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Keine aktuellen Kollegen gefunden</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {currentColleagues.map(colleague => (
                    <ColleagueCard key={colleague.user_id} colleague={colleague} isCurrent={true} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="former" className="m-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : formerColleagues.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Keine ehemaligen Kollegen gefunden</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ehemalige können ihre Sichtbarkeit in den Einstellungen deaktivieren
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {formerColleagues.map(colleague => (
                    <ColleagueCard key={colleague.user_id} colleague={colleague} isCurrent={false} />
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="pt-4 border-t mt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link to={`/firma/${companyId}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Zum Unternehmensprofil
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

