import { useMemo, useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLANS, PlanKey, PlanInterval, PLAN_ORDER, getPriceLabel } from "@/lib/billing-v2/plans";

interface UpgradePlanModalV2Props {
  open: boolean;
  currentPlan: PlanKey;
  onClose: () => void;
  onUpgrade: (plan: PlanKey, interval: PlanInterval) => Promise<void>;
  initialPlan?: PlanKey | null;
  initialInterval?: PlanInterval;
}

export function UpgradePlanModalV2({ open, currentPlan, onClose, onUpgrade, initialPlan, initialInterval }: UpgradePlanModalV2Props) {
  // Validate required props
  if (!onUpgrade || typeof onUpgrade !== 'function') {
    console.error('[UpgradePlanModalV2] onUpgrade prop is missing or not a function:', onUpgrade);
  }
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initialPlan ?? "basic");
  const [interval, setInterval] = useState<PlanInterval>(initialInterval ?? "month");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Set default selected plan to first available upgrade
      const currentIndex = PLAN_ORDER.indexOf(currentPlan);
      const nextPlan = PLAN_ORDER[currentIndex + 1];
      if (nextPlan) {
        setSelectedPlan(initialPlan ?? nextPlan);
      }
      setInterval(initialInterval ?? "month");
    }
  }, [open, initialPlan, initialInterval, currentPlan]);

  // Show only upgrade plans (not current plan)
  // Free → Basic, Growth, BeVisiblle (no Enterprise)
  // Basic → Growth, BeVisiblle (no Enterprise)
  // Growth → BeVisiblle (no Enterprise)
  // BeVisiblle → Enterprise
  // Enterprise → nothing
  const availablePlans = useMemo(() => {
    const currentIndex = PLAN_ORDER.indexOf(currentPlan);
    let plans = PLAN_ORDER.filter((_, index) => index > currentIndex);
    
    // Enterprise is only available from Basic plan onwards
    if (currentPlan === "free") {
      plans = plans.filter(plan => plan !== "enterprise");
    }
    
    return plans;
  }, [currentPlan]);

  const summary = useMemo(() => {
    const plan = PLANS[selectedPlan];
    const price = plan.prices[interval];
    const formatted = plan.showCheckout && price > 0 ? getPriceLabel(price) : "auf Anfrage";
    return {
      plan,
      price,
      formatted,
    };
  }, [selectedPlan, interval]);

  const handleConfirm = async () => {
    // If enterprise plan or no checkout, open sales email
    if (!summary.plan.showCheckout || summary.price === 0) {
      window.open(`mailto:sales@bevisiblle.com?subject=${summary.plan.label}%20Plan`, "_blank");
      return;
    }

    if (!onUpgrade || typeof onUpgrade !== 'function') {
      console.error('[UpgradePlanModalV2] onUpgrade is not a function:', onUpgrade);
      alert('Fehler: Upgrade-Funktion nicht verfügbar. Bitte Seite neu laden.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpgrade(selectedPlan, interval);
    } catch (error) {
      console.error('[UpgradePlanModalV2] Error in onUpgrade:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Allow closing even during submission - user can cancel
      onClose();
    }
  };

  if (availablePlans.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl gap-6">
          <DialogHeader>
            <DialogTitle>Plan upgraden</DialogTitle>
            <DialogDescription>
              Sie haben bereits den höchsten verfügbaren Plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl gap-6 flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Plan upgraden</DialogTitle>
          <DialogDescription>
            Wählen Sie einen Plan, der zu Ihrem Unternehmen passt. Sie können jederzeit upgraden. Bei jährlicher Zahlung sparen Sie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 min-h-0 pr-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Abrechnungsintervall</p>
            <Tabs value={interval} onValueChange={(value: PlanInterval) => setInterval(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="month">Monatlich</TabsTrigger>
                <TabsTrigger value="year">Jährlich (2 Monate geschenkt)</TabsTrigger>
              </TabsList>
              <TabsContent value="month" />
              <TabsContent value="year" />
            </Tabs>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verfügbare Upgrade-Pläne</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {availablePlans.map((planKey) => {
                const plan = PLANS[planKey];
                const isEnterprise = planKey === "enterprise";
                const isSelected = selectedPlan === planKey;
                const isContactOnly = !plan.showCheckout;
                const priceLabel = plan.showCheckout && plan.prices[interval] > 0 
                  ? getPriceLabel(plan.prices[interval]) 
                  : "auf Anfrage";
                const monthlyPriceInYearly = interval === "year" && plan.showCheckout && plan.prices.year > 0 
                  ? getPriceLabel(Math.round(plan.prices.year / 12)) 
                  : null;

                return (
                  <Card
                    key={planKey}
                    className={`flex h-full flex-col rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 border-2 shadow-lg ring-2 ring-blue-200"
                        : "border-border hover:border-blue-200 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedPlan(planKey)}
                  >
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CardTitle>{plan.label}</CardTitle>
                        <div className="flex gap-2">
                          {isSelected && <Badge variant="secondary">Ausgewählt</Badge>}
                          {plan.highlight && !isSelected && <Badge variant="default">Beliebt</Badge>}
                          {plan.ai !== "none" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                              <Sparkles className="h-3 w-3" /> AI
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-3xl font-semibold text-gray-900">{priceLabel}</div>
                      {plan.showCheckout && plan.prices[interval] > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">zzgl. MwSt.</p>
                          {monthlyPriceInYearly && (
                            <p className="text-xs text-muted-foreground">≈ {monthlyPriceInYearly} pro Monat</p>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
                      <div className="rounded-xl bg-muted/50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Sitze inklusive</span>
                          <span className="font-medium text-gray-900">
                            {plan.seatsIncluded === 0 ? (isEnterprise || planKey === "bevisiblle" ? "Unbegrenzt" : "Mehrere möglich") : plan.seatsIncluded}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span>Tokens pro Monat</span>
                          <span className="font-medium text-gray-900">
                            {plan.tokensPerMonth === 0 ? (isEnterprise || planKey === "bevisiblle" ? "Individuell" : "—") : plan.tokensPerMonth}
                          </span>
                        </div>
                      </div>
                      {isEnterprise ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-2">Topics:</p>
                          <ul className="space-y-1.5">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <ul className="space-y-1.5">
                          {plan.features.slice(0, 4).map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                    <CardFooter>
                      {isContactOnly ? (
                        <Button className="w-full" onClick={(e) => {
                          e.stopPropagation();
                          window.open(`mailto:sales@bevisiblle.com?subject=${plan.label}%20Plan`, "_blank");
                        }}>
                          Kontakt aufnehmen
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          variant={isSelected ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(planKey);
                          }}
                        >
                          {isSelected ? "Ausgewählt" : "Plan wählen"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {summary && (
            <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Neuer Plan</span>
                <span className="font-semibold">{summary.plan.label}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Abrechnungsintervall</span>
                <span className="font-semibold">{interval === "month" ? "Monatlich" : "Jährlich"}</span>
              </div>
              {summary.plan.showCheckout && summary.price > 0 ? (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Fälliger Betrag</span>
                  <span className="text-base font-semibold">{summary.formatted}</span>
                </div>
              ) : (
                <div className="mt-2 text-sm text-blue-700">
                  Für den {summary.plan.label} Plan kontaktieren wir Sie persönlich.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex-shrink-0 border-t pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="min-w-[180px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird geöffnet…
              </>
            ) : summary.plan.showCheckout && summary.price > 0 ? (
              "Weiter zur Zahlung"
            ) : (
              "Sales kontaktieren"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradePlanModalV2;
