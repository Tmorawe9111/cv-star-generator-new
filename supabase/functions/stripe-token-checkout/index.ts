import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token Pack Price IDs mapping (should match stripe-prices.ts)
// Update these with your actual Stripe Price IDs from Stripe Dashboard
const TOKEN_PACK_PRICE_IDS: Record<string, string> = {
  t50: Deno.env.get('STRIPE_PRICE_TOKENS_50') || 'price_1SUSkbEn7Iw8aL2bWSfxgfeV',
  t150: Deno.env.get('STRIPE_PRICE_TOKENS_150') || 'price_1SUSl8En7Iw8aL2bQhWLdho3',
  t300: Deno.env.get('STRIPE_PRICE_TOKENS_300') || 'price_1SUSoJEn7Iw8aL2bIeX7QI8b',
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
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const body = await req.json();
    const { companyId, packageId, appUrl: clientAppUrl } = body;

    if (!companyId || !packageId) {
      return new Response(
        JSON.stringify({ error: 'Fehlende Parameter: companyId oder packageId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate package ID
    if (!TOKEN_PACK_PRICE_IDS[packageId]) {
      return new Response(
        JSON.stringify({ error: `Ungültiges Token-Paket: ${packageId}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const priceId = TOKEN_PACK_PRICE_IDS[packageId];
    
    // Debug logging
    console.log('Token Package:', packageId);
    console.log('Price IDs from env:', {
      t50: Deno.env.get('STRIPE_PRICE_TOKENS_50')?.substring(0, 20) + '...',
      t150: Deno.env.get('STRIPE_PRICE_TOKENS_150')?.substring(0, 20) + '...',
      t300: Deno.env.get('STRIPE_PRICE_TOKENS_300')?.substring(0, 20) + '...',
    });
    console.log('Selected priceId:', priceId?.substring(0, 20) + '...');
    
    // Validate that price ID is set (not empty) and is a valid Stripe price ID format
    if (!priceId || priceId.trim() === '' || !priceId.startsWith('price_')) {
      return new Response(
        JSON.stringify({ 
          error: 'Stripe Price ID nicht konfiguriert',
          details: `Bitte konfiguriere STRIPE_PRICE_TOKENS_${packageId.toUpperCase()} in Supabase Secrets. Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets`,
          hint: 'Die Price ID muss mit "price_" beginnen und im Stripe Dashboard erstellt werden.'
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

    // Get app URL from multiple sources (priority order):
    // 1. Client-provided appUrl in request body
    // 2. Environment variable APP_URL
    // 3. Request origin/referer header
    // 4. Fallback to localhost
    const requestOrigin = req.headers.get('origin') || req.headers.get('referer');
    let appUrl = clientAppUrl || Deno.env.get('APP_URL');
    
    // If no APP_URL set, try to extract from request origin
    if (!appUrl && requestOrigin) {
      try {
        const url = new URL(requestOrigin);
        appUrl = `${url.protocol}//${url.host}`;
        console.log('[stripe-token-checkout] Using APP_URL from request origin:', appUrl);
      } catch (e) {
        console.warn('[stripe-token-checkout] Could not parse origin:', requestOrigin);
      }
    }
    
    // Final fallback
    if (!appUrl) {
      appUrl = 'http://localhost:8080'; // Default dev server port
      console.warn('[stripe-token-checkout] Using fallback APP_URL:', appUrl);
    }
    
    console.log('[stripe-token-checkout] Final APP_URL:', appUrl, {
      clientAppUrl,
      envAppUrl: Deno.env.get('APP_URL'),
      requestOrigin,
    });

    // Create Stripe Checkout Session for one-time payment
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment', // One-time payment for tokens
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        payment_method_types: ['card'], // Only allow card payments, disable Amazon Pay
        success_url: `${appUrl}/unternehmen/abrechnung?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/unternehmen/abrechnung?cancel=1`,
        metadata: {
          kind: 'tokens',
          companyId,
          packageId,
        },
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
      console.error('Package ID:', packageId);
      
      // Better error messages for common Stripe errors
      let errorMessage = 'Stripe-Fehler beim Erstellen der Checkout-Session';
      if (stripeError?.code === 'resource_missing') {
        if (stripeError?.message?.includes('customer')) {
          errorMessage = `Stripe Customer nicht gefunden. Ein neuer Customer wird erstellt. Bitte versuchen Sie es erneut.`;
        } else {
          errorMessage = `Stripe Price ID nicht gefunden: ${priceId}. Bitte überprüfe:\n1. Ob die Price ID im Stripe Dashboard existiert\n2. Ob die Price ID in Supabase Secrets korrekt konfiguriert ist (STRIPE_PRICE_TOKENS_${packageId.toUpperCase()})\n3. Ob du im Test Mode bist (für Test-Umgebung)`;
        }
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
          packageId: packageId,
          envVar: `STRIPE_PRICE_TOKENS_${packageId.toUpperCase()}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Stripe token checkout error:', error);
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

