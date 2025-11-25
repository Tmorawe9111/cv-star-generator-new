import { supabase } from '@/integrations/supabase/client';

/**
 * Parse PLZ and city from location string
 * Format: "PLZ Ort" or "Ort"
 */
export function parseLocation(location: string): { postalCode: string; city: string } {
  const parts = location.trim().split(/\s+/);
  
  if (parts.length >= 2 && /^\d{5}$/.test(parts[0])) {
    // Format: "PLZ Ort"
    return {
      postalCode: parts[0],
      city: parts.slice(1).join(' ')
    };
  }
  
  // Format: "Ort" - no PLZ
  return {
    postalCode: '',
    city: location.trim()
  };
}

/**
 * Save user profile location with coordinates
 * Updates plz, ort, location_id, latitude, longitude, and geog
 */
export async function saveProfileLocation(
  profileId: string,
  locationString: string
): Promise<{ success: boolean; error?: string; locationId?: number }> {
  try {
    const { postalCode, city } = parseLocation(locationString);
    
    // Update plz and ort text first
    const updateData: any = {
      ort: city || locationString,
    };
    if (postalCode) {
      updateData.plz = postalCode;
    }
    
    await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId);
    
    // If we have PLZ and city, get coordinates and save to locations table
    if (postalCode && city) {
      // Get coordinates from postal_codes or geocode
      const { data: coords, error: coordsError } = await supabase.rpc('get_location_coordinates', {
        p_postal_code: postalCode,
        p_city: city,
        p_country_code: 'DE'
      });
      
      if (coordsError) {
        console.error('Error getting coordinates:', coordsError);
        return { success: true }; // Location text is saved, coordinates are optional
      }
      
      if (coords && coords.length > 0 && coords[0].latitude && coords[0].longitude) {
        // Get bundesland from postal_codes if available
        let bundesland = '';
        if (postalCode) {
          const { data: postalData } = await supabase
            .from('postal_codes')
            .select('bundesland')
            .eq('plz', postalCode)
            .limit(1)
            .single();
          bundesland = postalData?.bundesland || '';
        }
        
        // Upsert location with coordinates
        const { data: locationId, error: locationError } = await supabase.rpc('upsert_location_with_coords', {
          p_postal_code: postalCode,
          p_city: city,
          p_state: bundesland,
          p_country_code: 'DE',
          p_lat: coords[0].latitude,
          p_lon: coords[0].longitude
        });
        
        if (locationError) {
          console.error('Error upserting location:', locationError);
          return { success: true }; // Location text is saved
        }
        
        if (locationId) {
          // Update profile with location_id and coordinates
          // Note: geog will be automatically updated by database trigger or computed from lat/lon
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              location_id: locationId,
              latitude: coords[0].latitude,
              longitude: coords[0].longitude,
            })
            .eq('id', profileId);
          
          if (updateError) {
            console.error('Error updating profile location:', updateError);
            return { success: true, error: updateError.message }; // Location text is saved
          }
          
          return { success: true, locationId };
        }
      }
    }
    
    // Location text is saved, coordinates are optional
    return { success: true };
  } catch (error: any) {
    console.error('Error saving profile location:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save company location with coordinates
 * Updates main_location, location_id, latitude, longitude, and geog
 */
export async function saveCompanyLocation(
  companyId: string,
  locationString: string
): Promise<{ success: boolean; error?: string; locationId?: number }> {
  try {
    const { postalCode, city } = parseLocation(locationString);
    
    // Update main_location text first
    await supabase
      .from('companies')
      .update({ main_location: locationString })
      .eq('id', companyId);
    
    // If we have PLZ and city, get coordinates and save to locations table
    if (postalCode && city) {
      // Get coordinates from postal_codes or geocode
      const { data: coords, error: coordsError } = await supabase.rpc('get_location_coordinates', {
        p_postal_code: postalCode,
        p_city: city,
        p_country_code: 'DE'
      });
      
      if (coordsError) {
        console.error('Error getting coordinates:', coordsError);
        return { success: true }; // Location text is saved, coordinates are optional
      }
      
      if (coords && coords.length > 0 && coords[0].latitude && coords[0].longitude) {
        // Get bundesland from postal_codes if available
        let bundesland = '';
        if (postalCode) {
          const { data: postalData } = await supabase
            .from('postal_codes')
            .select('bundesland')
            .eq('plz', postalCode)
            .limit(1)
            .single();
          bundesland = postalData?.bundesland || '';
        }
        
        // Upsert location with coordinates
        const { data: locationId, error: locationError } = await supabase.rpc('upsert_location_with_coords', {
          p_postal_code: postalCode,
          p_city: city,
          p_state: bundesland,
          p_country_code: 'DE',
          p_lat: coords[0].latitude,
          p_lon: coords[0].longitude
        });
        
        if (locationError) {
          console.error('Error upserting location:', locationError);
          return { success: true }; // Location text is saved
        }
        
        if (locationId) {
          // Update company with location_id and coordinates
          // Note: geog will be automatically updated by database trigger or computed from lat/lon
          const { error: updateError } = await supabase
            .from('companies')
            .update({
              location_id: locationId,
              latitude: coords[0].latitude,
              longitude: coords[0].longitude,
            })
            .eq('id', companyId);
          
          if (updateError) {
            console.error('Error updating company location:', updateError);
            return { success: true, error: updateError.message }; // Location text is saved
          }
          
          return { success: true, locationId };
        }
      }
    }
    
    // Location text is saved, coordinates are optional
    return { success: true };
  } catch (error: any) {
    console.error('Error saving company location:', error);
    return { success: false, error: error.message };
  }
}

