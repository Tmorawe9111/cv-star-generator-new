import { useCompanyPeople } from "@/hooks/useCompanyPeople";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

interface CompanyPeopleCarouselProps {
  companyId: string;
  isOwner?: boolean;
  onAddPerson?: () => void;
}

export function CompanyPeopleCarousel({ companyId, isOwner, onAddPerson }: CompanyPeopleCarouselProps) {
  const { data: people, isLoading } = useCompanyPeople(companyId);

  return (
    <Card className="p-2 sm:p-3 md:p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 md:p-4 pb-2 sm:pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          Mitarbeiter
        </CardTitle>
        {isOwner && onAddPerson && (
          <Button variant="outline" size="sm" onClick={onAddPerson}>
            + Hinzufügen
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0 md:pt-0">
        {isLoading && <div className="text-xs sm:text-sm text-muted-foreground">Lade Team...</div>}
        
        {!isLoading && !people?.length && (
          <div className="text-center py-4 sm:py-6 md:py-8">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">Noch keine Mitarbeiter</p>
          </div>
        )}
        
        {!isLoading && people && people.length > 0 && (
          <>
            <Carousel className="w-full">
              <CarouselContent>
                {people.slice(0, 5).map((person) => (
                  <CarouselItem key={person.user_id}>
                    <Link to={`/u/${person.user_id}`}>
                      <div className="border rounded-lg p-2 sm:p-3 md:p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                            <AvatarImage src={person.avatar_url || undefined} />
                            <AvatarFallback>{person.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm sm:text-base">{person.full_name}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">Mitarbeiter</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {people.length > 1 && (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              )}
            </Carousel>
            
            <Button variant="link" className="w-full mt-4" asChild>
              <Link to={`?tab=people`}>Alle {people.length} Mitarbeiter anzeigen →</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
