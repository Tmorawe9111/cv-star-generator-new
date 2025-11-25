#!/usr/bin/env node
/**
 * Seed postal codes directly via Supabase REST API
 * No Edge Function needed - works directly with database
 */

import https from 'https';
// fetch is built-in in Node.js 18+

const SUPABASE_URL = 'https://koymmvuhcxlvcuoyjnvv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveW1tdnVoY3hsdmN1b3lqbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODA3NTcsImV4cCI6MjA2OTk1Njc1N30.Pb5uz3xFH2Fupk9JSjcbxNrS-s_mE3ySnFy5B7HcZFw';
const CSV_URL = 'https://raw.githubusercontent.com/WZBSocialScienceCenter/plz_geocoord/master/plz_geocoord.csv';
const BATCH_SIZE = 100;

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

async function upsertPLZ(plz, lat, lon) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/postal_codes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      plz: plz,
      ort: plz, // Placeholder
      latitude: lat,
      longitude: lon
    })
  });
  
  if (!response.ok) {
    // Try update if insert fails
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/postal_codes?plz=eq.${plz}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lon
      })
    });
    return updateResponse.ok;
  }
  return true;
}

async function main() {
  console.log('🚀 Starting postal codes seed...\n');
  
  try {
    console.log(`📥 Downloading CSV...`);
    const csvText = await downloadCSV(CSV_URL);
    console.log(`✅ Downloaded ${csvText.length} bytes\n`);
    
    console.log('📊 Parsing CSV...');
    const plzData = parseCSV(csvText);
    console.log(`✅ Found ${plzData.length} PLZs\n`);
    
    console.log(`🔄 Processing in batches of ${BATCH_SIZE}...\n`);
    
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < plzData.length; i += BATCH_SIZE) {
      const batch = plzData.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(plzData.length / BATCH_SIZE);
      
      console.log(`📦 Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, plzData.length)})...`);
      
      const batchResults = await Promise.allSettled(
        batch.map(({ plz, lat, lon }) => upsertPLZ(plz, lat, lon))
      );
      
      let batchCreated = 0;
      let batchUpdated = 0;
      let batchErrors = 0;
      
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          batchCreated++;
        } else {
          batchErrors++;
          if (result.status === 'rejected') {
            console.error(`   ❌ Error with ${batch[idx].plz}: ${result.reason}`);
          }
        }
      });
      
      created += batchCreated;
      errors += batchErrors;
      
      console.log(`   ✅ Created/Updated: ${batchCreated}, Errors: ${batchErrors}\n`);
      
      // Small delay
      if (i + BATCH_SIZE < plzData.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log('🎉 Done!\n');
    console.log(`📊 Summary: Created/Updated: ${created}, Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

