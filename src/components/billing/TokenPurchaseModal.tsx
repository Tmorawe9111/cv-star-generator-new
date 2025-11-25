import { useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type TokenPackageId = "t15" | "t45" | "t100";

const TOKEN_PACKAGES: Array<{
  id: TokenPackageId;
  title: string;
  description: string;
  tokenAmount: number;
  priceCents: number;
}> = [
  {
    id: "t15",
    title: "15 Tokens",
    description: "Ideal für den schnellen Bedarf zwischendurch.",
    tokenAmount: 15,
    priceCents: 300,
  },
  {
    id: "t45",
    title: "45 Tokens",
    description: "Perfekt für mehrere Stellenausschreibungen parallel.",
    tokenAmount: 45,
    priceCents: 800,
  },
  {
    id: "t100",
    title: "100 Tokens",
    description: "Unser Paket für Teams mit hohem Recruiting-Volumen.",
    tokenAmount: 100,
    priceCents: 1500,
  },
];

interface TokenPurchaseModalProps {
  open: boolean;
  companyId: string;
  onClose: () => void;
}

export function TokenPurchaseModal({ open, companyId, onClose }: TokenPurchaseModalProps) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<TokenPackageId>("t45");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setIsSubmitting(false);
    }
  }, [open]);

  const selectedPackage = useMemo(
    () => TOKEN_PACKAGES.find((pkg) => pkg.id === selectedId),
    [selectedId],
  );

  const handlePurchase = async () => {
    if (!companyId || !selectedPackage) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          packageId: selectedPackage.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Der Kauf konnte nicht gestartet werden.");
      }

      const data = await response.json();
      if (!data?.url) {
        throw new Error("Keine Weiterleitungs-URL erhalten.");
      }

      window.location.href = data.url;
    } catch (error: any) {
      setIsSubmitting(false);
      toast({
        title: "Kauf fehlgeschlagen",
        description: error?.message ?? "Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (!next && !isSubmitting ? onClose() : undefined)}>
      <DialogContent className="max-w-lg gap-6">
        <DialogHeader>
          <DialogTitle>Tokens kaufen</DialogTitle>
          <DialogDescription>
            Wählen Sie ein Paket aus und schließen Sie den Kauf sicher über Stripe ab. Ihre Zahlungsdaten werden nicht bei uns gespeichert.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={selectedId}
            onValueChange={(value: TokenPackageId) => setSelectedId(value)}
            className="space-y-3"
          >
            {TOKEN_PACKAGES.map((pkg) => {
              const priceEuro = (pkg.priceCents / 100).toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 2,
              });

              return (
                <Label
                  key={pkg.id}
                  htmlFor={`token-pack-${pkg.id}`}
                  className={`block cursor-pointer rounded-2xl border p-4 transition-colors ${selectedId === pkg.id ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-200"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem id={`token-pack-${pkg.id}`} value={pkg.id} />
                      <div>
                        <p className="text-base font-semibold">{pkg.title}</p>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{priceEuro}</p>
                      <p className="text-xs text-muted-foreground">{pkg.tokenAmount} Tokens</p>
                    </div>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>

          <div className="flex items-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-3 text-sm text-blue-700">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Sicherer Checkout über Stripe – Rechnungen &amp; Belege erhalten Sie automatisch per E-Mail.
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handlePurchase}
            className="w-full sm:w-auto"
            disabled={isSubmitting || !selectedPackage}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Weiterleitung…
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Jetzt kaufen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TokenPurchaseModal;
