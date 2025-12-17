import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlanSelector } from "@/components/Company/onboarding/PlanSelector";
import { PLANS, PlanKey, PlanInterval } from "@/lib/billing-v2/plans";
import { PLAN_LOCATION_LIMITS } from "@/lib/billing-v2/gating";
import { useNavigate } from "react-router-dom";
import { Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";

interface LocationLimitUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: PlanKey | null;
  currentCount: number;
  maxAllowed: number;
  reason: "free" | "limit_reached";
}

const CALENDLY_LINK = "https://calendly.com/bevisiblle-sales";

export function LocationLimitUpgradeModal({
  open,
  onClose,
  currentPlan,
  currentCount,
  maxAllowed,
  reason,
}: LocationLimitUpgradeModalProps) {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);

  const handleUpgradeNow = () => {
    // Navigate to billing page with upgrade parameter
    navigate('/unternehmen/abrechnung?open=upgrade');
    onClose();
  };

  const handleLater = () => {
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const handlePlanSelected = async (planKey: PlanKey, interval: PlanInterval) => {
    if (!company?.id) {
      toast.error('Unternehmens-ID nicht gefunden');
      return;
    }
    
    // Use the stripe-checkout function directly
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://koymmvuhcxlvcuoyjnvv.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveW1tdnVoY3hsdmN1b3lqbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODA3NTcsImV4cCI6MjA2OTk1Njc1N30.Pb5uz3xFH2Fupk9JSjcbxNrS-s_mE3ySnFy5B7HcZFw';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          companyId: company.id,
          plan: planKey,
          interval: interval,
          appUrl: window.location.origin,
        }),
      });

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Fehler beim Erstellen der Checkout-Session');
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast.error('Fehler beim Starten des Checkout-Prozesses');
    }
    onClose();
  };

  const handleContactSales = () => {
    window.open(CALENDLY_LINK, "_blank");
    onClose();
  };

  // Get available upgrade plans
  const getAvailablePlans = (): PlanKey[] => {
    if (reason === "free" || currentPlan === "free") {
      return ["basic", "growth", "enterprise"];
    }
    
    // If limit reached, show higher plans
    if (currentPlan === "basic") {
      return ["growth", "enterprise"];
    }
    if (currentPlan === "growth") {
      return ["enterprise"];
    }
    return [];
  };

  const availablePlans = getAvailablePlans();

  if (showPlanSelector) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowPlanSelector(false);
          handleClose();
        }
      }}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] p-6 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 mb-4">
            <DialogTitle className="text-xl">Plan auswählen</DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Wählen Sie einen Plan, um mehr Standorte hinzuzufügen
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <PlanSelector
              selectedPlanId={selectedPlan || undefined}
              onNext={handlePlanSelected}
              onSkip={() => {
                setShowPlanSelector(false);
                handleClose();
              }}
              showSalesButton={true}
              onContactSales={handleContactSales}
              embedded={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Prevent closing if reason is "free" - user must upgrade
        if (reason === "free" && !isOpen) {
          return;
        }
        if (isOpen !== open) {
          handleClose();
        }
      }}
    >
      <DialogContent 
        className={reason === "free" ? "pointer-events-auto" : ""}
        onPointerDownOutside={(e) => {
          // Prevent closing if reason is "free"
          if (reason === "free") {
            e.preventDefault();
          } else {
            handleClose();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing if reason is "free"
          if (reason === "free") {
            e.preventDefault();
          } else {
            handleClose();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {reason === "free" 
              ? "Plan-Upgrade erforderlich" 
              : "Standort-Limit erreicht"}
          </DialogTitle>
          <DialogDescription>
            {reason === "free" ? (
              <>
                Sie benötigen einen bezahlten Plan, um Standorte hinzuzufügen.
                <br />
                <br />
                Mit einem bezahlten Plan können Sie:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Mehrere Standorte verwalten</li>
                  <li>Kandidaten nach Standort filtern</li>
                  <li>Ihr Team erweitern</li>
                </ul>
              </>
            ) : (
              <>
                Sie haben das Limit von {maxAllowed} Standort{maxAllowed === 1 ? "" : "en"} erreicht ({currentCount}/{maxAllowed}).
                <br />
                <br />
                Upgrade auf einen höheren Plan, um mehr Standorte hinzuzufügen:
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {reason === "limit_reached" && availablePlans.length > 0 && (
          <div className="space-y-3 py-4">
            {availablePlans.map((planKey) => {
              const plan = PLANS[planKey];
              const planMaxLocations = PLAN_LOCATION_LIMITS[planKey] ?? 1;
              return (
                <div
                  key={planKey}
                  className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer"
                  onClick={() => {
                    setSelectedPlan(planKey);
                    setShowPlanSelector(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{plan.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {planMaxLocations === 999999
                          ? "Unbegrenzte Standorte"
                          : `${planMaxLocations} Standorte inklusive`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {plan.prices.month}€/Monat
                      </p>
                      <p className="text-sm text-muted-foreground">
                        oder {plan.prices.year}€/Jahr
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {currentPlan === "growth" && (
              <div className="border rounded-lg p-4 bg-accent/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Individuelles Angebot
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Vereinbaren Sie ein Gespräch mit unserem Sales-Team
                    </p>
                  </div>
                  <Button onClick={handleContactSales} variant="outline">
                    Gespräch vereinbaren
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {reason === "free" ? (
            <>
              <Button variant="outline" onClick={handleLater}>
                Später upgraden
              </Button>
              <Button onClick={handleUpgradeNow}>
                Plan jetzt upgraden
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleLater} className="w-full sm:w-auto">
                Schließen
              </Button>
              <Button onClick={handleUpgradeNow} className="w-full sm:w-auto">
                Plan upgraden
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

