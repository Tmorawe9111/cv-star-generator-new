import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Calendar, Coins, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminPlanManagerProps {
  companyId: string;
}

export function AdminPlanManager({ companyId }: AdminPlanManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [customTokens, setCustomTokens] = useState<string>("");
  const [customJobs, setCustomJobs] = useState<string>("");
  const [customSeats, setCustomSeats] = useState<string>("");
  const [customLocations, setCustomLocations] = useState<string>("");
  const [customTokenPrice, setCustomTokenPrice] = useState<string>("");
  const [customMaxAdditionalTokens, setCustomMaxAdditionalTokens] = useState<string>("");
  const [customPriceMonthly, setCustomPriceMonthly] = useState<string>("");
  const [customPriceYearly, setCustomPriceYearly] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<string>("monthly");
  const [validUntil, setValidUntil] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch available plans (Free, Base, Pro, Custom)
  const { data: plans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("price_monthly_cents");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch active plan assignment
  const { data: activePlan } = useQuery({
    queryKey: ["active-company-plan", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_active_company_plan", { p_company_id: companyId });
      
      if (error) throw error;
      return data?.[0];
    },
  });

  const assignPlanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("admin_assign_plan", {
        p_company_id: companyId,
        p_plan_id: selectedPlanId,
        p_custom_price_monthly_cents: customPriceMonthly ? parseInt(customPriceMonthly) : null,
        p_custom_price_yearly_cents: customPriceYearly ? parseInt(customPriceYearly) : null,
        p_custom_tokens: customTokens ? parseInt(customTokens) : null,
        p_custom_jobs: customJobs ? parseInt(customJobs) : null,
        p_custom_seats: customSeats ? parseInt(customSeats) : null,
        p_custom_locations: customLocations ? parseInt(customLocations) : null,
        p_custom_token_price_cents: customTokenPrice ? parseInt(customTokenPrice) : null,
        p_custom_max_additional_tokens_per_month: customMaxAdditionalTokens ? parseInt(customMaxAdditionalTokens) : null,
        p_billing_cycle: billingCycle,
        p_valid_from: new Date().toISOString(),
        p_valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        p_notes: notes || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-company-plan", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-company", companyId] });
      toast({ title: "Erfolg", description: "Plan erfolgreich zugewiesen" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedPlanId("");
    setCustomTokens("");
    setCustomJobs("");
    setCustomSeats("");
    setCustomLocations("");
    setCustomTokenPrice("");
    setCustomMaxAdditionalTokens("");
    setCustomPriceMonthly("");
    setCustomPriceYearly("");
    setValidUntil("");
    setNotes("");
  };

  const formatCents = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatUnlimited = (value: number | null) => {
    if (value === null || value === -1) return "∞";
    return value.toString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Aktueller Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-2xl font-bold">{activePlan.plan_name || "Kein Plan"}</p>
                </div>
                <Badge variant="default">Aktiv</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    Tokens
                  </p>
                  <p className="font-semibold">{formatUnlimited(activePlan.tokens)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jobs</p>
                  <p className="font-semibold">{formatUnlimited(activePlan.jobs)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seats</p>
                  <p className="font-semibold">{formatUnlimited(activePlan.seats)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Standorte
                  </p>
                  <p className="font-semibold">{formatUnlimited(activePlan.locations)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preis (monatlich)</p>
                  <p className="font-semibold">{formatCents(activePlan.price_monthly_cents)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preis (jährlich)</p>
                  <p className="font-semibold">{formatCents(activePlan.price_yearly_cents)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Token-Preis</p>
                  <p className="font-semibold">{formatCents(activePlan.token_price_cents)}</p>
                </div>
                {activePlan.max_additional_tokens_per_month !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Max. Zusatz-Tokens/Monat</p>
                    <p className="font-semibold">{formatUnlimited(activePlan.max_additional_tokens_per_month)}</p>
                  </div>
                )}
                {activePlan.ai_level && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI-Level
                    </p>
                    <Badge variant="outline">{activePlan.ai_level}</Badge>
                  </div>
                )}
              </div>

              {activePlan.valid_until && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Gültig bis: {new Date(activePlan.valid_until).toLocaleDateString("de-DE")}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">Kein aktiver Plan zugewiesen</p>
              <p className="text-sm text-muted-foreground">
                Weisen Sie diesem Unternehmen einen Plan zu, um Features und Limits zu verwalten.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Neuen Plan zuweisen</CardTitle>
          <CardDescription>
            Weise dem Unternehmen einen Plan mit individuellen Anpassungen zu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Basis-Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Plan auswählen" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - {formatCents(plan.price_monthly_cents)}/Monat
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customTokens">Custom Tokens (optional)</Label>
              <Input
                id="customTokens"
                type="number"
                value={customTokens}
                onChange={(e) => setCustomTokens(e.target.value)}
                placeholder="Standard verwenden"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customJobs">Custom Jobs (optional)</Label>
              <Input
                id="customJobs"
                type="number"
                value={customJobs}
                onChange={(e) => setCustomJobs(e.target.value)}
                placeholder="Standard verwenden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customSeats">Custom Seats (optional)</Label>
              <Input
                id="customSeats"
                type="number"
                value={customSeats}
                onChange={(e) => setCustomSeats(e.target.value)}
                placeholder="Standard verwenden"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customLocations">Custom Standorte (optional)</Label>
              <Input
                id="customLocations"
                type="number"
                value={customLocations}
                onChange={(e) => setCustomLocations(e.target.value)}
                placeholder="Standard verwenden"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customTokenPrice">Custom Token-Preis (Cents) (optional)</Label>
              <Input
                id="customTokenPrice"
                type="number"
                value={customTokenPrice}
                onChange={(e) => setCustomTokenPrice(e.target.value)}
                placeholder="Standard verwenden (z.B. 1800 = 18€)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customMaxAdditionalTokens">Max. Zusatz-Tokens/Monat (optional)</Label>
              <Input
                id="customMaxAdditionalTokens"
                type="number"
                value={customMaxAdditionalTokens}
                onChange={(e) => setCustomMaxAdditionalTokens(e.target.value)}
                placeholder="Standard verwenden (leer = unbegrenzt)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCycle">Abrechnungszyklus</Label>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                  <SelectItem value="custom">Individuell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customPriceMonthly">Custom Preis Monat (Cents)</Label>
              <Input
                id="customPriceMonthly"
                type="number"
                value={customPriceMonthly}
                onChange={(e) => setCustomPriceMonthly(e.target.value)}
                placeholder="Standard verwenden"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customPriceYearly">Custom Preis Jahr (Cents)</Label>
              <Input
                id="customPriceYearly"
                type="number"
                value={customPriceYearly}
                onChange={(e) => setCustomPriceYearly(e.target.value)}
                placeholder="Standard verwenden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validUntil">Gültig bis (optional)</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionale Notizen zur Zuweisung"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => assignPlanMutation.mutate()}
              disabled={!selectedPlanId || assignPlanMutation.isPending}
            >
              {assignPlanMutation.isPending ? "Wird zugewiesen..." : "Plan zuweisen"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}