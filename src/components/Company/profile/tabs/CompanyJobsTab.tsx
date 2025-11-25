import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface CompanyJobsTabProps {
  companyId: string;
  isOwner?: boolean;
}

export function CompanyJobsTab({ companyId, isOwner }: CompanyJobsTabProps) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["company-jobs-full", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const visibleJobs = (jobs ?? []).filter(job => {
    const status = job.status?.toLowerCase();
    return status !== "inactive" && status !== "deleted";
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {isOwner && (
        <div className="mb-6 flex justify-end">
          <Button asChild>
            <Link to="/unternehmen/stellenanzeigen/neu">
              <Plus className="mr-2 h-4 w-4" />
              Neue Stellenanzeige erstellen
            </Link>
          </Button>
        </div>
      )}
      
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Lade Jobs...
        </div>
      )}

      {!isLoading && visibleJobs.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Noch keine Jobs ausgeschrieben
              </p>
              {isOwner && (
                <Button asChild>
                  <Link to="/unternehmen/stellenanzeigen/neu">
                    <Plus className="mr-2 h-4 w-4" />
                    Ersten Job erstellen
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-4">
        {visibleJobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    {job.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.city}
                      </div>
                    )}
                    {job.employment_type && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.employment_type}
                      </div>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/company/jobs/${job.id}/edit`}>
                      <Edit2 className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {job.description_md || 'Keine Beschreibung verfügbar'}
              </p>
              <Button variant="link" asChild className="px-0 mt-2">
                <Link to={`/jobs/${job.id}`}>Details ansehen →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
