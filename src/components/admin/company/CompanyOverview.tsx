import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminCompanyAccessCodeInput } from "./AdminCompanyAccessCodeInput";

interface CompanyOverviewProps {
  companyId: string;
}

export function CompanyOverview({ companyId }: CompanyOverviewProps) {
  const { data: company, isLoading } = useQuery({
    queryKey: ["admin-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!company) {
    return <div>Unternehmen nicht gefunden</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {company.logo_url && (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div>
                <CardTitle className="text-2xl">{company.name}</CardTitle>
                <Badge variant={company.account_status === 'active' ? 'default' : 'secondary'} className="mt-2">
                  {company.account_status}
                </Badge>
              </div>
            </div>
            <AdminCompanyAccessCodeInput companyId={companyId} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{company.industry || "Keine Branche"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{company.location || company.main_location || "Kein Standort"}</span>
            </div>
            {company.primary_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{company.primary_email}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{company.phone}</span>
              </div>
            )}
            {company.website_url && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {company.website_url}
                </a>
              </div>
            )}
          </div>

          {company.description && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Beschreibung</h4>
              <p className="text-sm text-muted-foreground">{company.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
