import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { BillingWorkspaceV2 } from "@/components/billing-v2/BillingWorkspaceV2";
import type { CompanyBillingSnapshot, InvoiceRowV2, PurchaseRowV2 } from "@/lib/billing-v2/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyBillingV2Page() {
  const { company, loading: companyLoading } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Abrechnung & Tokens";
  }, []);

  const companyId = company?.id ?? null;

  const params = new URLSearchParams(location.search);
  const openTarget = params.get("open");
  const initialOpenTokenModal = openTarget === "token";
  const initialUpgradePlan = openTarget === "upgrade" ? "growth" : null;

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
        const { data, error } = await supabase
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
        return (data ?? null) as CompanyBillingSnapshot | null;
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
        const { data, error } = await supabase
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
        const { data, error } = await supabase
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
        const { data, error } = await supabase
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
        return data;
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
            initialUpgradeInterval="month"
          />
        )}
      </div>
    </main>
  );
}
