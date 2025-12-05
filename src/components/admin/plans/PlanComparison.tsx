import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Infinity } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_monthly_cents: number;
  price_yearly_cents: number;
  included_tokens: number;
  included_jobs: number;
  included_seats: number;
  included_locations: number;
  max_locations: number | null;
  token_price_cents: number;
  max_additional_tokens_per_month: number | null;
  ai_level: string;
  active: boolean;
  highlight: boolean;
  max_active_jobs: number | null;
  features: string[] | null;
}

interface PlanComparisonProps {
  plans: Plan[];
  isLoading: boolean;
}

export function PlanComparison({ plans, isLoading }: PlanComparisonProps) {
  const formatPrice = (cents: number) => {
    if (cents === 0) return "Kostenlos";
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatUnlimited = (value: number | null) => {
    if (value === null || value === -1) return <Infinity className="h-4 w-4 inline" />;
    return value.toString();
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return <Infinity className="h-4 w-4 inline" />;
    if (typeof value === "boolean") return value ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />;
    return value.toString();
  };

  const activePlans = plans.filter((p) => p.active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (activePlans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Keine aktiven Pläne zum Vergleichen</p>
        </CardContent>
      </Card>
    );
  }

  const comparisonFields = [
    { label: "Preis (Monat)", key: "price_monthly_cents", format: formatPrice },
    { label: "Preis (Jahr)", key: "price_yearly_cents", format: formatPrice },
    { label: "Tokens inklusive", key: "included_tokens", format: formatValue },
    { label: "Token-Preis", key: "token_price_cents", format: formatPrice },
    { label: "Max. Zusatz-Tokens/Monat", key: "max_additional_tokens_per_month", format: formatUnlimited },
    { label: "Jobs inklusive", key: "included_jobs", format: formatValue },
    { label: "Max. Aktive Jobs", key: "max_active_jobs", format: formatUnlimited },
    { label: "Seats inklusive", key: "included_seats", format: formatValue },
    { label: "Standorte inklusive", key: "included_locations", format: formatValue },
    { label: "Max. Standorte", key: "max_locations", format: formatUnlimited },
    { label: "AI-Level", key: "ai_level", format: (value: string) => <Badge variant="outline">{value}</Badge> },
    { label: "Empfohlen", key: "highlight", format: formatValue },
    { 
      label: "Features", 
      key: "features", 
      format: (value: string[] | null) => {
        if (!value || !Array.isArray(value) || value.length === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {value.slice(0, 2).map((f, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {f}
              </Badge>
            ))}
            {value.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{value.length - 2}
              </Badge>
            )}
          </div>
        );
      }
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan-Vergleich</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b font-semibold sticky left-0 bg-background z-10">
                  Feature
                </th>
                {activePlans.map((plan) => (
                  <th
                    key={plan.id}
                    className={`text-center p-4 border-b font-semibold min-w-[180px] ${
                      plan.highlight ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span>{plan.name}</span>
                      {plan.highlight && (
                        <Badge variant="default" className="text-xs">
                          Empfohlen
                        </Badge>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFields.map((field) => (
                <tr key={field.key} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium sticky left-0 bg-background z-10">
                    {field.label}
                  </td>
                  {activePlans.map((plan) => (
                    <td
                      key={`${plan.id}-${field.key}`}
                      className={`text-center p-4 ${
                        plan.highlight ? "bg-primary/5" : ""
                      }`}
                    >
                      {field.format((plan as any)[field.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

