import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStripeSession } from "@/lib/api/stripe-session";
import { TOKEN_PACKS } from "@/lib/billing-v2/stripe-prices";
import type { PlanKey } from "@/lib/billing-v2/plans";

export interface UsePurchaseSuccessFromUrlOptions {
  companyId: string | null | undefined;
  refetchCompany: () => Promise<unknown>;
  setSuccessModal: (state: { open: boolean; type: "tokens" | "plan"; tokenAmount?: number; planKey?: PlanKey }) => void;
}

export function usePurchaseSuccessFromUrl({
  companyId,
  refetchCompany,
  setSuccessModal,
}: UsePurchaseSuccessFromUrlOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !companyId) return;

    const handlePurchaseSuccess = async () => {
      try {
        const session = await getStripeSession(sessionId);
        if (!session || session.payment_status !== "paid") return;

        const metadata = session.metadata || {};
        const kind = metadata.kind;
        const packageId = metadata.packageId;
        const plan = metadata.plan as PlanKey | undefined;

        if (kind === "tokens" && packageId) {
          const tokenAmount = TOKEN_PACKS[packageId as keyof typeof TOKEN_PACKS]?.amount || 0;
          if (tokenAmount > 0) {
            const { data: companyData } = await supabase
              .from("companies")
              .select("active_tokens")
              .eq("id", companyId)
              .single();
            const currentTokens = companyData?.active_tokens || 0;
            await supabase
              .from("companies")
              .update({ active_tokens: currentTokens + tokenAmount })
              .eq("id", companyId);
            await refetchCompany();
          }
          setSuccessModal({ open: true, type: "tokens", tokenAmount });
        } else if (kind === "plan" && plan) {
          const subscriptionId = session.subscription as string | null;
          const customerId = session.customer as string | null;
          if (subscriptionId && customerId) {
            const { data: existingSubscription } = await supabase
              .from("subscriptions")
              .select("id")
              .eq("stripe_subscription_id", subscriptionId)
              .maybeSingle();

            if (!existingSubscription) {
              const interval = (metadata.interval || "month") as "month" | "year";
              try {
                const { data: subscriptionData } = await supabase.functions.invoke("get-stripe-subscription", {
                  body: { subscriptionId },
                });
                if (subscriptionData) {
                  await supabase.rpc("activate_subscription", {
                    p_company_id: companyId,
                    p_stripe_subscription_id: subscriptionId,
                    p_stripe_customer_id: customerId,
                    p_plan_key: plan,
                    p_interval: interval,
                    p_current_period_start: subscriptionData.current_period_start || new Date().toISOString(),
                    p_current_period_end:
                      subscriptionData.current_period_end ||
                      new Date(Date.now() + (interval === "year" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
                  });
                  await refetchCompany();
                }
              } catch (error) {
                console.error("Error activating subscription:", error);
              }
            } else {
              await refetchCompany();
            }
          }
          setSuccessModal({ open: true, type: "plan", planKey: plan });
        }

        const newParams = new URLSearchParams(searchParams);
        newParams.delete("session_id");
        setSearchParams(newParams, { replace: true });
      } catch (error) {
        console.error("Error handling purchase success:", error);
      }
    };

    handlePurchaseSuccess();
  }, [searchParams, companyId, setSearchParams, refetchCompany, setSuccessModal]);
}
