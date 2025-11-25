import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_PRICE_IDS } from "@/lib/billing-v2/stripe-prices";
import type { PlanInterval, PlanKey } from "@/lib/billing-v2/plans";

type Payload = {
  companyId: string;
  plan: PlanKey;
  interval: PlanInterval;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const { companyId, plan, interval } = body;

    if (!companyId || !plan || !interval) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }

    const priceIds = PLAN_PRICE_IDS[plan];
    if (!priceIds) {
      return NextResponse.json({ error: "plan not supported" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: company, error } = await supabase
      .from("companies")
      .select("stripe_customer_id")
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
      customer: customerId!,
      mode: "subscription",
      line_items: [
        {
          price: priceIds[interval],
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${process.env.APP_URL}/company/billing-v2?upgrade=success`,
      cancel_url: `${process.env.APP_URL}/company/billing-v2?upgrade=cancel`,
      metadata: { kind: "plan", companyId, plan, interval },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "unknown error" }, { status: 500 });
  }
}
