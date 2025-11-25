import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TokenOverviewCardV2 } from "./TokenOverviewCardV2";
import { CurrentPlanCardV2 } from "./CurrentPlanCardV2";
import { PlansGridV2 } from "./PlansGridV2";
import { PurchasesTableV2 } from "./PurchasesTableV2";
import { InvoicesTableV2 } from "./InvoicesTableV2";
import { TokenPurchaseModalV2 } from "./TokenPurchaseModalV2";
import { UpgradePlanModalV2 } from "./UpgradePlanModalV2";
import { DowngradeConfirmModal } from "./DowngradeConfirmModal";
import { UpgradeConfirmModal } from "./UpgradeConfirmModal";
import type { CompanyBillingSnapshot, InvoiceRowV2, PurchaseRowV2 } from "@/lib/billing-v2/types";
import { PLAN_ORDER, type PlanInterval, type PlanKey } from "@/lib/billing-v2/plans";

interface BillingWorkspaceV2Props {
  company: CompanyBillingSnapshot | null;
  subscription?: {
    current_period_end: string;
    status: string;
    cancel_at_period_end: boolean;
    stripe_subscription_id: string | null;
    plan_key?: string | null;
    interval?: string | null;
  } | null;
  purchases: PurchaseRowV2[];
  invoices: InvoiceRowV2[];
  initialOpenTokenModal?: boolean;
  initialUpgradePlan?: PlanKey | null;
  initialUpgradeInterval?: PlanInterval;
}

