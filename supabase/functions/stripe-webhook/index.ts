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
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe credentials not configured');
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

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Received Stripe event:', event.type);

    // ============================================
    // STEP 3: Handle checkout.session.completed
    // ============================================
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const kind = metadata.kind; // 'plan' or 'tokens'
      const companyId = metadata.companyId;
      const plan = metadata.plan; // 'basic', 'growth', 'enterprise'
      const interval = metadata.interval; // 'month' or 'year'
      const packageId = metadata.packageId; // For token purchases

      console.log('Checkout session completed:', { kind, companyId, plan, interval, packageId });

      // Handle Plan Subscription
      if (kind === 'plan' && companyId && plan && interval) {
        // Get subscription from Stripe
        const subscriptionId = session.subscription as string;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Activate subscription in database
          const response = await fetch(
            `${supabaseUrl}/rest/v1/rpc/activate_subscription`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({
                p_company_id: companyId,
                p_stripe_subscription_id: subscription.id,
                p_stripe_customer_id: subscription.customer as string,
                p_plan_key: plan,
                p_interval: interval,
                p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to activate subscription:', errorText);
            throw new Error(`Failed to activate subscription: ${errorText}`);
          }

          console.log('Subscription activated successfully');

          // Save plan purchase to purchases_v2
          const purchaseResponse = await fetch(
            `${supabaseUrl}/rest/v1/purchases_v2`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({
                company_id: companyId,
                kind: 'plan',
                package_code: `${plan}_${interval}`,
                amount_total_cents: session.amount_total || 0,
                currency: session.currency || 'eur',
                status: session.payment_status || 'paid',
                stripe_checkout_session_id: session.id,
              }),
            }
          );

          if (!purchaseResponse.ok) {
            const errorText = await purchaseResponse.text();
            console.error('Failed to save plan purchase:', errorText);
            // Don't throw, subscription was already activated
          }
        }
      }

      // Handle Token Purchase
      if (kind === 'tokens' && companyId && packageId) {
        console.log('Token purchase completed:', { companyId, packageId });
        
        // Token amounts mapping
        const TOKEN_AMOUNTS: Record<string, number> = {
          t50: 50,
          t150: 150,
          t300: 300,
        };
        
        const tokenAmount = TOKEN_AMOUNTS[packageId] || 0;
        
        if (tokenAmount > 0) {
          // Get current token balance
          const companyResponse = await fetch(
            `${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&select=active_tokens`,
            {
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const companies = await companyResponse.json();
          const currentTokens = companies?.[0]?.active_tokens || 0;

          // Add tokens to company (also track in total_tokens_ever)
          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/rpc/add_purchased_tokens`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({
                p_company_id: companyId,
                p_token_amount: tokenAmount,
              }),
            }
          );

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to add tokens:', errorText);
            throw new Error(`Failed to add tokens: ${errorText}`);
          }

          // Save purchase to purchases_v2
          const purchaseResponse = await fetch(
            `${supabaseUrl}/rest/v1/purchases_v2`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({
                company_id: companyId,
                kind: 'tokens',
                package_code: packageId,
                amount_total_cents: session.amount_total || 0,
                currency: session.currency || 'eur',
                status: session.payment_status || 'paid',
                stripe_checkout_session_id: session.id,
              }),
            }
          );

          if (!purchaseResponse.ok) {
            const errorText = await purchaseResponse.text();
            console.error('Failed to save purchase:', errorText);
            // Don't throw, tokens were already added
          }

          console.log(`Added ${tokenAmount} tokens to company ${companyId}. New balance: ${currentTokens + tokenAmount}`);
        }
      }
    }

    // ============================================
    // Handle customer.subscription.updated
    // ============================================
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Find company by customer ID
      const companyResponse = await fetch(
        `${supabaseUrl}/rest/v1/companies?stripe_customer_id=eq.${subscription.customer}&select=id`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const companies = await companyResponse.json();
      if (companies && companies.length > 0) {
        const companyId = companies[0].id;
        
        // Get plan from subscription metadata or price
        const planKey = subscription.metadata?.plan || 'free';
        const interval = subscription.metadata?.interval || 'month';
        
        // Update subscription
        await fetch(
          `${supabaseUrl}/rest/v1/rpc/activate_subscription`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              p_company_id: companyId,
              p_stripe_subscription_id: subscription.id,
              p_stripe_customer_id: subscription.customer as string,
              p_plan_key: planKey,
              p_interval: interval,
              p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }),
          }
        );
      }
    }

    // ============================================
    // Handle customer.subscription.deleted (subscription ended)
    // ============================================
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log('Subscription deleted:', subscription.id);
      
      // Find company by customer ID
      const companyResponse = await fetch(
        `${supabaseUrl}/rest/v1/companies?stripe_customer_id=eq.${subscription.customer}&select=id`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const companies = await companyResponse.json();
      if (companies && companies.length > 0) {
        const companyId = companies[0].id;
        
        // Update subscription status to canceled
        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subscription.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              status: 'canceled',
            }),
          }
        );

        // Set company to free plan and reset tokens to 3
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
            body: JSON.stringify({
              active_plan_id: 'free',
              plan_name: 'free',
              selected_plan_id: 'free',
              active_tokens: 3, // Free plan gets 3 tokens once
              plan_interval: null,
            }),
          }
        );

        console.log(`Company ${companyId} set to free plan with 3 tokens`);
      }
    }

    // ============================================
    // Handle invoice.payment_succeeded
    // ============================================
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      
      if (subscriptionId) {
        // Get subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Find company
        const companyResponse = await fetch(
          `${supabaseUrl}/rest/v1/companies?stripe_customer_id=eq.${subscription.customer}&select=id,active_plan_id`,
          {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const companies = await companyResponse.json();
        if (companies && companies.length > 0) {
          const company = companies[0];
          const planKey = company.active_plan_id || 'free';
          
          // Grant monthly tokens
          await fetch(
            `${supabaseUrl}/rest/v1/rpc/grant_monthly_tokens`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                p_company_id: company.id,
                p_plan_key: planKey,
              }),
            }
          );

          console.log('Monthly tokens granted for company:', company.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message ?? 'Unknown error processing webhook',
        details: error?.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

