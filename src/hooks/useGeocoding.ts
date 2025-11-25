import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  full_address?: string;
  source?: string;
  location_id?: number;
}

export interface ReverseGeocodingResult {
  postal_code?: string;
  city?: string;
  street?: string;
  state?: string;
  country_code: string;
  full_address: string;
  latitude: number;
  longitude: number;
}

/**
 * Hook für Geocoding (Adresse → Koordinaten) und Reverse Geocoding (Koordinaten → Adresse)
 * Verwendet Nominatim API (OpenStreetMap - kostenlos)
 */
export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Geocode eine Adresse (PLZ, Stadt, Straße) zu Koordinaten
   */
  const geocodeAddress = async (
    postal_code?: string,
    city?: string,
    street?: string,
    country_code: string = 'DE'
  ): Promise<GeocodingResult | null> => {
    if (!postal_code && !city) {
      toast({
        title: 'Fehler',
        description: 'PLZ oder Stadt ist erforderlich',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      // 1. Versuche zuerst Datenbank-Lookup (schneller, keine API-Calls)
      const { data: dbResult, error: dbError } = await supabase.rpc(
        'get_location_coordinates',
        {
          p_postal_code: postal_code || null,
          p_city: city || null,
          p_street: street || null,
          p_country_code: country_code,
        }
      );

      if (!dbError && dbResult && dbResult.length > 0 && dbResult[0].latitude) {
        setLoading(false);
        return {
          latitude: dbResult[0].latitude,
          longitude: dbResult[0].longitude,
          full_address: dbResult[0].full_address || undefined,
          source: dbResult[0].source,
          location_id: dbResult[0].location_id || undefined,
        };
      }

      // 2. Falls nicht in DB, rufe Nominatim API auf
      const { data, error } = await supabase.functions.invoke('nominatim-geocode', {
        body: {
          type: 'geocode',
          postal_code: postal_code || null,
          city: city || null,
          street: street || null,
          country_code,
          use_cache: true,
        },
      });

      if (error) {
        console.error('Geocoding error:', error);
        toast({
          title: 'Fehler beim Geocoding',
          description: error.message || 'Standort konnte nicht gefunden werden',
          variant: 'destructive',
        });
        setLoading(false);
        return null;
      }

      if (!data || !data.latitude || !data.longitude) {
        toast({
          title: 'Standort nicht gefunden',
          description: 'Bitte überprüfe PLZ und Stadt',
          variant: 'destructive',
        });
        setLoading(false);
        return null;
      }

      setLoading(false);
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        full_address: data.full_address,
        source: data.source || 'nominatim',
      };
    } catch (error: any) {
      console.error('Geocoding error:', error);
      toast({
        title: 'Fehler',
        description: error?.message || 'Standort konnte nicht gefunden werden',
        variant: 'destructive',
      });
      setLoading(false);
      return null;
    }
  };

  /**
   * Reverse Geocoding: Koordinaten → Adresse
   */
  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodingResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('nominatim-geocode', {
        body: {
          type: 'reverse',
          latitude,
          longitude,
        },
      });

      if (error) {
        console.error('Reverse geocoding error:', error);
        toast({
          title: 'Fehler beim Reverse Geocoding',
          description: error.message || 'Adresse konnte nicht gefunden werden',
          variant: 'destructive',
        });
        setLoading(false);
        return null;
      }

      if (!data) {
        setLoading(false);
        return null;
      }

      setLoading(false);
      return {
        postal_code: data.postal_code || undefined,
        city: data.city || undefined,
        street: data.street || undefined,
        state: data.state || undefined,
        country_code: data.country_code || 'DE',
        full_address: data.full_address,
        latitude: data.latitude,
        longitude: data.longitude,
      };
    } catch (error: any) {
      console.error('Reverse geocoding error:', error);
      toast({
        title: 'Fehler',
        description: error?.message || 'Adresse konnte nicht gefunden werden',
        variant: 'destructive',
      });
      setLoading(false);
      return null;
    }
  };

  return {
    geocodeAddress,
    reverseGeocode,
    loading,
  };
}

/**
 * Hook für Radius-Suche
 */
export function useRadiusSearch() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Suche Profile innerhalb eines Radius (km)
   */
  const searchWithinRadius = async (
    latitude: number,
    longitude: number,
    radius_km: number = 50
  ): Promise<Array<{ profile_id: string; distance_km: number }> | null> => {
    setLoading(true);
    try {
      // Verwende direkte Koordinaten-Suche (funktioniert mit oder ohne location_id)
      const { data, error } = await supabase.rpc('search_profiles_within_radius', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_radius_km: radius_km,
        p_location_id: null, // Wird automatisch aus Koordinaten erstellt
      });

      if (error) {
        // Fallback: direkte Koordinaten-Suche wenn location_id nicht funktioniert
        const { data: fallbackData, error: fallbackError } = await supabase.rpc(
          'search_profiles_within_radius_by_coords',
          {
            p_latitude: latitude,
            p_longitude: longitude,
            p_radius_km: radius_km,
          }
        );

        if (fallbackError) throw fallbackError;
        setLoading(false);
        return fallbackData || [];
      }

      setLoading(false);
      return data || [];
    } catch (error: any) {
      console.error('Radius search error:', error);
      toast({
        title: 'Fehler bei Radius-Suche',
        description: error?.message || 'Suche konnte nicht durchgeführt werden',
        variant: 'destructive',
      });
      setLoading(false);
      return null;
    }
  };

  return {
    searchWithinRadius,
    loading,
  };
}

