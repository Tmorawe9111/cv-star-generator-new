import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan Price IDs mapping (should match stripe-prices.ts)
// These must be configured in Supabase Secrets or will use hardcoded fallbacks
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
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
      typescript: true,
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const { companyId, plan, interval, subscriptionEndDate } = await req.json();

    if (!companyId || !plan || !interval) {
      return new Response(
        JSON.stringify({ error: 'Fehlende Parameter: companyId, plan oder interval' }),
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

    // Validate interval
    if (interval !== 'month' && interval !== 'year') {
      return new Response(
        JSON.stringify({ error: `Ungültiges Intervall: ${interval}. Erlaubt sind nur 'month' oder 'year'.` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const priceIds = PLAN_PRICE_IDS[plan];
    const priceId = priceIds[interval];
    
    // Debug logging - show full values for debugging
    const growthMonthEnv = Deno.env.get('STRIPE_PRICE_GROWTH_MONTH');
    console.log('=== DEBUG: Price ID Lookup ===');
    console.log('Plan:', plan, 'Interval:', interval);
    console.log('STRIPE_PRICE_GROWTH_MONTH from env:', growthMonthEnv ? `${growthMonthEnv.substring(0, 30)}...` : 'NOT SET');
    console.log('PLAN_PRICE_IDS[growth]:', JSON.stringify(PLAN_PRICE_IDS['growth']));
    console.log('priceIds[interval]:', priceIds[interval]);
    console.log('Selected priceId:', priceId ? `${priceId.substring(0, 30)}...` : 'EMPTY/NULL');
    console.log('Price ID length:', priceId?.length || 0);
    console.log('Price ID starts with price_:', priceId?.startsWith('price_') || false);
    
    // Validate that price ID is set (not empty) and is a valid Stripe price ID format
    if (!priceId || priceId.trim() === '' || !priceId.startsWith('price_')) {
      return new Response(
        JSON.stringify({ 
          error: 'Stripe Price ID nicht konfiguriert',
          details: `Bitte konfiguriere STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()} in Supabase Secrets. Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets`,
          hint: 'Die Price ID muss mit "price_" beginnen und im Stripe Dashboard erstellt werden.',
          debug: {
            plan,
            interval,
            envVar: `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`,
            priceIdValue: priceId || '(empty)'
          }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get company from Supabase (with name for Stripe customer)
    const companyResponse = await fetch(
      `${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&select=id,name,stripe_customer_id`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!companyResponse.ok) {
      throw new Error('Failed to fetch company');
    }

    const companies = await companyResponse.json();
    if (!companies || companies.length === 0) {
      return new Response(
        JSON.stringify({ error: 'company not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const company = companies[0];
    let customerId = company.stripe_customer_id;

    // Check if customer exists in Stripe, create new one if not
    if (customerId) {
      try {
        // Verify customer exists in Stripe
        await stripe.customers.retrieve(customerId);
      } catch (customerError: any) {
        // If customer doesn't exist, clear the ID and create a new one
        if (customerError?.code === 'resource_missing') {
          console.log('Customer not found in Stripe, creating new one');
          customerId = null;
        } else {
          throw customerError;
        }
      }
    }

    // Create or update Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: company.name || 'Company',
        metadata: { companyId },
      });
      customerId = customer.id;

      // Update company with customer ID
      await fetch(
        `${supabaseUrl}/rest/v1/companies?id=eq.${companyId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ stripe_customer_id: customerId }),
        }
      );
    } else {
      // Update existing customer with company name if not set
      try {
        const existingCustomer = await stripe.customers.retrieve(customerId);
        if (!existingCustomer.name && company.name) {
          await stripe.customers.update(customerId, {
            name: company.name,
          });
        }
      } catch (error) {
        console.error('Error updating customer:', error);
        // Continue even if update fails
      }
    }

    // Get app URL from environment or use default
    // For local testing, use localhost:8080
    // For production, APP_URL should be set in Supabase Secrets
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080';

    // Create Stripe Checkout Session
    try {
      const subscriptionData: any = {
        metadata: {
          companyId,
          plan,
          interval,
        },
      };

      // If subscriptionEndDate is provided (for downgrades), schedule the subscription to start at that date
      if (subscriptionEndDate) {
        const endDate = new Date(subscriptionEndDate);
        const now = new Date();
        
        // Only set billing_cycle_anchor if the end date is in the future
        if (endDate > now) {
          subscriptionData.billing_cycle_anchor = Math.floor(endDate.getTime() / 1000);
          subscriptionData.proration_behavior = 'none'; // Don't prorate for downgrades
        }
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        success_url: `${appUrl}/company/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/pricing`,
        metadata: {
          kind: 'plan',
          companyId,
          plan,
          interval,
        },
        subscription_data: subscriptionData,
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      console.error('Price ID used:', priceId);
      console.error('Plan:', plan, 'Interval:', interval);
      
      // Better error messages for common Stripe errors
      let errorMessage = 'Stripe-Fehler beim Erstellen der Checkout-Session';
      if (stripeError?.code === 'resource_missing') {
        errorMessage = `Stripe Price ID nicht gefunden: ${priceId}. Bitte überprüfe:\n1. Ob die Price ID im Stripe Dashboard existiert\n2. Ob die Price ID in Supabase Secrets korrekt konfiguriert ist (STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()})\n3. Ob du im Test Mode bist (für Test-Umgebung)`;
      } else if (stripeError?.code === 'invalid_request_error') {
        errorMessage = `Ungültige Stripe-Anfrage: ${stripeError.message || 'Bitte überprüfe die Price ID'}`;
      } else if (stripeError?.message) {
        errorMessage = `Stripe-Fehler: ${stripeError.message}`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: stripeError?.message,
          code: stripeError?.code,
          priceId: priceId,
          plan: plan,
          interval: interval,
          envVar: `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message ?? 'Unbekannter Fehler beim Erstellen der Checkout-Session',
        details: error?.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

