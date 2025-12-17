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
  const { data: plans, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      console.log("[AdminPlanManager] Fetching subscription plans...");
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("price_monthly_cents");
      
      if (error) {
        console.error("[AdminPlanManager] Error fetching plans:", error);
        throw error;
      }
      console.log("[AdminPlanManager] Plans loaded:", data);
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
      console.log("[AdminPlanManager] Starting plan assignment:", {
        companyId,
        selectedPlanId,
        customPriceMonthly,
        customPriceYearly,
        customTokens,
        customJobs,
        customSeats,
        customLocations,
        billingCycle,
      });

      if (!selectedPlanId) {
        throw new Error("Bitte wählen Sie einen Plan aus");
      }

      if (!companyId) {
        throw new Error("Keine Company ID vorhanden");
      }

      // Prepare parameters - only include non-empty values
      const params: any = {
        p_company_id: companyId,
        p_plan_id: selectedPlanId,
        p_billing_cycle: billingCycle,
        p_valid_from: new Date().toISOString(),
      };

      // Add optional parameters only if they have values
      if (customPriceMonthly) params.p_custom_price_monthly_cents = parseInt(customPriceMonthly);
      if (customPriceYearly) params.p_custom_price_yearly_cents = parseInt(customPriceYearly);
      if (customTokens) params.p_custom_tokens = parseInt(customTokens);
      if (customJobs) params.p_custom_jobs = parseInt(customJobs);
      if (customSeats) params.p_custom_seats = parseInt(customSeats);
      if (customLocations) params.p_custom_locations = parseInt(customLocations);
      if (customTokenPrice) params.p_custom_token_price_cents = parseInt(customTokenPrice);
      if (customMaxAdditionalTokens) params.p_custom_max_additional_tokens_per_month = parseInt(customMaxAdditionalTokens);
      if (validUntil) params.p_valid_until = new Date(validUntil).toISOString();
      if (notes) params.p_notes = notes;

      console.log("[AdminPlanManager] Calling RPC with params:", JSON.stringify(params, null, 2));

      const { data, error } = await supabase.rpc("admin_assign_plan", params);

      console.log("[AdminPlanManager] RPC response:", { 
        data, 
        error: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      });

      if (error) {
        console.error("[AdminPlanManager] RPC error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        
        // Provide more helpful error messages
        let errorMessage = error.message || "Fehler beim Zuweisen des Plans";
        if (error.code === "42883") {
          errorMessage = "Die Funktion admin_assign_plan existiert nicht oder hat falsche Parameter. Bitte Migration ausführen.";
        } else if (error.code === "42501") {
          errorMessage = "Keine Berechtigung. Bitte als Admin einloggen.";
        } else if (error.details) {
          errorMessage = `${errorMessage}\nDetails: ${error.details}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!data) {
        console.warn("[AdminPlanManager] RPC returned no data");
      }

      return data;
    },
    onSuccess: () => {
      console.log("[AdminPlanManager] Plan assignment successful");
      // Invalidate all company-related queries to force refresh
      queryClient.invalidateQueries({ queryKey: ["active-company-plan", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-company", companyId] });
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["job-limits", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company-locations", companyId] });
      // Force company data refresh by invalidating company_users query
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      // Also trigger a window event to force useCompany to refetch
      window.dispatchEvent(new CustomEvent('company-data-updated', { detail: { companyId } }));
      toast({ title: "Erfolg", description: "Plan erfolgreich zugewiesen. Die Änderungen werden in Kürze sichtbar." });
      resetForm();
    },
    onError: (error: Error) => {
      console.error("[AdminPlanManager] Mutation error:", error);
      toast({ 
        title: "Fehler", 
        description: error.message || "Plan konnte nicht zugewiesen werden", 
        variant: "destructive" 
      });
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
          <CardTitle>Plan-Upgrade & Limits anpassen</CardTitle>
          <CardDescription>
            Weise dem Unternehmen einen Plan zu oder passe Limits direkt an. Kostenlose Upgrades möglich (Preis auf 0 setzen).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Basis-Plan</Label>
            {plansLoading ? (
              <div className="text-sm text-muted-foreground">Lade Pläne...</div>
            ) : plansError ? (
              <div className="text-sm text-destructive">
                Fehler beim Laden der Pläne: {plansError instanceof Error ? plansError.message : "Unbekannter Fehler"}
              </div>
            ) : !plans || plans.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Keine Pläne verfügbar. Bitte erstelle zuerst Pläne im Admin-Panel.
              </div>
            ) : (
              <>
                <select
                  id="plan-select"
                  value={selectedPlanId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log("[AdminPlanManager] Plan selected:", value);
                    setSelectedPlanId(value);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Plan auswählen</option>
                  {plans.map((plan) => {
                    console.log("[AdminPlanManager] Rendering plan:", plan.id, plan.name);
                    return (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {formatCents(plan.price_monthly_cents)}/Monat
                      </option>
                    );
                  })}
                </select>
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  {selectedPlanId ? (
                    <p className="text-green-600 dark:text-green-400">
                      ✅ Ausgewählt: {plans.find(p => p.id === selectedPlanId)?.name}
                    </p>
                  ) : (
                    <p className="text-yellow-600 dark:text-yellow-400">
                      ⚠️ Bitte wählen Sie einen Plan aus
                    </p>
                  )}
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              💡 Tipp: Für kostenloses Upgrade setze den Preis auf 0 (siehe unten)
            </p>
            {plans && plans.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {plans.length} Plan{plans.length !== 1 ? "e" : ""} verfügbar
              </p>
            )}
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
              <Label htmlFor="customPriceMonthly">
                Custom Preis Monat (Cents)
                <span className="text-xs text-muted-foreground ml-2">(0 = kostenlos)</span>
              </Label>
              <Input
                id="customPriceMonthly"
                type="number"
                value={customPriceMonthly}
                onChange={(e) => setCustomPriceMonthly(e.target.value)}
                placeholder="0 für kostenlos oder Standard verwenden"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customPriceYearly">
                Custom Preis Jahr (Cents)
                <span className="text-xs text-muted-foreground ml-2">(0 = kostenlos)</span>
              </Label>
              <Input
                id="customPriceYearly"
                type="number"
                value={customPriceYearly}
                onChange={(e) => setCustomPriceYearly(e.target.value)}
                placeholder="0 für kostenlos oder Standard verwenden"
                min="0"
              />
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              ⚡ Schnelle Limit-Anpassungen
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Passe die Limits direkt an, ohne den gesamten Plan zu ändern. Leere Felder verwenden die Standardwerte des Plans.
            </p>
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
              onClick={() => {
                console.log("[AdminPlanManager] Button clicked:", { selectedPlanId, customPriceMonthly, customPriceYearly });
                if (!selectedPlanId) {
                  toast({ 
                    title: "Fehler", 
                    description: "Bitte wählen Sie zuerst einen Plan aus.", 
                    variant: "destructive" 
                  });
                  return;
                }
                assignPlanMutation.mutate();
              }}
              disabled={!selectedPlanId || assignPlanMutation.isPending}
              className="flex-1"
            >
              {assignPlanMutation.isPending ? "Wird zugewiesen..." : 
               (customPriceMonthly === "0" || customPriceYearly === "0")
                 ? "Kostenloses Upgrade durchführen" 
                 : "Plan zuweisen"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Zurücksetzen
            </Button>
          </div>
          
          {!selectedPlanId && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Bitte wählen Sie zuerst einen Plan aus dem Dropdown aus.
              </p>
            </div>
          )}
          
          {selectedPlanId && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Plan ausgewählt: {plans?.find(p => p.id === selectedPlanId)?.name || selectedPlanId}
              </p>
            </div>
          )}
          
          {(customPriceMonthly === "0" || customPriceYearly === "0") && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Kostenloses Upgrade wird durchgeführt. Das Unternehmen erhält alle Features ohne Zahlung.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}