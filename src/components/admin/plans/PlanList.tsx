import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Star,
  Coins,
  Users,
  Briefcase,
  MapPin,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

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
  sort_order: number;
  highlight: boolean;
  description: string | null;
  max_active_jobs: number | null;
  features: string[] | null;
}

interface PlanListProps {
  plans: Plan[];
  isLoading: boolean;
  onEdit: (planId: string) => void;
}

export function PlanList({ plans, isLoading, onEdit }: PlanListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ planId, active }: { planId: string; active: boolean }) => {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ active })
        .eq("id", planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast({
        title: "Erfolg",
        description: "Plan-Status erfolgreich aktualisiert",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      // Check if plan is used by any companies
      const { data: assignments, error: checkError } = await supabase
        .from("company_plan_assignments")
        .select("id")
        .eq("plan_id", planId)
        .limit(1);

      if (checkError) throw checkError;

      if (assignments && assignments.length > 0) {
        throw new Error("Plan wird noch von Unternehmen verwendet und kann nicht gelöscht werden");
      }

      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast({
        title: "Erfolg",
        description: "Plan erfolgreich gelöscht",
      });
      setDeletingPlanId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatUnlimited = (value: number | null) => {
    if (value === null || value === -1) return "∞";
    return value.toString();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Keine Pläne vorhanden</p>
          <Button onClick={() => onEdit("new")}>Ersten Plan erstellen</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.highlight ? "border-primary border-2" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.highlight && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        Empfohlen
                      </Badge>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  )}
                </div>
                <Badge variant={plan.active ? "default" : "secondary"}>
                  {plan.active ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preis (Monat)</span>
                  <span className="font-semibold">{formatPrice(plan.price_monthly_cents)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preis (Jahr)</span>
                  <span className="font-semibold">{formatPrice(plan.price_yearly_cents)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Tokens</div>
                    <div className="font-semibold">{formatUnlimited(plan.included_tokens)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Jobs</div>
                    <div className="font-semibold">{formatUnlimited(plan.max_active_jobs)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Seats</div>
                    <div className="font-semibold">{formatUnlimited(plan.included_seats)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Standorte</div>
                    <div className="font-semibold">{formatUnlimited(plan.included_locations)}</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Token-Preis</span>
                  <span className="font-semibold">{formatPrice(plan.token_price_cents)}</span>
                </div>
                {plan.max_additional_tokens_per_month !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max. Zusatz-Tokens/Monat</span>
                    <span className="font-semibold">{formatUnlimited(plan.max_additional_tokens_per_month)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">AI-Level:</span>
                  <Badge variant="outline">{plan.ai_level}</Badge>
                </div>
                {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-1">Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {plan.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{plan.features.length - 3} weitere
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(plan.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActiveMutation.mutate({ 
                    planId: plan.id, 
                    active: !plan.active 
                  })}
                  disabled={toggleActiveMutation.isPending}
                >
                  {plan.active ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingPlanId(plan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deletingPlanId !== null} onOpenChange={(open) => !open && setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Plan löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Plan wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              Der Plan kann nur gelöscht werden, wenn er nicht von Unternehmen verwendet wird.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlanId && deleteMutation.mutate(deletingPlanId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

