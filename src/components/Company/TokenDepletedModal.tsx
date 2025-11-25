import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TokenPurchaseModalV2 } from "@/components/billing-v2/TokenPurchaseModalV2";
import { useState } from "react";
import { Coins, X } from "lucide-react";

interface TokenDepletedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  context?: "unlock" | "general"; // Context where modal was triggered
}

export function TokenDepletedModal({ open, onOpenChange, companyId, context = "general" }: TokenDepletedModalProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handleBuyTokens = () => {
    setShowPurchaseModal(true);
  };

  const handleClose = () => {
    setShowPurchaseModal(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !showPurchaseModal} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-amber-100 p-2">
                <Coins className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle>Keine Tokens mehr verfügbar</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {context === "unlock" ? (
                <>
                  Du hast keine Tokens mehr, um diesen Kandidaten freizuschalten. 
                  Kaufe neue Tokens, um fortzufahren.
                </>
              ) : (
                <>
                  Du hast keine Tokens mehr. Kaufe neue Tokens, um Kandidaten freizuschalten 
                  und Zugriff auf vollständige Profile zu erhalten.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Aktuelle Tokens</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Benötigt für Freischaltung</span>
                <span className="font-semibold">1-3 Tokens</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Später
            </Button>
            <Button
              type="button"
              onClick={handleBuyTokens}
              className="w-full sm:w-auto"
            >
              <Coins className="mr-2 h-4 w-4" />
              Tokens kaufen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TokenPurchaseModalV2
        open={showPurchaseModal}
        companyId={companyId}
        onClose={handleClose}
      />
    </>
  );
}

