#!/usr/bin/env node
/**
 * Seed all German postal codes with coordinates
 * Downloads CSV and inserts/updates all PLZs in database
 * 
 * Usage: node scripts/seed-postal-codes.js
 */

import https from 'https';
import { createClient } from '@supabase/supabase-js';

// Get from environment or use defaults
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://koymmvuhcxlvcuoyjnvv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'e2fba6ac73376615e10ea76bb2a3dead8d48113b153939ddd155e659048edc50';

if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.length < 50) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set or invalid');
  console.error('   Please set it as environment variable:');
  console.error('   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('\n   Or get it from: supabase secrets list | grep SERVICE_ROLE_KEY');
  process.exit(1);
}

const CSV_URL = 'https://raw.githubusercontent.com/WZBSocialScienceCenter/plz_geocoord/master/plz_geocoord.csv';
const BATCH_SIZE = 500;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download CSV: ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCSV(text) {
  const results = [];
  const lines = text.trim().split(/\r?\n/);
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < 3) continue;
    
    const plz = parts[0].replace(/"/g, '').trim();
    const lat = Number(parts[1]);
    const lon = Number(parts[2]);
    
    if (!/^[0-9]{5}$/.test(plz)) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    
    results.push({ plz, lat, lon });
  }
  
  return results;
}

async function getExistingPLZs() {
  const { data, error } = await supabase
    .from('postal_codes')
    .select('plz');
  
  if (error) throw error;
  return new Set((data || []).map(r => String(r.plz)));
}

async function upsertPostalCode(plz, lat, lon) {
  // Use RPC function if available, otherwise direct update
  const { error: rpcError } = await supabase.rpc('upsert_postal_code_coords', {
    p_plz: plz,
    p_lat: lat,
    p_lon: lon,
  });
  
  if (rpcError) {
    // Fallback: direct upsert
    const { error } = await supabase
      .from('postal_codes')
      .upsert({
        plz: plz,
        ort: plz, // Placeholder, will be updated later
        latitude: lat,
        longitude: lon,
      }, {
        onConflict: 'plz',
      });
    
    if (error) {
      console.error(`Error upserting ${plz}:`, error.message);
      return false;
    }
  }
  
  return true;
}

async function processBatch(batch, existingPLZs) {
  const results = { created: 0, updated: 0, errors: 0 };
  
  for (const { plz, lat, lon } of batch) {
    const exists = existingPLZs.has(plz);
    
    try {
      const success = await upsertPostalCode(plz, lat, lon);
      if (success) {
        if (exists) {
          results.updated++;
        } else {
          results.created++;
          existingPLZs.add(plz);
        }
      } else {
        results.errors++;
      }
    } catch (error) {
      console.error(`Error processing ${plz}:`, error.message);
      results.errors++;
    }
  }
  
  return results;
}

async function main() {
  console.log('🚀 Starting postal codes seed...\n');
  
  try {
    // Download CSV
    console.log(`📥 Downloading CSV from ${CSV_URL}...`);
    const csvText = await downloadCSV(CSV_URL);
    console.log(`✅ Downloaded ${csvText.length} bytes\n`);
    
    // Parse CSV
    console.log('📊 Parsing CSV...');
    const plzData = parseCSV(csvText);
    console.log(`✅ Found ${plzData.length} PLZs in CSV\n`);
    
    // Get existing PLZs
    console.log('🔍 Checking existing PLZs...');
    const existingPLZs = await getExistingPLZs();
    console.log(`✅ Found ${existingPLZs.size} existing PLZs\n`);
    
    // Process in batches
    console.log(`🔄 Processing ${plzData.length} PLZs in batches of ${BATCH_SIZE}...\n`);
    
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < plzData.length; i += BATCH_SIZE) {
      const batch = plzData.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(plzData.length / BATCH_SIZE);
      
      console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, plzData.length)})...`);
      
      const results = await processBatch(batch, existingPLZs);
      totalCreated += results.created;
      totalUpdated += results.updated;
      totalErrors += results.errors;
      
      console.log(`   ✅ Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors}\n`);
      
      // Small delay to avoid rate limiting
      if (i + BATCH_SIZE < plzData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Summary
    console.log('🎉 Done!\n');
    console.log('📊 Summary:');
    console.log(`   Total in CSV: ${plzData.length}`);
    console.log(`   Created: ${totalCreated}`);
    console.log(`   Updated: ${totalUpdated}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log(`   Total in DB: ${existingPLZs.size + totalCreated}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

