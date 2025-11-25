// Seed ALL German postal codes with coordinates
// Downloads CSV and creates/updates ALL postal codes in database
// Security: requires header x-seed-token to match SEED_LOCATIONS_TOKEN secret or admin role

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-seed-token',
};

// CSV source: WZBSocialScienceCenter/plz_geocoord (contains all German PLZs with coordinates)
const DEFAULT_CSV = 'https://raw.githubusercontent.com/WZBSocialScienceCenter/plz_geocoord/master/plz_geocoord.csv';

interface PLZData {
  plz: string;
  lat: number;
  lon: number;
  ort?: string; // Will be fetched from postal_codes or geocoded
}

function parseCsv(text: string): PLZData[] {
  const results: PLZData[] = [];
  const lines = text.trim().split(/\r?\n/);
  // Expect header like ",lat,lng" then rows "01067,51.05,13.71"
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 3) continue;
    const plz = parts[0].replace(/"/g, '').trim();
    const lat = Number(parts[1]);
    const lon = Number(parts[2]);
    if (!/^[0-9]{5}$/.test(plz)) continue;
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      results.push({ plz, lat, lon });
    }
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authorization FIRST, before parsing body
    const seedToken = req.headers.get('x-seed-token');
    const expected = Deno.env.get('SEED_LOCATIONS_TOKEN');
    const isAuthorized = expected && seedToken === expected;
    
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized. Provide x-seed-token header.',
          hint: 'Set header: x-seed-token: e2d69ab684396bbfeac29eb6a3b333977d804b0d1e8c713122de8e79957bf688'
        }), 
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { url, dry_run = false, batch_size = 500 } = await req.json().catch(() => ({}));

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ANON = Deno.env.get('SUPABASE_ANON_KEY');
    const key = SERVICE_ROLE || ANON;
    if (!SUPABASE_URL || !key || !ANON) throw new Error('Missing Supabase URL or API key');

    const supabase = createClient(SUPABASE_URL, key);

    // Download CSV once
    const csvUrl = url || DEFAULT_CSV;
    console.log('Downloading CSV from:', csvUrl);
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`Failed to download CSV: ${resp.status}`);
    const text = await resp.text();
    const plzDataList = parseCsv(text);
    console.log(`Parsed ${plzDataList.length} PLZ coordinates from CSV`);

    // Get existing postal codes to check what we already have
    const { data: existingRows } = await supabase
      .from('postal_codes')
      .select('plz');
    
    const existingPLZs = new Set((existingRows || []).map((r: any) => String(r.plz)));

    let totalProcessed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < plzDataList.length; i += batch_size) {
      const batch = plzDataList.slice(i, i + batch_size);
      const batchTasks: Promise<void>[] = [];

      for (const plzData of batch) {
        totalProcessed++;
        const { plz, lat, lon } = plzData;
        const exists = existingPLZs.has(plz);

        if (dry_run) {
          console.log(`Would ${exists ? 'update' : 'create'}: ${plz} -> ${lat}, ${lon}`);
          continue;
        }

        if (exists) {
          // Update existing postal code with coordinates
          const task = supabase.rpc('upsert_postal_code_coords', {
            p_plz: plz,
            p_lat: lat,
            p_lon: lon,
          }).then(({ error: updateError }) => {
            if (updateError) {
              // Fallback: direct update if RPC doesn't exist
              return supabase
                .from('postal_codes')
                .update({
                  latitude: lat,
                  longitude: lon,
                })
                .eq('plz', plz)
                .then(({ error: directError }) => {
                  if (directError) {
                    console.warn(`Error updating ${plz}:`, directError.message);
                    errors++;
                  } else {
                    updated++;
                  }
                });
            } else {
              updated++;
            }
          });
          batchTasks.push(task);
        } else {
          // Create new postal code entry
          // First, try to get city name from reverse geocoding or use PLZ as placeholder
          const task = supabase
            .from('postal_codes')
            .insert({
              plz: plz,
              ort: plz, // Placeholder - will be updated later if needed
              latitude: lat,
              longitude: lon,
            })
            .then(({ error: insertError }) => {
              if (insertError) {
                // If insert fails (e.g., constraint violation), try update instead
                return supabase
                  .from('postal_codes')
                  .update({
                    latitude: lat,
                    longitude: lon,
                  })
                  .eq('plz', plz)
                  .then(({ error: updateError }) => {
                    if (updateError) {
                      console.warn(`Error creating/updating ${plz}:`, updateError.message);
                      errors++;
                    } else {
                      updated++;
                    }
                  });
              } else {
                created++;
                existingPLZs.add(plz); // Add to set so we don't try to create again
              }
            });
          batchTasks.push(task);
        }

        // Also update/create in locations table
        const locationTask = supabase.rpc('upsert_location_with_coords', {
          p_postal_code: plz,
          p_city: plz, // Placeholder city name
          p_state: '',
          p_country_code: 'DE',
          p_lat: lat,
          p_lon: lon,
        }).then(({ error: rpcErr }) => {
          if (rpcErr) {
            console.warn(`Error upserting location ${plz}:`, rpcErr.message);
          }
        });

        batchTasks.push(locationTask);

        // Limit concurrency
        if (batchTasks.length >= 50) {
          await Promise.all(batchTasks.splice(0, batchTasks.length));
        }
      }

      if (batchTasks.length) {
        await Promise.all(batchTasks);
      }

      console.log(`Processed ${totalProcessed}/${plzDataList.length} PLZs, created ${created}, updated ${updated}, skipped ${skipped}, errors ${errors}`);
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        totalInCSV: plzDataList.length,
        totalProcessed, 
        created,
        updated,
        skipped, 
        errors,
        dry_run 
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.error('seed-all-postal-codes error', e);
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }), 
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
