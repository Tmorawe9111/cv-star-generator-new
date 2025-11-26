import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Building2, Star, Navigation, ExternalLink, X, ChevronRight } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  lat?: number | null;
  lon?: number | null;
}

export function CompanyLocationsCard({ companyId, isOwner }: CompanyLocationsCardProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['company-locations-preview', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_locations')
        .select('id, name, street, house_number, postal_code, city, country, is_primary, lat, lon')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .limit(5);

      if (error) throw error;
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <>
      {/* Apple-Style Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Standorte</h3>
                <p className="text-xs text-gray-500">{locations.length} Standort{locations.length !== 1 ? 'e' : ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Locations List */}
        <div className="px-3 pb-3">
          <div className="bg-gray-50/80 rounded-xl overflow-hidden divide-y divide-gray-100">
            {locations.map((location, index) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 text-left transition-all",
                  "hover:bg-gray-100/80 active:bg-gray-200/60 active:scale-[0.99]"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                  location.is_primary 
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20" 
                    : "bg-gray-200"
                )}>
                  <MapPin className={cn(
                    "h-4 w-4",
                    location.is_primary ? "text-white" : "text-gray-600"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{location.name}</span>
                    {location.is_primary && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                        <Star className="h-2.5 w-2.5" />
                        Haupt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {location.city}{location.postal_code ? `, ${location.postal_code}` : ''}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        {isOwner && (
          <div className="px-5 pb-4">
            <a 
              href="/unternehmen/einstellungen/standorte"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Standorte verwalten →
            </a>
          </div>
        )}
      </div>

      {/* Apple-Style Detail Modal */}
      {selectedLocation && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedLocation(null)}
        >
          <div 
            className={cn(
              "bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden",
              "animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 sm:slide-in-from-bottom-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Bar (Mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="relative p-6 pb-4">
              <button 
                onClick={() => setSelectedLocation(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>

              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                  selectedLocation.is_primary 
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30" 
                    : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30"
                )}>
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedLocation.name}</h2>
                    {selectedLocation.is_primary && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3" />
                        Hauptstandort
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">Standort Details</p>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="px-6 pb-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {selectedLocation.street && (
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0">Straße</span>
                    <span className="text-gray-900 text-sm font-medium">
                      {selectedLocation.street}{selectedLocation.house_number ? ` ${selectedLocation.house_number}` : ''}
                    </span>
                  </div>
                )}
                {(selectedLocation.postal_code || selectedLocation.city) && (
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0">Stadt</span>
                    <span className="text-gray-900 text-sm font-medium">
                      {selectedLocation.postal_code} {selectedLocation.city}
                    </span>
                  </div>
                )}
                {selectedLocation.country && (
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0">Land</span>
                    <span className="text-gray-900 text-sm font-medium">{selectedLocation.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="p-6 pt-2">
              <button
                onClick={() => openInMaps(selectedLocation)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm",
                  "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98]",
                  "transition-all shadow-lg shadow-blue-500/25"
                )}
              >
                <Navigation className="h-4 w-4" />
                In Google Maps öffnen
                <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
