import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Payload = {
  companyId: string;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json({ error: "missing companyId" }, { status: 400 });
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

    if (error || !company?.stripe_customer_id) {
      return NextResponse.json({ error: "no customer" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${process.env.APP_URL}/company/billing-v2`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "unknown error" }, { status: 500 });
  }
}
