// Nominatim Geocoding API Integration (OpenStreetMap - 100% kostenlos)
// Geocoding: Adresse → Koordinaten
// Reverse Geocoding: Koordinaten → Adresse

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const CACHE_TTL_HOURS = 24 * 7; // 7 Tage Cache

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      type, // 'geocode' oder 'reverse'
      postal_code,
      city,
      street,
      country_code = 'DE',
      latitude,
      longitude,
      use_cache = true
    } = await req.json();

    if (type === 'geocode') {
      // Geocoding: Adresse → Koordinaten
      if (!postal_code && !city) {
        return new Response(
          JSON.stringify({ error: 'postal_code or city required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prüfe Cache zuerst
      if (use_cache) {
        const addressHash = await createAddressHash(postal_code, city, street, country_code);
        const { data: cached } = await supabase
          .from('geocoding_cache')
          .select('latitude, longitude, full_address, updated_at')
          .eq('address_hash', addressHash)
          .single();

        if (cached && cached.updated_at) {
          const cacheAge = (Date.now() - new Date(cached.updated_at).getTime()) / (1000 * 60 * 60);
          if (cacheAge < CACHE_TTL_HOURS) {
            return new Response(
              JSON.stringify({
                latitude: cached.latitude,
                longitude: cached.longitude,
                full_address: cached.full_address,
                source: 'cache'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      // Prüfe Datenbank (postal_codes, locations)
      const { data: dbResult } = await supabase.rpc('get_location_coordinates', {
        p_postal_code: postal_code || null,
        p_city: city || null,
        p_street: street || null,
        p_country_code: country_code
      });

      if (dbResult && dbResult.length > 0 && dbResult[0].latitude) {
        return new Response(
          JSON.stringify({
            latitude: dbResult[0].latitude,
            longitude: dbResult[0].longitude,
            full_address: dbResult[0].full_address,
            source: dbResult[0].source
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Wenn nicht in DB, rufe Nominatim API auf
      const query = buildNominatimQuery(postal_code, city, street, country_code);
      const nominatimUrl = `${NOMINATIM_BASE_URL}/search?${query}&format=json&limit=1&countrycodes=${country_code.toLowerCase()}`;
      
      // Wichtig: User-Agent Header ist erforderlich für Nominatim
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'BeVisiblle/1.0 (contact@bevisiblle.de)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Location not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      const fullAddress = result.display_name;

      // Cache das Ergebnis
      if (use_cache && lat && lon) {
        const addressHash = await createAddressHash(postal_code, city, street, country_code);
        await supabase
          .from('geocoding_cache')
          .upsert({
            address_hash: addressHash,
            postal_code: postal_code || null,
            city: city || null,
            street: street || null,
            country_code: country_code,
            latitude: lat,
            longitude: lon,
            full_address: fullAddress
          }, {
            onConflict: 'address_hash'
          });
      }

      return new Response(
        JSON.stringify({
          latitude: lat,
          longitude: lon,
          full_address: fullAddress,
          source: 'nominatim'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'reverse') {
      // Reverse Geocoding: Koordinaten → Adresse
      if (!latitude || !longitude) {
        return new Response(
          JSON.stringify({ error: 'latitude and longitude required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const nominatimUrl = `${NOMINATIM_BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'BeVisiblle/1.0 (contact@bevisiblle.de)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.address) {
        return new Response(
          JSON.stringify({ error: 'Address not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const address = data.address;
      return new Response(
        JSON.stringify({
          postal_code: address.postcode || null,
          city: address.city || address.town || address.village || null,
          street: address.road || null,
          state: address.state || null,
          country_code: address.country_code?.toUpperCase() || 'DE',
          full_address: data.display_name,
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lon)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Use "geocode" or "reverse"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: error?.message ?? 'unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createAddressHash(postal_code: string | null, city: string | null, street: string | null, country_code: string): Promise<string> {
  const text = `${postal_code || ''}|${(city || '').toLowerCase()}|${(street || '').toLowerCase()}|${country_code}`;
  // Verwende Web Crypto API für MD5-ähnlichen Hash
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

function buildNominatimQuery(postal_code: string | null, city: string | null, street: string | null, country_code: string): string {
  const parts: string[] = [];
  
  if (street) parts.push(street);
  if (postal_code) parts.push(postal_code);
  if (city) parts.push(city);
  if (country_code) parts.push(country_code);
  
  return `q=${encodeURIComponent(parts.join(', '))}`;
}

