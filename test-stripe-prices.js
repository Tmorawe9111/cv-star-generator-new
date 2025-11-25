// Test Script to verify Stripe Price IDs
// Run with: node test-stripe-prices.js

const stripe = require('stripe')('sk_test_51SUSWXEn7Iw8aL2bRSt92aCoy2y55NaJbssxoRBc0t8rui2xOsAcA5kuFXZVmP1FnwVO9d0ccWuWP9bYQzrgzuiS00qj3lcvse');

async function testPriceId(priceId) {
  try {
    const price = await stripe.prices.retrieve(priceId);
    console.log(`✅ Price ID ${priceId} existiert:`);
    console.log(`   - Product: ${price.product}`);
    console.log(`   - Amount: ${price.unit_amount / 100} ${price.currency}`);
    console.log(`   - Interval: ${price.recurring?.interval}`);
    console.log(`   - Active: ${price.active}`);
    return true;
  } catch (error) {
    console.log(`❌ Price ID ${priceId} existiert NICHT oder ist nicht zugänglich:`);
    console.log(`   - Error: ${error.message}`);
    console.log(`   - Code: ${error.code}`);
    return false;
  }
}

async function listAllPrices() {
  try {
    console.log('\n📋 Alle aktiven Prices in Stripe:\n');
    const prices = await stripe.prices.list({ limit: 100, active: true });
    
    prices.data.forEach(price => {
      console.log(`Price ID: ${price.id}`);
      console.log(`  - Product: ${price.product}`);
      console.log(`  - Amount: ${price.unit_amount / 100} ${price.currency}`);
      console.log(`  - Interval: ${price.recurring?.interval || 'one-time'}`);
      console.log(`  - Active: ${price.active}`);
      console.log('');
    });
    
    return prices.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Prices:', error);
    return [];
  }
}

async function main() {
  const testPriceId = 'price_1SUSgMEn7Iw8aL2btlnugoGX';
  
  console.log('🔍 Teste Price ID:', testPriceId);
  console.log('='.repeat(50));
  
  await testPriceId(testPriceId);
  
  console.log('\n');
  await listAllPrices();
}

main().catch(console.error);

