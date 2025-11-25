import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { purchaseId, companyId } = await req.json();

    if (!purchaseId || !companyId) {
      return new Response(
        JSON.stringify({ error: 'purchaseId and companyId are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get purchase from database
    const purchaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/purchases_v2?id=eq.${purchaseId}&company_id=eq.${companyId}&select=*`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!purchaseResponse.ok) {
      throw new Error('Purchase not found');
    }

    const purchases = await purchaseResponse.json();
    const purchase = purchases[0];

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    // Try to find invoice from Stripe
    // For token purchases, we need to find the checkout session
    let invoiceUrl = null;
    let pdfUrl = null;

    if (purchase.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(purchase.stripe_checkout_session_id);
        
        if (session.invoice) {
          const invoice = await stripe.invoices.retrieve(session.invoice as string);
          invoiceUrl = invoice.hosted_invoice_url;
          pdfUrl = invoice.invoice_pdf;
        } else if (session.payment_intent) {
          // For one-time payments, try to find payment intent
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          // Create a receipt URL
          invoiceUrl = `https://dashboard.stripe.com/payments/${paymentIntent.id}`;
        }
      } catch (error) {
        console.error('Error retrieving Stripe invoice:', error);
      }
    }

    // If no invoice found, return error
    if (!invoiceUrl && !pdfUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Rechnung nicht verfügbar',
          message: 'Für diese Transaktion ist keine Rechnung verfügbar.',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        invoiceUrl,
        pdfUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error downloading invoice:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message ?? 'Unknown error downloading invoice',
        details: error?.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

