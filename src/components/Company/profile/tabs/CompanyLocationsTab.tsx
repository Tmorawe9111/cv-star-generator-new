import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Building2, Star, Navigation, ExternalLink } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface CompanyLocationsTabProps {
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
  lat?: number | null;
  lon?: number | null;
}

export function CompanyLocationsTab({ companyId, isOwner }: CompanyLocationsTabProps) {
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['company-locations-full', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_locations')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching locations:', error);
        return [];
      }
      
      // Fallback: Create location from companies table if none exist
      if (!data || data.length === 0) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('street, house_number, postal_code, city, location, country')
          .eq('id', companyId)
          .single();
        
        if (companyData && (companyData.city || companyData.location || companyData.street)) {
          let lat: number | null = null;
          let lon: number | null = null;
          
          if (companyData.postal_code) {
            const { data: plzData } = await supabase
              .from('postal_codes')
              .select('lat, lon')
              .eq('plz', companyData.postal_code)
              .single();
            if (plzData) {
              lat = plzData.lat;
              lon = plzData.lon;
            }
          }
          
          // Return virtual location for display
          return [{
            id: 'virtual-' + companyId,
            name: 'Hauptstandort',
            street: companyData.street,
            house_number: companyData.house_number,
            postal_code: companyData.postal_code,
            city: companyData.city || companyData.location,
            country: companyData.country || 'Deutschland',
            is_primary: true,
            lat,
            lon,
          }] as Location[];
        }
      }
      
      return (data || []) as Location[];
    },
    enabled: !!companyId,
  });

  const openInMaps = (location: Location) => {
    const address = [
      location.street,
      location.house_number,
      location.postal_code,
      location.city,
      location.country
    ].filter(Boolean).join(' ');
    
    const url = location.lat && location.lon
      ? `https://www.google.com/maps?q=${location.lat},${location.lon}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Standorte</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {locations.length} Standort{locations.length !== 1 ? 'e' : ''}
          </p>
        </div>
        {isOwner && (
          <Button asChild>
            <Link to="/unternehmen/einstellungen/standorte">
              Standorte verwalten
            </Link>
          </Button>
        )}
      </div>

      {locations.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">Keine Standorte</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Dieses Unternehmen hat noch keine Standorte hinzugefügt.
          </p>
          {isOwner && (
            <Button asChild>
              <Link to="/unternehmen/einstellungen/standorte">
                Standort hinzufügen
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((location) => (
            <Card 
              key={location.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {location.name}
                        {location.is_primary && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Star className="h-3 w-3" />
                            Hauptstandort
                          </span>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-muted-foreground">
                  {location.street && (
                    <div>{location.street}{location.house_number ? ` ${location.house_number}` : ''}</div>
                  )}
                  {(location.postal_code || location.city) && (
                    <div>{location.postal_code} {location.city}</div>
                  )}
                  {location.country && <div>{location.country}</div>}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 w-full"
                  onClick={() => openInMaps(location)}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  In Google Maps öffnen
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

