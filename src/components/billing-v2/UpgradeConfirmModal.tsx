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
} from "@/components/ui/alert-dialog";
import { PLANS, getPriceLabel, type PlanKey, type PlanInterval } from "@/lib/billing-v2/plans";

interface UpgradeConfirmModalProps {
  open: boolean;
  currentPlan: PlanKey;
  targetPlan: PlanKey;
  currentInterval: PlanInterval;
  targetInterval: PlanInterval;
  immediateChargeAmount?: number;
  prorationCredit?: number;
  nextBillingDate?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UpgradeConfirmModal({
  open,
  currentPlan,
  targetPlan,
  currentInterval,
  targetInterval,
  immediateChargeAmount,
  prorationCredit,
  nextBillingDate,
  onConfirm,
  onCancel,
}: UpgradeConfirmModalProps) {
  const currentPlanConfig = PLANS[currentPlan];
  const targetPlanConfig = PLANS[targetPlan];
  const isIntervalUpgrade = currentInterval === "month" && targetInterval === "year";
  
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Plan-Upgrade bestätigen</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {isIntervalUpgrade ? (
              <>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="font-semibold text-green-900 mb-2">✨ Sofortiges Upgrade</p>
                  <p className="text-sm text-green-800">
                    Ihr Upgrade wird <strong>sofort</strong> wirksam. Sie erhalten den Restwert Ihres aktuellen Monats als Guthaben angerechnet.
                  </p>
                </div>
                
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Aktueller Plan:</p>
                    <p className="text-sm text-gray-700">
                      <strong>{currentPlanConfig.label}</strong> (Monatlich) - {getPriceLabel(currentPlanConfig.prices.month)}/Monat
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-300 pt-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">Neuer Plan (ab sofort):</p>
                    <p className="text-sm text-gray-700">
                      <strong>{targetPlanConfig.label}</strong> (Jährlich) - {getPriceLabel(targetPlanConfig.prices.year)}/Jahr
                    </p>
                    {prorationCredit !== undefined && prorationCredit > 0 && (
                      <p className="text-xs text-green-700 mt-1">
                        ✓ Guthaben aus ungenutztem Monat: {getPriceLabel(prorationCredit)}
                      </p>
                    )}
                  </div>
                </div>

                {immediateChargeAmount !== undefined && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Sofortige Zahlung:</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {getPriceLabel(immediateChargeAmount)}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Berechnet als: Jahrespreis ({getPriceLabel(targetPlanConfig.prices.year)}) 
                      {prorationCredit !== undefined && prorationCredit > 0 && (
                        <> - Guthaben ({getPriceLabel(prorationCredit)})</>
                      )}
                    </p>
                    {nextBillingDate && (
                      <p className="text-xs text-blue-700 mt-2">
                        Nächste Zahlung: {format(new Date(nextBillingDate), "dd.MM.yyyy", { locale: de })}
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-2">ℹ️ Wichtige Information:</p>
                  <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                    <li>Das Upgrade wird <strong>sofort</strong> wirksam (keine Wartezeit)</li>
                    <li>Der Abrechnungszyklus wird auf heute zurückgesetzt</li>
                    <li>Nächste Zahlung in einem Jahr ({nextBillingDate ? format(new Date(nextBillingDate), "dd.MM.yyyy", { locale: de }) : "in 12 Monaten"})</li>
                    <li>Sie erhalten den Restwert des aktuellen Monats als Guthaben angerechnet</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Möchten Sie wirklich von <strong>{currentPlanConfig.label}</strong> zu <strong>{targetPlanConfig.label}</strong> upgraden?
                </p>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Neuer Plan:</p>
                  <p className="text-sm text-gray-700">
                    <strong>{targetPlanConfig.label}</strong> - {getPriceLabel(targetPlanConfig.prices[targetInterval])} 
                    {targetInterval === "year" ? "/Jahr" : "/Monat"}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Das Upgrade wird sofort wirksam.
                  </p>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            Upgrade bestätigen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

