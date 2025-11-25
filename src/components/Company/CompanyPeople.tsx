import React from "react";
import { useCompanyPeople } from "@/hooks/useCompanyPeople";
import { AuthorLine } from "@/components/shared/AuthorLine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface CompanyPeopleProps {
  companyId: string;
}

export function CompanyPeople({ companyId }: CompanyPeopleProps) {
  const { data: people, isLoading, isError, refetch } = useCompanyPeople(companyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted animate-pulse rounded w-32" />
                  <div className="h-3 bg-muted animate-pulse rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              Fehler beim Laden des Teams.
            </p>
            <button 
              onClick={() => refetch()}
              className="text-sm text-primary hover:underline"
            >
              Erneut versuchen
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!people?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team
          </CardTitle>
          <CardDescription>
            Bestätigte Mitarbeiter dieses Unternehmens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Noch keine bestätigten Mitarbeiter.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team ({people.length})
        </CardTitle>
        <CardDescription>
          Bestätigte Mitarbeiter dieses Unternehmens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {people.map((person) => (
            <div key={person.user_id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <AuthorLine
                avatarUrl={person.avatar_url}
                name={person.full_name}
                headline=""
                showCompany={false}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}