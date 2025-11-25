import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Briefcase, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface CompanyJobsCarouselProps {
  companyId: string;
  isOwner?: boolean;
}

export function CompanyJobsCarousel({ companyId, isOwner }: CompanyJobsCarouselProps) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["company-jobs-preview", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select("id, title, city, employment_type, created_at, is_active")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="p-2 sm:p-3 md:p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 md:p-4 pb-2 sm:pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
          <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
          Verfügbare Jobs
        </CardTitle>
        {isOwner && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/unternehmen/stellenanzeigen/neu">+ Job posten</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0 md:pt-0">
        {isLoading && <div className="text-xs sm:text-sm text-muted-foreground">Lade Jobs...</div>}
        
        {!isLoading && jobs?.length === 0 && (
          <div className="text-center py-4 sm:py-6 md:py-8">
            <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">Keine aktiven Jobs</p>
          </div>
        )}
        
        {!isLoading && jobs && jobs.length > 0 && (
          <>
            <Carousel className="w-full">
              <CarouselContent>
                {jobs.map((job) => (
                  <CarouselItem key={job.id}>
                    <Link to={`/jobs/${job.id}`}>
                      <div className="border rounded-lg p-2 sm:p-3 md:p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">{job.title}</h3>
                        <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                          {job.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {job.city}
                            </div>
                          )}
                          {job.employment_type && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {job.employment_type}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {jobs.length > 1 && (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              )}
            </Carousel>
            
            <Button variant="link" className="w-full mt-4" asChild>
              <Link to={`?tab=jobs`}>Alle {jobs.length} Jobs anzeigen →</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
