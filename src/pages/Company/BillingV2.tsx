import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { BillingWorkspaceV2 } from "@/components/billing-v2/BillingWorkspaceV2";
import { PurchaseSuccessModal } from "@/components/modals/PurchaseSuccessModal";
import { getStripeSession } from "@/lib/api/stripe-session";
import { TOKEN_PACKS } from "@/lib/billing-v2/stripe-prices";
import type { CompanyBillingSnapshot, InvoiceRowV2, PurchaseRowV2 } from "@/lib/billing-v2/types";
import type { PlanKey } from "@/lib/billing-v2/plans";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyUserRole } from "@/hooks/useCompanyUserRole";
import { toast } from "sonner";

export default function CompanyBillingV2Page() {
  const { company, loading: companyLoading, refetch: refetchCompany } = useCompany();
  const { data: role } = useCompanyUserRole(company?.id);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const companyId = company?.id ?? null;
  
  // Refetch function for subscription data
  const refetchSubscription = useCallback(() => {
    if (companyId) {
      queryClient.invalidateQueries({ queryKey: ["billing-v2-subscription", companyId] });
    }
  }, [queryClient, companyId]);

  // Success modal state
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    type: "tokens" | "plan";
    tokenAmount?: number;
    planKey?: PlanKey;
  }>({ open: false, type: "tokens" });

  useEffect(() => {
    document.title = "Abrechnung & Tokens";
  }, []);

  const params = new URLSearchParams(location.search);
  const openTarget = params.get("open");
  const sessionId = params.get("session_id");
  const success = params.get("success");
  const upgradeSuccess = params.get("upgrade");
  const isSuperadmin = role === "owner";
  const initialOpenTokenModal = openTarget === "token";
  const initialUpgradePlan = openTarget === "upgrade" && isSuperadmin ? "growth" : null;
  const initialOpenManagePlanModal = openTarget === "manage" && isSuperadmin;

  useEffect(() => {
    if (!openTarget) return;
    if ((openTarget === "upgrade" || openTarget === "manage") && !isSuperadmin) {
      toast.error("Nur Superadmin kann den Plan ändern oder Sitze hinzufügen.");
      const cleaned = new URLSearchParams(location.search);
      cleaned.delete("open");
      navigate({ pathname: location.pathname, search: cleaned.toString() }, { replace: true });
    }
  }, [openTarget, isSuperadmin, location.pathname, location.search, navigate]);

  // Handle purchase success from URL
  useEffect(() => {
    if ((sessionId || success === "1" || upgradeSuccess === "success") && companyId) {
      const handlePurchaseSuccess = async () => {
        try {
          console.log("[BillingV2] Handling purchase success:", { sessionId, success, upgradeSuccess, companyId });
          
          // Show modal immediately for upgrade success (even without session_id)
          if (upgradeSuccess === "success" && !sessionId) {
            console.log("[BillingV2] Showing plan upgrade success modal");
            await Promise.all([
              refetchCompany(),
              refetchSubscription(),
            ]);
            queryClient.invalidateQueries({ queryKey: ["billing-v2"] });
            
            // Try to get the actual plan from the company data
            const { data: updatedCompany } = await (supabase as any)
              .from("companies")
              .select("active_plan_id, plan_name, plan_interval")
              .eq("id", companyId)
              .maybeSingle();
            
            const actualPlanKey = (updatedCompany?.active_plan_id || updatedCompany?.plan_name || "growth") as PlanKey;
            
            setSuccessModal({
              open: true,
              type: "plan",
              planKey: actualPlanKey,
            });
            // Clean up URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("upgrade");
            setSearchParams(newParams, { replace: true });
            return;
          }
          
          // Show modal immediately for token success (even without session_id)
          if (success === "1" && !sessionId) {
            console.log("[BillingV2] Showing token purchase success modal");
            await refetchCompany();
            setSuccessModal({
              open: true,
              type: "tokens",
            });
            // Clean up URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("success");
            setSearchParams(newParams, { replace: true });
            return;
          }
          
          if (sessionId) {
            // Get Stripe session details
            console.log("[BillingV2] Fetching Stripe session:", sessionId);
            const session = await getStripeSession(sessionId);
            console.log("[BillingV2] Stripe session data:", session);
            
            if (!session) {
              console.warn("[BillingV2] Session not found, showing generic success");
              // Show generic success modal even if session not found
              await refetchCompany();
              setSuccessModal({
                open: true,
                type: upgradeSuccess === "success" ? "plan" : "tokens",
              });
              return;
            }
            
            if (session.payment_status !== "paid") {
              console.warn("[BillingV2] Payment not completed:", session.payment_status);
              return;
            }

            const metadata = session.metadata || {};
            const kind = metadata.kind || (upgradeSuccess === "success" ? "plan" : "tokens"); // 'tokens' or 'plan'
            const packageId = metadata.packageId;
            const plan = metadata.plan as PlanKey | undefined;

            console.log("[BillingV2] Processing purchase:", { kind, packageId, plan });

            // Trigger token grant or plan activation
            if (kind === "tokens" && packageId) {
              const tokenAmount = TOKEN_PACKS[packageId as keyof typeof TOKEN_PACKS]?.amount || 0;
              
              // Refetch company data to update sidebar immediately
              await refetchCompany();

              setSuccessModal({
                open: true,
                type: "tokens",
                tokenAmount,
              });
            } else if (kind === "plan") {
              const subscriptionId = session.subscription as string | null;
              const customerId = (session.customer || session.metadata?.customerId) as string | null;
              const interval = (metadata.interval || "month") as "month" | "year";
              const planKey = plan || (metadata.plan as PlanKey | undefined) || "growth";

              console.log("[BillingV2] Processing plan upgrade:", { subscriptionId, customerId, interval, planKey });

              // Check if subscription is already activated (webhook might have already processed it)
              if (subscriptionId && customerId) {
                const { data: existingSubscription } = await (supabase as any)
                  .from("subscriptions")
                  .select("id")
                  .eq("stripe_subscription_id", subscriptionId)
                  .maybeSingle();

                // Only activate if not already activated (fallback if webhook didn't fire)
                if (!existingSubscription) {
                  try {
                    // Get subscription details from Stripe
                    const { data: subscriptionData } = await supabase.functions.invoke('get-stripe-subscription', {
                      body: { subscriptionId },
                    });

                    if (subscriptionData) {
                      console.log("[BillingV2] Activating subscription:", { subscriptionId, planKey });
                      await (supabase as any).rpc("activate_subscription", {
                        p_company_id: companyId,
                        p_stripe_subscription_id: subscriptionId,
                        p_stripe_customer_id: customerId,
                        p_plan_key: planKey,
                        p_interval: interval,
                        p_current_period_start: subscriptionData.current_period_start || new Date().toISOString(),
                        p_current_period_end: subscriptionData.current_period_end || new Date(Date.now() + (interval === "year" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
                      });
                      console.log("[BillingV2] Subscription activated successfully");
                    }
                  } catch (error) {
                    console.error("Error activating subscription:", error);
                    // Continue to show success modal even if activation fails
                  }
                }
              }

              // Refetch company and subscription data to update UI immediately
              await Promise.all([
                refetchCompany(),
                refetchSubscription(),
              ]);
              
              // Also invalidate all billing-related queries
              queryClient.invalidateQueries({ queryKey: ["billing-v2"] });
              queryClient.invalidateQueries({ queryKey: ["billing-v2-purchases"] });
              queryClient.invalidateQueries({ queryKey: ["billing-v2-invoices"] });

              setSuccessModal({
                open: true,
                type: "plan",
                planKey: planKey,
              });
            }
          } else if (success === "1") {
            // Token purchase success (without session_id)
            await Promise.all([
              refetchCompany(),
              refetchSubscription(),
            ]);
            queryClient.invalidateQueries({ queryKey: ["billing-v2"] });
            setSuccessModal({
              open: true,
              type: "tokens",
            });
          } else if (upgradeSuccess === "success") {
            // Plan upgrade success (without session_id)
            console.log("[BillingV2] Plan upgrade success without session_id");
            await Promise.all([
              refetchCompany(),
              refetchSubscription(),
            ]);
            queryClient.invalidateQueries({ queryKey: ["billing-v2"] });
            
            // Try to get the actual plan from the company data
            let actualPlanKey: PlanKey = "growth"; // Default fallback
            try {
              const { data: updatedCompany } = await (supabase as any)
                .from("companies")
                .select("active_plan_id, plan_name, plan_interval")
                .eq("id", companyId)
                .maybeSingle();
              
              actualPlanKey = (updatedCompany?.active_plan_id || updatedCompany?.plan_name || "growth") as PlanKey;
            } catch (error) {
              console.error("Error fetching updated company:", error);
            }
            
            setSuccessModal({
              open: true,
              type: "plan",
              planKey: actualPlanKey,
            });
          }

          // Clean up URL parameters
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("session_id");
          newParams.delete("success");
          newParams.delete("upgrade");
          setSearchParams(newParams, { replace: true });
        } catch (error) {
          console.error("Error handling purchase success:", error);
        }
      };

      handlePurchaseSuccess();
    }
  }, [sessionId, success, upgradeSuccess, companyId, refetchCompany, refetchSubscription, queryClient, searchParams, setSearchParams]);

  useEffect(() => {
    if (openTarget) {
      const cleaned = new URLSearchParams(location.search);
      cleaned.delete("open");
      navigate({ pathname: location.pathname, search: cleaned.toString() }, { replace: true });
    }
  }, [openTarget, location.pathname, location.search, navigate]);

  const { data: snapshot, isLoading: loadingCompany, error: snapshotError } = useQuery({
    queryKey: ["billing-v2", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
        .from("companies")
        .select(
            "id, plan_name, plan_interval, available_tokens, monthly_tokens, seats_included, next_invoice_at, active_plan_id, selected_plan_id, active_tokens, name, logo_url, total_tokens_ever"
        )
        .eq("id", companyId)
        .maybeSingle();
        if (error) {
          console.error('Error fetching company snapshot:', error);
          throw error;
        }
        return (data ?? null) as unknown as CompanyBillingSnapshot | null;
      } catch (error) {
        console.error('Error in queryFn:', error);
        throw error;
      }
    },
    retry: 1,
  });

  const { data: purchases, error: purchasesError } = useQuery({
    queryKey: ["billing-v2-purchases", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
        .from("purchases_v2")
          .select("*, company_id")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(25);
        if (error) {
          console.error('Error fetching purchases:', error);
          throw error;
        }
      return (data ?? []) as PurchaseRowV2[];
      } catch (error) {
        console.error('Error in purchases queryFn:', error);
        // Return empty array on error instead of crashing
        return [] as PurchaseRowV2[];
      }
    },
    retry: 1,
  });

  const { data: invoices, error: invoicesError } = useQuery({
    queryKey: ["billing-v2-invoices", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
        .from("invoices_v2")
        .select("*")
        .eq("company_id", companyId)
        .order("period_start", { ascending: false })
        .limit(25);
        if (error) {
          console.error('Error fetching invoices:', error);
          throw error;
        }
      return (data ?? []) as InvoiceRowV2[];
      } catch (error) {
        console.error('Error in invoices queryFn:', error);
        // Return empty array on error instead of crashing
        return [] as InvoiceRowV2[];
      }
    },
    retry: 1,
  });

  const { data: subscription, error: subscriptionError } = useQuery({
    queryKey: ["billing-v2-subscription", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("subscriptions")
          .select("current_period_end, status, cancel_at_period_end, stripe_subscription_id, plan_key, interval")
          .eq("company_id", companyId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .maybeSingle();
        if (error) {
          console.error('Error fetching subscription:', error);
          // Don't throw for subscription - it's optional
          return null;
        }
        return data as {
          current_period_end: string;
          status: string;
          cancel_at_period_end: boolean;
          stripe_subscription_id: string | null;
          plan_key?: string | null;
          interval?: string | null;
        } | null;
      } catch (error) {
        console.error('Error in subscription queryFn:', error);
        return null;
      }
    },
    retry: 1,
  });

  // Show loading state while company is loading
  if (companyLoading) {
    return (
      <main className="min-h-screen bg-[#f4f6fb] px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
      </main>
    );
  }

  if (!companyId) {
    return (
      <main className="min-h-screen bg-[#f4f6fb] px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Kein Zugriff</p>
              <p className="text-sm text-muted-foreground mt-2">Bitte melden Sie sich als Unternehmen an.</p>
            </div>
          </div>
      </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
              <div className="flex items-center justify-between">
        <header className="space-y-1">
                  <h1 className="text-2xl font-bold text-gray-900">Abrechnung &amp; Token</h1>
        </header>
          <button
            onClick={() => navigate("/unternehmen/startseite")}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
            aria-label="Schließen"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {(snapshotError || purchasesError || invoicesError || subscriptionError) && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <p className="font-medium">⚠️ Einige Daten konnten nicht geladen werden.</p>
            <p className="mt-1 text-xs">Bitte laden Sie die Seite neu oder versuchen Sie es später erneut.</p>
          </div>
        )}

        {loadingCompany && !snapshot ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        ) : (
        <BillingWorkspaceV2
          company={snapshot ?? null}
            subscription={subscription ?? null}
          purchases={purchases ?? []}
          invoices={invoices ?? []}
          initialOpenTokenModal={initialOpenTokenModal}
          initialUpgradePlan={initialUpgradePlan}
            initialOpenManagePlanModal={initialOpenManagePlanModal}
          initialUpgradeInterval="month"
          />
        )}

        {/* Success Modal */}
        <PurchaseSuccessModal
          open={successModal.open}
          onClose={async () => {
            setSuccessModal({ open: false, type: "tokens" });
            // Refetch all data after closing modal to ensure everything is up to date
            await refetchCompany();
            // Invalidate all billing-related queries to force refresh
            await queryClient.invalidateQueries({ queryKey: ["billing-v2"] });
            await queryClient.invalidateQueries({ queryKey: ["billing-v2-purchases"] });
            await queryClient.invalidateQueries({ queryKey: ["billing-v2-invoices"] });
            await queryClient.invalidateQueries({ queryKey: ["billing-v2-subscription"] });
            await queryClient.invalidateQueries({ queryKey: ["company"] });
          }}
          type={successModal.type}
          tokenAmount={successModal.tokenAmount}
          planKey={successModal.planKey}
        />
      </div>
    </main>
  );
}
