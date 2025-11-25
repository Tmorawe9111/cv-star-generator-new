import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { CompanyBillingSnapshot } from "@/lib/billing-v2/types";
import { PLANS, type PlanKey } from "@/lib/billing-v2/plans";

interface TokenOverviewCardV2Props {
  company: CompanyBillingSnapshot | null;
  onBuyTokens: () => void;
  onUpgradePlan: () => void;
}

export function TokenOverviewCardV2({ company, onBuyTokens, onUpgradePlan }: TokenOverviewCardV2Props) {
  const planKey = (company?.plan_name || company?.active_plan_id || company?.selected_plan_id || "free") as PlanKey;
  const plan = PLANS[planKey] || PLANS["free"];
  
  // Tokens: active_tokens ist der verfügbare Bestand (wird beim Verwenden reduziert)
  // Für die Anzeige: "X von Y" bedeutet "X verfügbar von Y total"
  // active_tokens = verfügbarer Bestand, total_tokens_ever = gesamte Anzahl jemals gewährt/gekauft
  const availableTokens = (company as any)?.active_tokens ?? company?.available_tokens ?? 0; // Verfügbare Tokens (aktueller Bestand)
  const totalTokens = (company as any)?.total_tokens_ever ?? company?.monthly_tokens ?? plan.tokensPerMonth ?? 0; // Gesamte Anzahl jemals gewährt/gekauft
  
  // Progress Bar: verfügbar / total (nicht verwendet / total)
  const tokenPercentage = totalTokens > 0 ? Math.round((availableTokens / totalTokens) * 100) : 0;

  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">Token verfügbar</p>
          <p className="text-2xl font-bold text-gray-900">
            {availableTokens} von {totalTokens}
          </p>
        </div>
        
        <div className="mb-4">
          <Progress value={tokenPercentage} className="h-2" />
        </div>

        <div className="space-y-2 mb-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>{availableTokens} verfügbar</span>
          </div>
          {plan.maxAdditionalTokensPerMonth > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span>Bis zu {plan.maxAdditionalTokensPerMonth} zusätzliche Tokens pro Monat kaufbar</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" size="lg" onClick={onBuyTokens}>
            Zusätzliche Tokens kaufen
          </Button>
          <Button className="flex-1" variant="outline" size="lg" onClick={onUpgradePlan}>
            Plan upgraden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TokenOverviewCardV2;
