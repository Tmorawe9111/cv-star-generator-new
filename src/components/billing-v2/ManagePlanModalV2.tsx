import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PLANS, PLAN_ORDER, type PlanInterval, type PlanKey } from "@/lib/billing-v2/plans";
import type { CompanyBillingSnapshot } from "@/lib/billing-v2/types";
import { AlertTriangle, ArrowDownRight, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

type ActivePlanAssignment = {
  plan_id: string;
  plan_name: string;
  tokens: number | null;
  jobs: number | null;
  seats: number | null;
  locations: number | null;
  billing_cycle: string | null;
  valid_until: string | null;
};

type SubscriptionLike = {
  current_period_end: string;
  status: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  plan_key?: string | null;
  interval?: string | null;
} | null;

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd.MM.yyyy", { locale: de });
  } catch {
    return "—";
  }
}

function fmtUnlimited(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  if (value === -1) return "Unbegrenzt";
  if (value >= 999999) return "Unbegrenzt";
  return String(value);
}

export function ManagePlanModalV2({
  open,
  onOpenChange,
  company,
  subscription,
  onOpenUpgrade,
  onDowngrade,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyBillingSnapshot | null;
  subscription: SubscriptionLike;
  onOpenUpgrade: () => void;
  onDowngrade: (plan: PlanKey, interval: PlanInterval) => void;
}) {
  const companyId = company?.id ?? null;
  const [cancelBusy, setCancelBusy] = useState(false);

  const { data: activePlan } = useQuery<ActivePlanAssignment | null>({
    queryKey: ["active-company-plan", companyId],
    enabled: !!companyId && open,
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase.rpc("get_active_company_plan", { p_company_id: companyId });
      if (error && (error as any).code !== "PGRST116") {
        console.warn("[ManagePlanModalV2] get_active_company_plan error", error);
      }
      return (data as any)?.[0] || null;
    },
  });

  const isCustomPlan = !!activePlan?.valid_until || !!activePlan?.billing_cycle;
  const planKey = (activePlan?.plan_id || subscription?.plan_key || (company as any)?.active_plan_id || company?.plan_name || company?.selected_plan_id || "free") as PlanKey;
  const plan = PLANS[planKey] || PLANS.free;
  const interval = (subscription?.interval || company?.plan_interval || "month") as PlanInterval;

  const endDate = useMemo(() => {
    if (activePlan?.valid_until) return fmtDate(activePlan.valid_until);
    if (subscription?.current_period_end) return fmtDate(subscription.current_period_end);
    return "—";
  }, [activePlan?.valid_until, subscription?.current_period_end]);

  const status = subscription?.status || "active";
  const cancelAtPeriodEnd = !!subscription?.cancel_at_period_end;

  const downgradePlanKey: PlanKey | null = useMemo(() => {
    const idx = PLAN_ORDER.indexOf(planKey);
    if (idx <= 0) return null;
    const lower = PLAN_ORDER[idx - 1] as PlanKey;
    if (!lower || lower === planKey) return null;
    if (!PLANS[lower]) return null;
    return lower;
  }, [planKey]);

  const handleCancel = async () => {
    if (!subscription?.stripe_subscription_id || !companyId) {
      toast.error("Keine aktive Subscription gefunden.");
      return;
    }
    setCancelBusy(true);
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: { subscriptionId: subscription.stripe_subscription_id, companyId },
      });
      if (error) throw error;
      toast.success("Kündigung wurde vorgemerkt. Der Plan läuft bis zum Ende der Periode weiter.");
      setTimeout(() => window.location.reload(), 900);
    } catch (e: any) {
      console.error("Cancel subscription error", e);
      toast.error(e?.message || "Kündigung fehlgeschlagen.");
    } finally {
      setCancelBusy(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      // Clean up `open=manage` param for better UX
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get("open") === "manage") {
          url.searchParams.delete("open");
          window.history.replaceState({}, "", url.toString());
        }
      } catch {
        // ignore
      }
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Vertrag ändern
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Aktueller Plan</p>
                <p className="text-lg font-semibold text-slate-900">{isCustomPlan ? "Custom Plan" : plan.label}</p>
              </div>
              <Badge variant="secondary">
                {interval === "year" ? "Jährlich" : "Monatlich"} · {status}
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Laufzeit</p>
                <p className="mt-1 text-sm text-slate-900">
                  Läuft bis <strong>{endDate}</strong>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Kündigung ist jederzeit möglich und wird zum Laufzeitende wirksam.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan‑Inhalt</p>
                <div className="mt-2 grid gap-1 text-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tokens / Monat</span>
                    <span className="font-medium">{fmtUnlimited(activePlan?.tokens ?? (company as any)?.monthly_tokens ?? null)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sitze</span>
                    <span className="font-medium">{fmtUnlimited(activePlan?.seats ?? (company as any)?.seats_included ?? null)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stellenanzeigen</span>
                    <span className="font-medium">{fmtUnlimited(activePlan?.jobs ?? null)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Standorte</span>
                    <span className="font-medium">{fmtUnlimited(activePlan?.locations ?? null)}</span>
                  </div>
                </div>
              </div>
            </div>

            {cancelAtPeriodEnd ? (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-semibold">Kündigung ist vorgemerkt</p>
                    <p className="text-xs text-yellow-800">
                      Ihr Plan läuft noch bis <strong>{endDate}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" onClick={() => { handleClose(false); onOpenUpgrade(); }}>
              <Sparkles className="h-4 w-4 mr-2" />
              Plan upgraden / ändern
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Schließen
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Downgrade / Kündigen</p>
                <p className="text-xs text-muted-foreground">
                  Änderungen werden zum Laufzeitende wirksam (am {endDate}).
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-slate-500" />
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={!downgradePlanKey}
                onClick={() => {
                  if (!downgradePlanKey) return;
                  handleClose(false);
                  onDowngrade(downgradePlanKey, interval);
                }}
              >
                <ArrowDownRight className="h-4 w-4 mr-2" />
                {downgradePlanKey ? `Downgrade zu ${PLANS[downgradePlanKey]?.label}` : "Kein Downgrade verfügbar"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={cancelBusy || !subscription?.stripe_subscription_id || cancelAtPeriodEnd}
                onClick={handleCancel}
              >
                {cancelAtPeriodEnd ? "Bereits gekündigt" : cancelBusy ? "Kündige…" : "Kündigen"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Kündigen bedeutet: Ihr Abonnement endet zum Ende der aktuellen Periode. Upgrades wirken sofort, Downgrades zum Periodenende.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


