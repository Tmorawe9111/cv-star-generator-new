import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TokenPackageId = "t15" | "t45" | "t100";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

function resolveTokenAmount(packageId: TokenPackageId) {
  switch (packageId) {
    case "t15":
      return 15;
    case "t45":
      return 45;
    case "t100":
      return 100;
    default:
      return 0;
  }
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
    const metadata = session.metadata ?? {};
    const kind = metadata.kind;
    const companyId = metadata.companyId;
    const packageId = metadata.packageId as TokenPackageId | undefined;

    if (kind === "tokens" && companyId && packageId) {
      const tokenDelta = resolveTokenAmount(packageId);

      if (tokenDelta > 0) {
        await supabase.rpc("add_tokens_and_ledger", {
          p_company: companyId,
          p_delta: tokenDelta,
          p_reason: `purchase:${packageId}`,
        });
      }

      await supabase.from("purchases").insert({
        company_id: companyId,
        kind: "tokens",
        package_code: packageId,
        amount_total_cents: session.amount_total ?? 0,
        currency: session.currency ?? "eur",
        status: session.payment_status ?? "paid",
      });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;

    if (customerId) {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (company?.id) {
        await supabase.from("invoices").upsert(
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
