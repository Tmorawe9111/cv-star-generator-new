import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan Price IDs mapping
const PLAN_PRICE_IDS: Record<string, Record<string, string>> = {
  basic: {
    month: Deno.env.get('STRIPE_PRICE_BASIC_MONTH') || '',
    year: Deno.env.get('STRIPE_PRICE_BASIC_YEAR') || '',
  },
  growth: {
    month: Deno.env.get('STRIPE_PRICE_GROWTH_MONTH') || '',
    year: Deno.env.get('STRIPE_PRICE_GROWTH_YEAR') || '',
  },
  bevisiblle: {
    month: Deno.env.get('STRIPE_PRICE_BEVISIBLLE_MONTH') || Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTH') || '',
    year: Deno.env.get('STRIPE_PRICE_BEVISIBLLE_YEAR') || Deno.env.get('STRIPE_PRICE_ENTERPRISE_YEAR') || '',
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Stripe or Supabase credentials not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { companyId, plan, interval, currentSubscriptionId } = await req.json();

    if (!companyId || !plan || !interval || !currentSubscriptionId) {
      return new Response(
        JSON.stringify({ error: 'Fehlende Parameter: companyId, plan, interval oder currentSubscriptionId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate plan
    if (!PLAN_PRICE_IDS[plan]) {
      return new Response(
        JSON.stringify({ error: `Ungültiger Plan: ${plan}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const priceIds = PLAN_PRICE_IDS[plan];
    const newPriceId = priceIds[interval];
    
    if (!newPriceId || !newPriceId.startsWith('price_')) {
      return new Response(
        JSON.stringify({ error: `Stripe Price ID nicht konfiguriert für ${plan} ${interval}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get current subscription from Stripe
    const currentSubscription = await stripe.subscriptions.retrieve(currentSubscriptionId);
    const currentItem = currentSubscription.items.data[0];
    const currentPriceId = currentItem.price.id;

    // Check if this is an upgrade (monthly to yearly OR plan upgrade)
    const currentInterval = currentSubscription.items.data[0]?.price?.recurring?.interval;
    const isIntervalUpgrade = currentInterval === 'month' && interval === 'year';
    const isPlanUpgrade = PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(
      currentSubscription.metadata?.plan || 'free'
    );
    const isUpgrade = isIntervalUpgrade || isPlanUpgrade;

    // Calculate proration credit for upgrades BEFORE updating
    let prorationCredit = 0;
    let immediateChargeAmount = 0;
    let nextBillingDate = '';

    if (isUpgrade) {
      // Get current period info
      const currentPeriodStart = currentSubscription.current_period_start;
      const currentPeriodEnd = currentSubscription.current_period_end;
      const now = Math.floor(Date.now() / 1000);
      
      // Calculate unused time in current period
      const totalPeriodSeconds = currentPeriodEnd - currentPeriodStart;
      const unusedSeconds = currentPeriodEnd - now;
      const unusedPercentage = unusedSeconds / totalPeriodSeconds;

      // Get current price
      const currentPrice = await stripe.prices.retrieve(currentPriceId);
      const currentAmount = currentPrice.unit_amount || 0;
      
      // Calculate credit (unused portion of current period) in cents
      prorationCredit = Math.round(currentAmount * unusedPercentage);

      // Get new price
      const newPrice = await stripe.prices.retrieve(newPriceId);
      const newAmount = newPrice.unit_amount || 0;
      
      // Calculate immediate charge (new price - credit)
      immediateChargeAmount = Math.max(0, newAmount - prorationCredit);

      // Calculate next billing date based on new interval
      const periodSeconds = interval === 'year' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60;
      const nextBillingDateObj = new Date((now + periodSeconds) * 1000);
      nextBillingDate = nextBillingDateObj.toISOString().split('T')[0];
    }

    // Get upcoming invoice BEFORE update to see what Stripe will charge
    let upcomingInvoiceBefore: Stripe.Invoice | null = null;
    try {
      upcomingInvoiceBefore = await stripe.invoices.retrieveUpcoming({
        customer: currentSubscription.customer as string,
        subscription: currentSubscriptionId,
        subscription_items: [{
          id: currentItem.id,
          price: newPriceId,
        }],
        subscription_proration_behavior: isUpgrade ? 'always_invoice' : 'none',
        subscription_billing_cycle_anchor: isUpgrade ? 'now' : undefined,
      });
    } catch (error) {
      console.log('Could not retrieve upcoming invoice before update:', error);
    }

    // Update subscription immediately (Stripe handles proration automatically)
    const updatedSubscription = await stripe.subscriptions.update(currentSubscriptionId, {
      items: [{
        id: currentItem.id,
        price: newPriceId,
      }],
      proration_behavior: isUpgrade ? 'always_invoice' : 'none', // Always prorate for upgrades
      billing_cycle_anchor: isIntervalUpgrade ? 'now' : undefined, // Reset billing cycle only for interval upgrades
      metadata: {
        companyId,
        plan,
        interval,
      },
    });

    // Use Stripe's calculated amounts if available, otherwise use our calculation
    const finalChargeAmount = upcomingInvoiceBefore?.amount_due || immediateChargeAmount;
    const finalCredit = isUpgrade ? prorationCredit : 0;

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: updatedSubscription.id,
        immediate_charge_amount: finalChargeAmount,
        proration_credit: finalCredit,
        next_billing_date: updatedSubscription.current_period_end 
          ? new Date(updatedSubscription.current_period_end * 1000).toISOString().split('T')[0]
          : nextBillingDate,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Upgrade subscription error:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message ?? 'Unbekannter Fehler beim Upgrade',
        details: error?.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

