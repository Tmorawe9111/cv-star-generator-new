import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_ORDER, PLANS, PlanInterval, PlanKey, getPriceLabel, isHigherPlan } from "@/lib/billing-v2/plans";

interface PlansGridV2Props {
  companyPlan: PlanKey;
  companyInterval?: PlanInterval | null;
  onSelectPlan: (plan: PlanKey, interval: PlanInterval) => void;
}

export function PlansGridV2({ companyPlan, companyInterval, onSelectPlan }: PlansGridV2Props) {
  // Default to "year" if company has yearly subscription, otherwise "year" as default
  const [interval, setInterval] = useState<PlanInterval>(companyInterval === "month" ? "month" : "year");

  // Show current plan + upgrades only (no downgrades, exclude free from grid)
  const candidatePlans = useMemo(() => {
    const currentPlanIndex = PLAN_ORDER.indexOf(companyPlan);
    // Include current plan and all higher plans, but exclude "free" from display
    return PLAN_ORDER.filter((plan, index) => index >= currentPlanIndex && plan !== "free");
  }, [companyPlan]);

  if (candidatePlans.length === 0) return null;
  
  // If company has yearly subscription, don't allow switching to monthly
  const isYearlySubscription = companyInterval === "year";

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Unsere Pläne</h2>
        <p className="text-sm text-muted-foreground">
          Wählen Sie den passenden Plan für Ihr Recruiting-Team. Sie können jederzeit upgraden.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Abrechnungsintervall</span>
        <div className="flex items-center overflow-hidden rounded-full border">
          <button
            type="button"
            onClick={() => setInterval("month")}
            disabled={isYearlySubscription}
            className={`px-3 py-1 transition ${
              interval === "month" 
                ? "bg-blue-600 text-white" 
                : isYearlySubscription 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-background"
            }`}
            title={isYearlySubscription ? "Bei jährlichem Plan nicht verfügbar" : ""}
          >
            Monatlich
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`px-3 py-1 transition ${interval === "year" ? "bg-blue-600 text-white" : "bg-background"}`}
          >
            Jährlich
          </button>
        </div>
        {interval === "year" && <span className="text-blue-600">Sparen Sie bei jährlicher Zahlung</span>}
        {isYearlySubscription && interval === "month" && (
          <span className="text-orange-600">Bei jährlichem Plan nur jährlich verfügbar</span>
        )}
      </div>
      {isYearlySubscription && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="font-medium">Sie haben einen jährlichen Plan. Upgrades werden automatisch um ein Jahr verlängert.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {candidatePlans.map((planKey) => (
          <PlanCard 
            key={planKey} 
            planKey={planKey} 
            companyPlan={companyPlan}
            interval={isYearlySubscription && interval === "month" ? "year" : interval} 
            onSelectPlan={onSelectPlan}
            isCurrentPlan={planKey === companyPlan}
          />
        ))}
      </div>

      {/* Sales Contact Footer */}
      <div className="mt-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 text-center shadow-sm">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-blue-900">Kein Plan für Sie dabei?</p>
            <p className="text-sm text-blue-700">
              Kontaktieren Sie unser Sales-Team für individuelle Lösungen und maßgeschneiderte Angebote.
            </p>
          </div>
          <Button 
            onClick={() => window.open("mailto:sales@bevisiblle.com?subject=Individuelles%20Angebot", "_blank")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 shadow-md hover:shadow-lg transition-all"
          >
            Sales kontaktieren
          </Button>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ planKey, companyPlan, interval, onSelectPlan, isCurrentPlan }: { planKey: PlanKey; companyPlan: PlanKey; interval: PlanInterval; onSelectPlan: (plan: PlanKey, interval: PlanInterval) => void; isCurrentPlan?: boolean }) {
  const plan = PLANS[planKey];
  const isContactOnly = !plan.showCheckout;
  const priceLabel = plan.showCheckout ? getPriceLabel(plan.prices[interval]) : "auf Anfrage";
  const monthlyPriceInYearly = interval === "year" && plan.showCheckout ? getPriceLabel(Math.round(plan.prices.year / 12)) : null;

  return (
    <Card className={`flex h-full flex-col rounded-2xl border ${
      isCurrentPlan 
        ? "border-blue-500 border-2 shadow-lg ring-2 ring-blue-200" 
        : plan.highlight 
          ? "border-blue-400 shadow-lg" 
          : "border-border"
    }`}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>{plan.label}</CardTitle>
          <div className="flex gap-2">
            {isCurrentPlan && <Badge variant="secondary">Dein Plan</Badge>}
            {plan.highlight && !isCurrentPlan && <Badge variant="default">Beliebt</Badge>}
          </div>
        </div>
        <div className="text-3xl font-semibold text-gray-900">{priceLabel}</div>
        {plan.showCheckout && (
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
              {plan.seatsIncluded === 0 ? (planKey === "enterprise" || planKey === "bevisiblle" ? "Unbegrenzt" : "Mehrere möglich") : plan.seatsIncluded}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Tokens pro Monat</span>
            <span className="font-medium text-gray-900">
              {plan.tokensPerMonth === 0 ? (planKey === "enterprise" || planKey === "bevisiblle" ? "Individuell" : "—") : plan.tokensPerMonth}
            </span>
          </div>
        </div>
        <ul className="space-y-1.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isContactOnly ? (
          <Button className="w-full" onClick={() => window.open(`mailto:sales@bevisiblle.com?subject=${plan.label}%20Plan`, "_blank")}>Kontakt aufnehmen</Button>
        ) : isCurrentPlan ? (
          <Button className="w-full" variant="outline" disabled>
            Aktueller Plan
          </Button>
        ) : (
          <Button className="w-full" onClick={() => onSelectPlan(planKey, interval)}>
            Upgraden
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default PlansGridV2;
