import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TOKEN_PACKS } from "@/lib/billing-v2/stripe-prices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

function resolveTokenAmount(packageId: keyof typeof TOKEN_PACKS | undefined) {
  if (!packageId) return 0;
  return TOKEN_PACKS[packageId]?.amount ?? 0;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const rawBody = Buffer.from(await request.arrayBuffer());

  let event: Stripe.Event;
  
  // Support multiple webhook secrets (for different environments or endpoints)
  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_ALT, // Alternative secret
  ].filter(Boolean) as string[];

  if (webhookSecrets.length === 0) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 500 }
    );
  }

  // Try each secret until one works
  let lastError: Error | null = null;
  for (const secret of webhookSecrets) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      lastError = null;
      break; // Success, exit loop
    } catch (error: any) {
      lastError = error;
      continue; // Try next secret
    }
  }

  if (lastError || !event) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${lastError?.message}` },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { kind, companyId, packageId, plan, interval } = (session.metadata ?? {}) as any;

    // Handle token purchases
    if (kind === "tokens" && companyId) {
      const delta = resolveTokenAmount(packageId as keyof typeof TOKEN_PACKS | undefined);
      if (delta > 0) {
        await supabase.rpc("add_tokens_and_ledger", {
          p_company: companyId,
          p_delta: delta,
          p_reason: `purchase:${packageId}`,
        });
      }

      await supabase.from("purchases_v2").insert({
        company_id: companyId,
        kind: "tokens",
        package_code: packageId ?? null,
        amount_total_cents: session.amount_total ?? 0,
        currency: session.currency ?? "eur",
        status: session.payment_status ?? "paid",
      });
    }

    // Handle plan upgrades
    if (kind === "plan" && companyId && plan) {
      const subscriptionId = session.subscription as string | null;
      const customerId = session.customer as string | null;

      if (subscriptionId && customerId) {
        try {
          // Retrieve subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Activate subscription in database
          await supabase.rpc("activate_subscription", {
            p_company_id: companyId,
            p_stripe_subscription_id: subscriptionId,
            p_stripe_customer_id: customerId,
            p_plan_key: plan,
            p_interval: interval || "month",
            p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

          // Log purchase
          await supabase.from("purchases_v2").insert({
            company_id: companyId,
            kind: "plan",
            package_code: plan,
            amount_total_cents: session.amount_total ?? 0,
            currency: session.currency ?? "eur",
            status: session.payment_status ?? "paid",
          });
        } catch (error) {
          console.error("Error activating subscription in webhook:", error);
          // Don't fail the webhook, but log the error
        }
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    if (customerId) {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (company?.id) {
        const item = subscription.items.data[0];
        const price = item?.price;
        await supabase
          .from("companies")
          .update({
            plan_name: (price?.metadata?.plan_key as string | undefined) ?? "growth",
            plan_interval: (price?.recurring?.interval ?? "month") as any,
            monthly_tokens: price?.metadata?.tokens ? Number(price.metadata.tokens) : null,
            seats_included: price?.metadata?.seats ? Number(price.metadata.seats) : null,
            next_invoice_at: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq("id", company.id);
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string | undefined;

    if (customerId) {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (company?.id) {
        await supabase.from("invoices_v2").upsert(
          {
            company_id: company.id,
            stripe_invoice_id: invoice.id,
            hosted_invoice_url: invoice.hosted_invoice_url ?? null,
            invoice_pdf: invoice.invoice_pdf ?? null,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            total_cents: invoice.total ?? 0,
            status: invoice.status ?? "paid",
          },
          { onConflict: "stripe_invoice_id" },
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