export function BillingWorkspaceV2({
  company,
  subscription,
  purchases,
  invoices,
  initialOpenTokenModal,
  initialUpgradePlan,
  initialUpgradeInterval,
}: BillingWorkspaceV2Props) {
  const { toast } = useToast();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [pendingInterval, setPendingInterval] = useState<PlanInterval>("month");
  const [pendingPlan, setPendingPlan] = useState<PlanKey | null>(null);
  const [downgradeTargetPlan, setDowngradeTargetPlan] = useState<PlanKey | null>(null);
  const [downgradeTargetInterval, setDowngradeTargetInterval] = useState<PlanInterval>("month");
  const [upgradeInfo, setUpgradeInfo] = useState<{
    immediateChargeAmount?: number;
    prorationCredit?: number;
    nextBillingDate?: string;
  }>({});

  // Priority: subscription.plan_key > company.active_plan_id > company.plan_name > company.selected_plan_id > "free"
  const companyPlan = (subscription?.plan_key || company?.active_plan_id || company?.plan_name || company?.selected_plan_id || "free") as PlanKey;
  const companyId = company?.id ?? "";

  const handleOpenTokenModal = () => setShowTokenModal(true);
  const handleOpenUpgrade = () => {
    setPendingPlan((current) => current ?? "growth");
    setPendingInterval((current) => current ?? "month");
    setShowUpgradeModal(true);
  };

  useEffect(() => {
    if (initialOpenTokenModal) {
      setShowTokenModal(true);
    }
  }, [initialOpenTokenModal]);

  useEffect(() => {
    if (initialUpgradePlan) {
      setPendingPlan(initialUpgradePlan);
      setPendingInterval(initialUpgradeInterval ?? "month");
      setShowUpgradeModal(true);
    }
  }, [initialUpgradePlan, initialUpgradeInterval]);

  useEffect(() => {
    const handleTokenEvent = () => setShowTokenModal(true);
    const handleUpgradeEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ plan?: PlanKey; interval?: PlanInterval }>).detail;
      if (detail?.plan) {
        setPendingPlan(detail.plan);
      } else {
        setPendingPlan((current) => current ?? "growth");
      }
      if (detail?.interval) {
        setPendingInterval(detail.interval);
      }
      setShowUpgradeModal(true);
    };

    window.addEventListener("billing:open-token-modal", handleTokenEvent);
    window.addEventListener("billing:open-upgrade-modal", handleUpgradeEvent as EventListener);
    return () => {
      window.removeEventListener("billing:open-token-modal", handleTokenEvent);
      window.removeEventListener("billing:open-upgrade-modal", handleUpgradeEvent as EventListener);
    };
  }, []);

  const handleSelectPlan = async (plan: PlanKey, interval: PlanInterval, subscriptionEndDate?: string) => {
    // Check if this is a downgrade
    const isDowngrade = PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(companyPlan);
    const isIntervalDowngrade = subscription?.interval === "year" && interval === "month";
    const isIntervalUpgrade = subscription?.interval === "month" && interval === "year";
    const isPlanUpgrade = PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(companyPlan);
    const hasActiveSubscription = subscription?.stripe_subscription_id && subscription?.status === "active";
    
    if (isDowngrade || isIntervalDowngrade) {
      // For downgrades, show confirmation modal first
      setDowngradeTargetPlan(plan);
      setDowngradeTargetInterval(interval);
      setShowDowngradeConfirm(true);
    } else if ((isIntervalUpgrade || (isPlanUpgrade && hasActiveSubscription)) && subscription?.stripe_subscription_id) {
      // For upgrades (interval or plan) with active subscription, calculate proration and show confirmation
      try {
        const { data, error } = await supabase.functions.invoke('upgrade-subscription', {
          body: {
            companyId: companyId,
            plan,
            interval,
            currentSubscriptionId: subscription.stripe_subscription_id,
          },
        });

        if (error) throw error;

        setUpgradeInfo({
          immediateChargeAmount: data?.immediate_charge_amount,
          prorationCredit: data?.proration_credit,
          nextBillingDate: data?.next_billing_date,
        });
        setDowngradeTargetPlan(plan);
        setDowngradeTargetInterval(interval);
        setShowUpgradeConfirm(true);
      } catch (error: any) {
        console.error('Error calculating upgrade:', error);
        toast({
          title: "Fehler",
          description: "Upgrade-Berechnung fehlgeschlagen. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        });
      }
    } else {
      // For new subscriptions or upgrades without active subscription, use checkout
      const finalInterval = company?.plan_interval === "year" ? "year" : interval;
      setPendingPlan(plan);
      setPendingInterval(finalInterval);
      setShowUpgradeModal(true);
    }
  };

  const handleConfirmDowngrade = () => {
    if (!downgradeTargetPlan) return;
    
    const subscriptionEndDate = subscription?.current_period_end;
    handleUpgrade(downgradeTargetPlan, downgradeTargetInterval, subscriptionEndDate);
    setShowDowngradeConfirm(false);
  };

  const handleConfirmUpgrade = async () => {
    if (!downgradeTargetPlan || !subscription?.stripe_subscription_id) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('upgrade-subscription', {
        body: {
          companyId: companyId,
          plan: downgradeTargetPlan,
          interval: downgradeTargetInterval,
          currentSubscriptionId: subscription.stripe_subscription_id,
        },
      });

      if (error) throw error;

      toast({
        title: "Upgrade erfolgreich",
        description: "Ihr Plan wurde sofort aktualisiert. Die Zahlung wurde verarbeitet.",
      });

      // Reload page to refresh subscription data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Upgrade fehlgeschlagen",
        description: error?.message || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
    
    setShowUpgradeConfirm(false);
  };

  const handleUpgrade = async (plan: PlanKey, interval: PlanInterval, subscriptionEndDate?: string) => {
    try {
      // Use direct fetch to get better error messages
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://koymmvuhcxlvcuoyjnvv.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveW1tdnVoY3hsdmN1b3lqbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODA3NTcsImV4cCI6MjA2OTk1Njc1N30.Pb5uz3xFH2Fupk9JSjcbxNrS-s_mE3ySnFy5B7HcZFw';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          companyId,
          plan,
          interval,
          ...(subscriptionEndDate && { subscriptionEndDate }),
        }),
      });

      // Parse response
      const data = await response.json().catch(() => ({}));

      // Check for errors
      if (!response.ok) {
        const errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`;
        const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
        const errorCode = data.code ? `\n\nCode: ${data.code}` : '';
        throw new Error(errorMessage + errorDetails + errorCode);
      }

      // Check if data contains an error (from Edge Function response)
      if (data?.error) {
        const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
        const errorCode = data.code ? `\n\nCode: ${data.code}` : '';
        throw new Error(data.error + errorDetails + errorCode);
      }

      if (data?.url) {
        window.location.href = data.url as string;
        return;
      }

      // If no URL and no error, something unexpected happened
      throw new Error('Keine Weiterleitungs-URL erhalten. Bitte versuchen Sie es erneut.');
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade fehlgeschlagen",
        description: error?.message ?? "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleOpenPortal = async () => {
    try {
      const response = await fetch("/api/billing-v2/create-billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        const info = await response.json().catch(() => ({}));
        throw new Error(info?.error || "Abrechnungsportal konnte nicht geöffnet werden.");
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url as string;
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error?.message ?? "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const purchaseRows = useMemo(() => purchases ?? [], [purchases]);
  const invoiceRows = useMemo(() => invoices ?? [], [invoices]);

  return (
    <div className="space-y-6">
      {/* Top Section: Plan and Credits Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <CurrentPlanCardV2 
          company={company} 
          subscription={subscription}
          onUpgradePlan={handleOpenUpgrade}
          onDowngradePlan={(plan, interval) => {
            // Downgrade to specified plan with interval
            // Pass subscription end date for scheduling
            const subscriptionEndDate = subscription?.current_period_end;
            handleSelectPlan(plan, interval, subscriptionEndDate);
          }}
          onOpenBillingPortal={handleOpenPortal}
          onCancelSubscription={() => {
            // Refetch subscription data
            window.location.reload();
          }}
        />
        <TokenOverviewCardV2 company={company} onBuyTokens={handleOpenTokenModal} onUpgradePlan={handleOpenUpgrade} />
      </div>
      
            {/* Plans Grid */}
            <PlansGridV2 
              companyPlan={companyPlan} 
              companyInterval={subscription?.interval || company?.plan_interval || undefined}
              onSelectPlan={handleSelectPlan} 
            />
      
      {/* Purchases and Invoices */}
      <PurchasesTableV2 rows={purchaseRows} />
      <InvoicesTableV2 rows={invoiceRows} />

      <TokenPurchaseModalV2 open={showTokenModal} companyId={companyId} onClose={() => setShowTokenModal(false)} />
      <UpgradePlanModalV2
        open={showUpgradeModal}
        currentPlan={companyPlan}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={(plan, interval) => handleUpgrade(plan, interval)}
        initialPlan={pendingPlan ?? undefined}
        initialInterval={pendingInterval}
      />
      {downgradeTargetPlan && subscription && (
        <>
          <DowngradeConfirmModal
            open={showDowngradeConfirm}
            currentPlan={companyPlan}
            targetPlan={downgradeTargetPlan}
            currentInterval={(subscription.interval || company?.plan_interval || "month") as PlanInterval}
            targetInterval={downgradeTargetInterval}
            renewalDate={subscription.current_period_end 
              ? format(new Date(subscription.current_period_end), "dd.MM.yyyy", { locale: de })
              : "—"}
            onConfirm={handleConfirmDowngrade}
            onCancel={() => setShowDowngradeConfirm(false)}
          />
          <UpgradeConfirmModal
            open={showUpgradeConfirm}
            currentPlan={companyPlan}
            targetPlan={downgradeTargetPlan}
            currentInterval={(subscription.interval || company?.plan_interval || "month") as PlanInterval}
            targetInterval={downgradeTargetInterval}
            immediateChargeAmount={upgradeInfo.immediateChargeAmount}
            prorationCredit={upgradeInfo.prorationCredit}
            nextBillingDate={upgradeInfo.nextBillingDate}
            onConfirm={handleConfirmUpgrade}
            onCancel={() => setShowUpgradeConfirm(false)}
          />
        </>
      )}
    </div>
  );
}

export default BillingWorkspaceV2;
