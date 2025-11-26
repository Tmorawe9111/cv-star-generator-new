import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Building2, Star } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface CompanyLocationsCardProps {
  companyId: string;
  isOwner?: boolean;
}

interface Location {
  id: string;
  name: string;
  street?: string | null;
  house_number?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  is_primary: boolean;
}

export function CompanyLocationsCard({ companyId, isOwner }: CompanyLocationsCardProps) {
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['company-locations-preview', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_locations')
        .select('id, name, street, house_number, postal_code, city, country, is_primary')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .limit(3);

      if (error) throw error;
      return (data || []) as Location[];
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <Card className="p-2 sm:p-3 md:p-4">
        <CardHeader className="p-2 sm:p-3 md:p-4 pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Standorte
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-gray-100 rounded-lg" />
            <div className="h-12 bg-gray-100 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <Card className="p-2 sm:p-3 md:p-4">
      <CardHeader className="p-2 sm:p-3 md:p-4 pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
          Standorte
          <span className="text-xs font-normal text-muted-foreground">({locations.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 md:p-4 pt-0 space-y-3">
        {locations.map((location) => (
          <div 
            key={location.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{location.name}</span>
                {location.is_primary && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    <Star className="h-3 w-3" />
                    Haupt
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {location.street && (
                  <span>{location.street}{location.house_number ? ` ${location.house_number}` : ''}, </span>
                )}
                {location.postal_code} {location.city}
              </div>
            </div>
          </div>
        ))}
        
        <Button variant="link" className="p-0 h-auto text-xs sm:text-sm" asChild>
          <Link to={isOwner ? '/unternehmen/einstellungen/standorte' : '?tab=locations'}>
            {isOwner ? 'Standorte verwalten →' : 'Alle Standorte anzeigen →'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

