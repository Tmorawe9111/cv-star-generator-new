import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TOKEN_PACKS } from "@/lib/billing-v2/stripe-prices";

type TokenPackId = keyof typeof TOKEN_PACKS;

type Payload = {
  companyId: string;
  packageId: TokenPackId;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const { companyId, packageId } = body;

    if (!companyId || !packageId) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }

    const pack = TOKEN_PACKS[packageId];
    if (!pack) {
      return NextResponse.json({ error: "unknown package" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: company, error } = await supabase
      .from("companies")
      .select("id, stripe_customer_id")
      .eq("id", companyId)
      .single();

    if (error || !company) {
      return NextResponse.json({ error: "company not found" }, { status: 404 });
    }

    let customerId = company.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { companyId } });
      customerId = customer.id;
      await supabase.from("companies").update({ stripe_customer_id: customerId }).eq("id", companyId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price: pack.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/company/billing-v2?success=1`,
      cancel_url: `${process.env.APP_URL}/company/billing-v2?cancel=1`,
      metadata: { kind: "tokens", companyId, packageId },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "unknown error" }, { status: 500 });
  }
}
