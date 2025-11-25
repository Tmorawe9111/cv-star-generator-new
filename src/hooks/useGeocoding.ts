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
   * Verwendet direkt die postal_codes Tabelle (keine Edge Function nötig)
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
      // Direkt aus postal_codes Tabelle laden (hat lat/lon)
      let query = supabase.from('postal_codes').select('plz, ort, bundesland, lat, lon');
      
      if (postal_code) {
        query = query.eq('plz', postal_code);
      } else if (city) {
        query = query.ilike('ort', `%${city}%`);
      }

      const { data, error } = await query.limit(1).single();

      if (error || !data) {
        console.log('PLZ not found in database:', postal_code || city);
        setLoading(false);
        return null;
      }

      if (data.lat && data.lon) {
        setLoading(false);
        const fullAddress = [street, data.plz, data.ort, data.bundesland].filter(Boolean).join(', ');
        return {
          latitude: data.lat,
          longitude: data.lon,
          full_address: fullAddress,
          source: 'postal_codes',
        };
      }

      setLoading(false);
      return null;
    } catch (error: any) {
      console.error('Geocoding error:', error);
      setLoading(false);
      return null;
    }
  };

  /**
   * Reverse Geocoding: Koordinaten → Adresse
   * Findet die nächste PLZ basierend auf Koordinaten
   */
  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodingResult | null> => {
    setLoading(true);
    try {
      // Finde die nächste PLZ basierend auf Koordinaten (einfache Distanzberechnung)
      const { data, error } = await supabase
        .from('postal_codes')
        .select('plz, ort, bundesland, lat, lon')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .limit(1);

      if (error || !data || data.length === 0) {
        setLoading(false);
        return null;
      }

      // Für eine echte Reverse-Geocoding-Suche bräuchten wir eine Distanzberechnung
      // Hier geben wir erstmal null zurück, da die Funktion selten gebraucht wird
      setLoading(false);
      return null;
    } catch (error: any) {
      console.error('Reverse geocoding error:', error);
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

