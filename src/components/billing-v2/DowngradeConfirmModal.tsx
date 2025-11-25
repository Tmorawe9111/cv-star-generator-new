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

interface DowngradeConfirmModalProps {
  open: boolean;
  currentPlan: PlanKey;
  targetPlan: PlanKey;
  currentInterval: PlanInterval;
  targetInterval: PlanInterval;
  renewalDate: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DowngradeConfirmModal({
  open,
  currentPlan,
  targetPlan,
  currentInterval,
  targetInterval,
  renewalDate,
  onConfirm,
  onCancel,
}: DowngradeConfirmModalProps) {
  const currentPlanConfig = PLANS[currentPlan];
  const targetPlanConfig = PLANS[targetPlan];
  const isIntervalDowngrade = currentInterval === "year" && targetInterval === "month";
  
  // Calculate remaining months (rough estimate)
  const renewalDateObj = renewalDate !== "—" ? new Date(renewalDate) : null;
  const now = new Date();
  const remainingMonths = renewalDateObj 
    ? Math.ceil((renewalDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Plan-Wechsel bestätigen</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {isIntervalDowngrade ? (
              <>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="font-semibold text-blue-900 mb-2">Wichtige Information:</p>
                  <p className="text-sm text-blue-800 mb-3">
                    Sie wechseln von einem <strong>jährlichen Plan</strong> zu einem <strong>monatlichen Plan</strong>.
                  </p>
                  <p className="text-sm text-blue-800">
                    Sie haben noch <strong>{remainingMonths} Monate</strong> in Ihrem jährlichen Plan übrig. 
                    Der Wechsel zum monatlichen Plan wird zum <strong>{renewalDate !== "—" ? renewalDate : "Ende der Laufzeit"}</strong> vorgemerkt.
                  </p>
                </div>
                
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Aktueller Status:</p>
                    <p className="text-sm text-gray-700">
                      <strong>{currentPlanConfig.label} Plan</strong> (Jährlich) - läuft bis zum {renewalDate !== "—" ? renewalDate : "Ende der Laufzeit"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Sie behalten alle Vorteile Ihres aktuellen Plans bis zum {renewalDate !== "—" ? renewalDate : "Ende der Laufzeit"}.
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-300 pt-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">Ab {renewalDate !== "—" ? renewalDate : "Ende der Laufzeit"}:</p>
                    <p className="text-sm text-gray-700">
                      <strong>{targetPlanConfig.label} Plan</strong> (Monatlich) - {getPriceLabel(targetPlanConfig.prices.month)}/Monat
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-2">ℹ️ Keine Rückerstattung</p>
                  <p className="text-xs text-amber-800">
                    Es wird keine Rückerstattung für die ungenutzten Monate des Jahresplans gewährt. 
                    Dies ist der Industriestandard für SaaS-Plattformen und schützt den Rabatt-Deal des Jahresabonnements.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Möchten Sie wirklich von <strong>{currentPlanConfig.label}</strong> zu <strong>{targetPlanConfig.label}</strong> wechseln?
                </p>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Neuer Plan:</p>
                  <p className="text-sm text-gray-700">
                    <strong>{targetPlanConfig.label}</strong> - {getPriceLabel(targetPlanConfig.prices[targetInterval])} 
                    {targetInterval === "year" ? "/Jahr" : "/Monat"}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Der Wechsel wird zum {renewalDate !== "—" ? renewalDate : "Ende der aktuellen Periode"} wirksam.
                  </p>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            {isIntervalDowngrade ? "Wechsel zum Ende der Laufzeit planen" : "Wechsel bestätigen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

