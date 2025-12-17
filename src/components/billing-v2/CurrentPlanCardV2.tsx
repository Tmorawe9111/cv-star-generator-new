import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { CompanyBillingSnapshot } from "@/lib/billing-v2/types";
import { PLAN_ORDER, PLANS, getPriceLabel, type PlanKey, type PlanInterval } from "@/lib/billing-v2/plans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface CurrentPlanCardV2Props {
  company: CompanyBillingSnapshot | null;
  subscription?: {
    current_period_end: string;
    status: string;
    cancel_at_period_end: boolean;
    stripe_subscription_id: string | null;
    plan_key?: string | null;
    interval?: string | null;
  } | null;
  onUpgradePlan: () => void;
  onDowngradePlan?: (plan: PlanKey, interval: PlanInterval) => void;
  onOpenBillingPortal: () => void;
  onCancelSubscription?: () => void;
}

function DowngradeSection({
  currentPlan,
  currentInterval,
  renewalDate,
  onDowngrade,
}: {
  currentPlan: PlanKey;
  currentInterval: PlanInterval;
  renewalDate: string;
  onDowngrade?: (plan: PlanKey, interval: PlanInterval) => void;
}) {
  const [interval, setInterval] = useState<PlanInterval>(currentInterval);
  const downgradePlanKey: PlanKey = 
    currentPlan === "enterprise" ? "bevisiblle" : 
    currentPlan === "bevisiblle" ? "growth" : 
    currentPlan === "growth" ? "basic" : 
    "free";
  const downgradePlan = PLANS[downgradePlanKey];

  const handleDowngrade = () => {
    if (onDowngrade) {
      onDowngrade(downgradePlanKey, interval);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
      <p className="text-sm font-medium text-gray-900">Plan downgraden</p>
      
      {/* Interval Toggle */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setInterval("month")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            interval === "month"
              ? "bg-gray-900 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Monatlich
        </button>
        <button
          type="button"
          onClick={() => setInterval("year")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            interval === "year"
              ? "bg-gray-900 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Jährlich
        </button>
      </div>

      {/* Plan Card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-lg font-semibold text-blue-900">{downgradePlan.label} Plan</p>
          <Badge variant="secondary">{getPriceLabel(downgradePlan.prices[interval])}</Badge>
        </div>
        {interval === "year" && (
          <p className="text-xs text-blue-700 mb-2">
            ≈ {getPriceLabel(Math.round(downgradePlan.prices.year / 12))} pro Monat
          </p>
        )}
        <p className="text-xs text-blue-700 mb-3">
          Zum Datum {renewalDate !== "—" ? renewalDate : "Ende der Laufzeit"} aktiv
        </p>
        <div className="space-y-1.5 text-xs text-blue-800">
          {downgradePlan.features.slice(0, 5).map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Downgrade Button */}
      <Button 
        onClick={handleDowngrade}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        Zum {downgradePlan.label} Plan downgraden
      </Button>
    </div>
  );
}

export function CurrentPlanCardV2({ 
  company, 
  subscription,
  onUpgradePlan,
  onDowngradePlan,
  onOpenBillingPortal,
  onCancelSubscription 
}: CurrentPlanCardV2Props) {
  const companyId = company?.id;

  // Fetch active plan assignment with custom conditions
  const { data: activePlanAssignment } = useQuery({
    queryKey: ["active-company-plan", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .rpc("get_active_company_plan", { p_company_id: companyId });
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching active plan:", error);
      }
      return data?.[0] || null;
    },
    enabled: !!companyId,
  });

  // Check if this is a custom plan (has custom conditions)
  const isCustomPlan = activePlanAssignment && (
    activePlanAssignment.jobs !== null ||
    activePlanAssignment.locations !== null ||
    activePlanAssignment.tokens !== null ||
    activePlanAssignment.seats !== null ||
    activePlanAssignment.price_monthly_cents !== null ||
    activePlanAssignment.price_yearly_cents !== null
  );

  // Priority: activePlanAssignment.plan_id > subscription.plan_key > company.active_plan_id > company.plan_name > company.selected_plan_id > "free"
  const planKey = (activePlanAssignment?.plan_id || subscription?.plan_key || company?.active_plan_id || company?.plan_name || company?.selected_plan_id || "free") as PlanKey;
  const plan = PLANS[planKey] || PLANS["free"];
  const interval = (subscription?.interval || company?.plan_interval || "month") as PlanInterval;
  const seats = company?.seats_included ?? plan.seatsIncluded;
  const tokens = company?.monthly_tokens ?? plan.tokensPerMonth;

  const nextInvoice = company?.next_invoice_at
    ? format(new Date(company.next_invoice_at), "dd.MM.yyyy", { locale: de })
    : "—";

  // For custom plans, use valid_until; otherwise use subscription.current_period_end
  const renewalDate = isCustomPlan && activePlanAssignment?.valid_until
    ? format(new Date(activePlanAssignment.valid_until), "dd.MM.yyyy", { locale: de })
    : subscription?.current_period_end
    ? format(new Date(subscription.current_period_end), "dd.MM.yyyy", { locale: de })
    : "—";

  const isTopPlan = planKey === "enterprise" || planKey === "bevisiblle";
  const isFreePlan = planKey === "free";
  const isCanceled = subscription?.cancel_at_period_end || subscription?.status === "canceled";
  
  // Debug logging
  console.log('CurrentPlanCardV2 Debug:', {
    planKey,
    isFreePlan,
    isCanceled,
    isCustomPlan,
    activePlanAssignment,
    hasStripeSubscriptionId: !!subscription?.stripe_subscription_id,
    subscription: subscription,
  });

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      toast.error("Keine aktive Subscription gefunden");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: subscription.stripe_subscription_id,
          companyId: company?.id,
        },
      });

      if (error) throw error;

      toast.success("Abonnement wurde gekündigt. Es läuft bis zum Ende der aktuellen Periode.");
      
      // Reload page to refresh subscription data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast.error("Kündigung fehlgeschlagen. Bitte versuchen Sie es erneut.");
    }
  };

  const companyName = (company as any)?.name || "Unternehmen";
  const companyLogo = (company as any)?.logo_url;

  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={companyLogo || ""} alt={companyName} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white">
              {companyName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{companyName}</p>
            <p className="mt-1 text-xs text-gray-600">
              {isCustomPlan ? "Custom Plan" : `Sie sind im ${plan.label} Plan`}
            </p>
            {renewalDate && renewalDate !== "—" && (
              <p className="mt-0.5 text-xs text-gray-500">
                {isCustomPlan ? `Gültig bis: ${renewalDate}` : `Verlängert sich ${renewalDate}`}
              </p>
            )}
          </div>
          {!isTopPlan && (
            <Button size="sm" variant="outline" onClick={onUpgradePlan}>
              Manage
            </Button>
          )}
        </div>

        {isCanceled && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm">
            <p className="font-medium text-yellow-800 mb-2">
              ⚠️ Ihr Abonnement wurde gekündigt und läuft am {renewalDate} ab.
            </p>
            <p className="text-xs text-yellow-700">
              Nach Ablauf wechseln Sie automatisch in den Free Plan. Sie behalten alle Vorteile Ihres aktuellen Plans bis zum {renewalDate}.
            </p>
          </div>
        )}


        {/* Custom Plan Conditions Section */}
        {isCustomPlan && activePlanAssignment && (
          <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-semibold text-purple-900 mb-3">Custom Plan Bedingungen:</p>
            <ul className="space-y-2 text-xs text-purple-800">
              {activePlanAssignment.tokens !== null && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  <span>
                    <strong>Tokens:</strong> {activePlanAssignment.tokens === -1 ? "Unbegrenzt" : `${activePlanAssignment.tokens} Tokens`}
                  </span>
                </li>
              )}
              {activePlanAssignment.jobs !== null && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  <span>
                    <strong>Stellenanzeigen:</strong> {activePlanAssignment.jobs === -1 ? "Unbegrenzt" : `${activePlanAssignment.jobs} Jobs`}
                  </span>
                </li>
              )}
              {activePlanAssignment.locations !== null && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  <span>
                    <strong>Standorte:</strong> {activePlanAssignment.locations === -1 ? "Unbegrenzt" : `${activePlanAssignment.locations} Standorte`}
                  </span>
                </li>
              )}
              {activePlanAssignment.seats !== null && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  <span>
                    <strong>Benutzer:</strong> {activePlanAssignment.seats === -1 ? "Unbegrenzt" : `${activePlanAssignment.seats} Benutzer`}
                  </span>
                </li>
              )}
              {activePlanAssignment.price_monthly_cents !== null && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  <span>
                    <strong>Preis (monatlich):</strong> {(activePlanAssignment.price_monthly_cents / 100).toFixed(2)} €
                  </span>
                </li>
              )}
              {activePlanAssignment.price_yearly_cents !== null && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  <span>
                    <strong>Preis (jährlich):</strong> {(activePlanAssignment.price_yearly_cents / 100).toFixed(2)} €
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Free Plan Benefits Section */}
        {isFreePlan && !isCustomPlan && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900 mb-3">Ihre Free Plan Benefits:</p>
            <ul className="space-y-2 text-xs text-blue-800">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={onOpenBillingPortal} className="sm:w-auto">
            Manage
          </Button>
          {!isFreePlan && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="sm:w-auto">
                  {isCanceled ? "Kündigung aufheben" : "Abonnement kündigen"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Abonnement verwalten</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Ihr aktueller Plan: <strong>{isCustomPlan ? "Custom Plan" : plan.label}</strong>
                      </p>
                      {renewalDate && renewalDate !== "—" && (
                        <p className="text-sm text-gray-600">
                          {isCustomPlan ? `Gültig bis: ` : "Verlängert sich am: "}
                          <strong>{renewalDate}</strong>
                        </p>
                      )}
                    </div>
                    
                    {/* Downgrade Option */}
                    {planKey !== "free" && planKey !== "basic" && (
                      <DowngradeSection
                        currentPlan={planKey}
                        currentInterval={interval}
                        renewalDate={renewalDate}
                        onDowngrade={onDowngradePlan}
                      />
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                  <AlertDialogCancel className="w-full sm:w-auto">Abbrechen</AlertDialogCancel>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto">
                        Abonnement kündigen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Abonnement wirklich kündigen?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Möchten Sie Ihr Abonnement wirklich kündigen?
                          </p>
                          
                          {/* Nach der Kündigung: Free Plan */}
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-900 mb-3">Nach der Kündigung wechseln Sie in den:</p>
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-lg font-semibold text-blue-900">Free Plan</p>
                                <Badge variant="secondary">Kostenlos</Badge>
                              </div>
                              <p className="text-xs text-blue-700 mb-3">
                                Zum Datum {renewalDate !== "—" ? renewalDate : "Ende der Laufzeit"} aktiv
                              </p>
                              <div className="space-y-2 text-xs text-blue-800">
                                <div className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                  <span>3 Tokens einmalig (nur durch Nachkauf erweiterbar)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                  <span>Token-Nachkauf: 18€ pro Token</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                  <span>Keine Stellenanzeigen möglich</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                  <span>Token-Nachkauf: 18€ pro Token</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Wichtige Information:</p>
                            <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                              <li>Ihr Abonnement läuft bis zum <strong>{renewalDate !== "—" ? renewalDate : "Ende der Laufzeit"}</strong>.</li>
                              <li>Sie verlieren <strong>alle Tokens</strong> zum Ende des Abonnements.</li>
                              <li>Nach Ablauf wechseln Sie automatisch in den <strong>Free Plan</strong>.</li>
                            </ul>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleCancelSubscription} 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ja, ich möchte das Abonnement kündigen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default CurrentPlanCardV2;
