import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { CompanyBillingSnapshot } from "@/lib/billing-v2/types";
import { PLANS, type PlanKey } from "@/lib/billing-v2/plans";

interface LovableStyleTokenWidgetProps {
  company: CompanyBillingSnapshot | null;
  subscription?: {
    current_period_end: string;
    status: string;
    cancel_at_period_end: boolean;
    plan_key?: string | null;
    interval?: string | null;
  } | null;
  collapsed?: boolean;
  onBuyTokens?: () => void;
  onUpgradePlan?: () => void;
}

export function LovableStyleTokenWidget({ company, subscription, collapsed, onBuyTokens, onUpgradePlan }: LovableStyleTokenWidgetProps) {
  if (collapsed) return null;

  // Priority: subscription.plan_key > company.active_plan_id > company.plan_name > company.selected_plan_id > "free"
  const planKey = (subscription?.plan_key || company?.active_plan_id || company?.plan_name || company?.selected_plan_id || "free") as PlanKey;
  const plan = PLANS[planKey] || PLANS["free"];
  
  // Tokens: active_tokens ist der verfügbare Bestand (wird beim Verwenden reduziert)
  // Für die Anzeige: "X von Y" bedeutet "X verfügbar von Y total"
  // active_tokens = verfügbarer Bestand, total_tokens_ever = gesamte Anzahl jemals gewährt/gekauft
  const availableTokens = (company as any)?.active_tokens ?? company?.available_tokens ?? 0; // Verfügbare Tokens (aktueller Bestand)
  const totalTokens = (company as any)?.total_tokens_ever ?? company?.monthly_tokens ?? plan.tokensPerMonth ?? 0; // Gesamte Anzahl jemals gewährt/gekauft
  
  // Progress Bar: verfügbar / total (nicht verwendet / total)
  const tokenPercentage = totalTokens > 0 ? Math.round((availableTokens / totalTokens) * 100) : 0;

  const renewalDate = subscription?.current_period_end
    ? format(new Date(subscription.current_period_end), "MMM d, yyyy", { locale: de })
    : company?.next_invoice_at
    ? format(new Date(company.next_invoice_at), "MMM d, yyyy", { locale: de })
    : null;

  const planLabel = plan.label || "Free";
  const companyName = company?.name || "Unternehmen";
  const companyLogo = company?.logo_url;

  return (
    <div className="space-y-3">
      {/* Plan Card - Clickable */}
      <div 
        className={[
          "rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors",
          onUpgradePlan ? "cursor-pointer hover:bg-gray-50" : "cursor-default opacity-90",
        ].join(" ")}
        onClick={onUpgradePlan ? onUpgradePlan : undefined}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={companyLogo || ""} alt={companyName} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white">
              {companyName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{companyName}</p>
            <p className="mt-1 text-xs text-gray-600">{planLabel} Plan</p>
            {renewalDate && (
              <p className="mt-0.5 text-xs text-gray-500">Verlängert sich {renewalDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Token Card - Clickable */}
      <div 
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onBuyTokens}
      >
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900">Token verfügbar</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {availableTokens} von {totalTokens}
          </p>
        </div>
        
        <div className="mb-3">
          <Progress value={tokenPercentage} className="h-2" />
        </div>

        <div className="space-y-2 text-xs text-gray-600">
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
      </div>
    </div>
  );
}

