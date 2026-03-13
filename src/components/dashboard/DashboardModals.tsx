import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PlanSelector } from "@/components/Company/onboarding/PlanSelector";
import { TokenPurchaseModalV2 } from "@/components/billing-v2/TokenPurchaseModalV2";
import { PurchaseSuccessModal } from "@/components/modals/PurchaseSuccessModal";
import type { SuccessModalState } from "@/types/dashboard";

export interface DashboardModalsProps {
  showUpgradeModal: boolean;
  setShowUpgradeModal: (open: boolean) => void;
  showTokenPurchaseModal: boolean;
  setShowTokenPurchaseModal: (open: boolean) => void;
  successModal: SuccessModalState;
  setSuccessModal: (state: SuccessModalState) => void;
  companyId: string | null | undefined;
  selectedPlanId?: string | null;
}

export function DashboardModals({
  showUpgradeModal,
  setShowUpgradeModal,
  showTokenPurchaseModal,
  setShowTokenPurchaseModal,
  successModal,
  setSuccessModal,
  companyId,
  selectedPlanId,
}: DashboardModalsProps) {
  return (
    <>
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-h-[95vh] max-w-6xl flex-col overflow-hidden p-6">
          <div className="mb-4">
            <h2 className="text-center text-2xl font-bold">Plan upgraden</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Wählen Sie einen Plan, der zu Ihrem Unternehmen passt
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PlanSelector
              selectedPlanId={selectedPlanId ?? undefined}
              embedded={true}
              showSalesButton={true}
              onContactSales={() => {
                window.open("https://calendly.com/bevisiblle-sales", "_blank");
                setShowUpgradeModal(false);
              }}
              onNext={() => setShowUpgradeModal(false)}
              onSkip={() => setShowUpgradeModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {companyId && (
        <TokenPurchaseModalV2
          open={showTokenPurchaseModal}
          onClose={() => setShowTokenPurchaseModal(false)}
          companyId={companyId}
        />
      )}

      <PurchaseSuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, type: "tokens" })}
        type={successModal.type}
        tokenAmount={successModal.tokenAmount}
        planKey={successModal.planKey}
      />
    </>
  );
}
