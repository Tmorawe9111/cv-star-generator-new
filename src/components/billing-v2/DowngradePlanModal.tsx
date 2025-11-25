import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, PLAN_ORDER, getPriceLabel, type PlanKey, type PlanInterval } from "@/lib/billing-v2/plans";

interface DowngradePlanModalProps {
  currentPlan: PlanKey;
  currentInterval: PlanInterval;
  renewalDate: string;
  onDowngrade: (plan: PlanKey, interval: PlanInterval) => void;
  onCancelSubscription: () => void;
}

export function DowngradePlanModal({
  currentPlan,
  currentInterval,
  renewalDate,
  onDowngrade,
  onCancelSubscription,
}: DowngradePlanModalProps) {
  const [interval, setInterval] = useState<PlanInterval>(currentInterval);
  
  // Determine downgrade plan
  const downgradePlanKey: PlanKey = 
    currentPlan === "enterprise" ? "bevisiblle" : 
    currentPlan === "bevisiblle" ? "growth" : 
    currentPlan === "growth" ? "basic" : 
    "free";
  const downgradePlan = PLANS[downgradePlanKey];
  
  const handleDowngrade = () => {
    onDowngrade(downgradePlanKey, interval);
  };

  return (
    <AlertDialogContent className="max-w-lg">
      <AlertDialogHeader>
        <AlertDialogTitle>Plan downgraden</AlertDialogTitle>
        <AlertDialogDescription className="space-y-4">
          {/* Interval Toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setInterval("month")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                interval === "month"
                  ? "bg-white text-gray-900 shadow-sm"
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
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Jährlich
            </button>
          </div>

          {/* Plan Details */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-lg font-semibold text-blue-900">{downgradePlan.label} Plan</p>
              <Badge variant="secondary">{getPriceLabel(downgradePlan.prices[interval])}</Badge>
            </div>
            {interval === "year" && (
              <p className="text-xs text-blue-700 mb-3">
                ≈ {getPriceLabel(Math.round(downgradePlan.prices.year / 12))} pro Monat
              </p>
            )}
            <p className="text-xs text-blue-700 mb-3">
              Zum Datum {renewalDate !== "—" ? renewalDate : "Ende der Laufzeit"} aktiv
            </p>
            <div className="space-y-2 text-xs text-blue-800">
              {downgradePlan.features.slice(0, 5).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
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
                onClick={onCancelSubscription} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ja, ich möchte das Abonnement kündigen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialogCancel className="w-full sm:w-auto">Abbrechen</AlertDialogCancel>
        <AlertDialogAction 
          onClick={handleDowngrade}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
        >
          Zum {downgradePlan.label} Plan downgraden
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

