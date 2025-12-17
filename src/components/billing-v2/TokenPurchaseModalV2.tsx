import { useMemo, useState } from "react";
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
import { TOKEN_PACKS } from "@/lib/billing-v2/stripe-prices";
import { supabase } from "@/integrations/supabase/client";

type TokenPackId = keyof typeof TOKEN_PACKS;

const PACK_ORDER: TokenPackId[] = ["t50", "t150", "t300"];

interface TokenPurchaseModalV2Props {
  open: boolean;
  companyId: string;
  onClose: () => void;
}

export function TokenPurchaseModalV2({ open, companyId, onClose }: TokenPurchaseModalV2Props) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<TokenPackId | null>("t150");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    if (!selected) return null;
    const pack = TOKEN_PACKS[selected];
    const gross = pack.priceEUR;
    return {
      amount: pack.amount,
      gross,
      formattedGross: gross.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
      }),
    };
  }, [selected]);

  const handlePurchase = async () => {
    if (!selected || !companyId) return;
    setIsSubmitting(true);
    try {
      // Use Supabase Edge Function for Stripe Checkout
      const { data, error: functionError } = await supabase.functions.invoke('stripe-token-checkout', {
        body: {
          companyId,
          packageId: selected,
          appUrl: window.location.origin, // Pass current origin so Edge Function knows where to redirect
        },
      });

      if (functionError) {
        // Check if it's a detailed error from the Edge Function
        if (functionError.message) {
          throw new Error(functionError.message);
        }
        throw functionError;
      }

      // Check if data contains an error
      if (data?.error) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("Keine Weiterleitungs-URL erhalten.");
      }
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Token purchase error:', error);
      toast({
        title: "Kauf fehlgeschlagen",
        description: error?.message ?? error?.details ?? "Der Kauf konnte nicht gestartet werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) {
        // Allow closing even during submission - user can cancel
        onClose();
      }
    }}>
      <DialogContent className="max-w-xl gap-6">
        <DialogHeader>
          <DialogTitle>Tokens kaufen</DialogTitle>
          <DialogDescription>
            Zahlungen werden über Stripe abgewickelt. Wir speichern keine Kreditkartendaten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={selected ?? undefined}
            onValueChange={(value: TokenPackId) => setSelected(value)}
            className="space-y-3"
          >
            {PACK_ORDER.map((packId) => {
              const pack = TOKEN_PACKS[packId];
              const formattedPrice = pack.priceEUR.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 0,
              });
              return (
                <Label
                  key={packId}
                  htmlFor={`pack-${packId}`}
                  className={`block cursor-pointer rounded-2xl border p-4 transition-colors ${selected === packId ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-200"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem id={`pack-${packId}`} value={packId} />
                      <div>
                        <p className="text-base font-semibold">{pack.amount} Tokens</p>
                        <p className="text-sm text-muted-foreground">
                          {packId === "t50" && "Ideal für den schnellen Bedarf."}
                          {packId === "t150" && "Für laufende Kampagnen mit mehreren Rollen."}
                          {packId === "t300" && "Für große Recruiting-Teams & Kampagnen."}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formattedPrice}</p>
                      <p className="text-xs text-muted-foreground">einmaliger Kauf</p>
                    </div>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>

          <div className="flex items-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-3 text-sm text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            Sicherer Checkout – Rechnungen &amp; Belege werden automatisch per E-Mail versendet.
          </div>

          {summary && (
            <div className="rounded-xl border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ausgewähltes Paket</span>
                <span className="font-medium">{summary.amount} Tokens</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Gesamtbetrag</span>
                <span className="text-base font-semibold">{summary.formattedGross}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handlePurchase} disabled={isSubmitting || !selected} className="w-full sm:w-auto">
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

export default TokenPurchaseModalV2;
