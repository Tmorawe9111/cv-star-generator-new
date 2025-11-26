import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CompanyPeopleCarouselProps {
  companyId: string;
  companyName?: string;
  isOwner?: boolean;
  onAddPerson?: () => void;
}

interface TeamMember {
  user_id: string;
  vorname: string;
  nachname: string;
  avatar_url: string | null;
  job_position: string;
  is_current: boolean;
}

export function CompanyPeopleCarousel({ companyId, companyName, isOwner, onAddPerson }: CompanyPeopleCarouselProps) {
  // Fetch team from profiles.berufserfahrung via RPC
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['company-team-preview', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_company_team_by_id', {
        p_company_id: companyId,
        p_include_former: false // Only current employees for preview
      });

      if (error) {
        console.log('get_company_team_by_id not available:', error.message);
        return [];
      }
      return data as TeamMember[];
    },
    enabled: !!companyId
  });

  const currentEmployees = teamMembers?.filter(m => m.is_current) || [];
  const displayCount = 6; // Show max 6 avatars
  const displayMembers = currentEmployees.slice(0, displayCount);
  const remainingCount = Math.max(0, currentEmployees.length - displayCount);

  return (
    <Card className="p-2 sm:p-3 md:p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 md:p-4 pb-2 sm:pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          Mitarbeiter
          {currentEmployees.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({currentEmployees.length})
            </span>
          )}
        </CardTitle>
        {isOwner && onAddPerson && (
          <Button variant="outline" size="sm" onClick={onAddPerson}>
            + Hinzufügen
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0 md:pt-0">
        {isLoading && <div className="text-xs sm:text-sm text-muted-foreground">Lade Team...</div>}
        
        {!isLoading && currentEmployees.length === 0 && (
          <div className="text-center py-4 sm:py-6">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Noch keine Mitarbeiter verknüpft
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mitarbeiter erscheinen hier, wenn sie dieses Unternehmen in ihrer Berufserfahrung angeben.
            </p>
          </div>
        )}
        
        {!isLoading && currentEmployees.length > 0 && (
          <Link to="?tab=people" className="block group">
            {/* Instagram-style overlapping avatars */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                {/* Overlapping Avatars */}
                <div className="flex -space-x-3">
                  {displayMembers.map((member, index) => (
                    <Avatar 
                      key={member.user_id}
                      className={cn(
                        "h-10 w-10 sm:h-12 sm:w-12 border-2 border-white ring-2 ring-white",
                        "transition-transform hover:scale-110 hover:z-10"
                      )}
                      style={{ zIndex: displayCount - index }}
                    >
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs sm:text-sm font-semibold">
                        {member.vorname?.[0]}{member.nachname?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  
                  {/* +X more badge */}
                  {remainingCount > 0 && (
                    <div 
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-100 border-2 border-white ring-2 ring-white flex items-center justify-center"
                      style={{ zIndex: 0 }}
                    >
                      <span className="text-xs sm:text-sm font-semibold text-gray-600">
                        +{remainingCount}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Text next to avatars */}
                <div className="ml-3 sm:ml-4">
                  <p className="text-sm sm:text-base font-medium text-gray-900 group-hover:text-primary transition-colors">
                    {currentEmployees.length} {currentEmployees.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Profil anzeigen
                  </p>
                </div>
              </div>
              
              {/* Arrow */}
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
