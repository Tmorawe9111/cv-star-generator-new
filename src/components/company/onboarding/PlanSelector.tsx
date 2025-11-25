import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2, Calendar } from 'lucide-react';
import { OnboardingPopup } from './OnboardingPopup';
import { PLANS, PLAN_ORDER, getPriceLabel, type PlanKey, type PlanInterval } from '@/lib/billing-v2/plans';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PlanSelectorProps {
  selectedPlanId?: string;
  onNext?: (planKey?: PlanKey, interval?: PlanInterval) => void;
  onSkip?: () => void;
  stepNumber?: number;
  totalSteps?: number;
  showSalesButton?: boolean;
  onContactSales?: () => void;
  embedded?: boolean; // If true, render without OnboardingPopup wrapper
}

export function PlanSelector({ selectedPlanId, onNext, onSkip, stepNumber, totalSteps, showSalesButton = false, onContactSales, embedded = false }: PlanSelectorProps) {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [selectedInterval, setSelectedInterval] = useState<PlanInterval>('year');
  const [loading, setLoading] = useState<string | null>(null);

  // If free plan, skip this step
  if (selectedPlanId === 'free') {
    onNext();
    return null;
  }

  const handleSelectPlan = async (planKey: PlanKey) => {
    if (!companyId) {
      toast({
        title: 'Fehler',
        description: 'Unternehmens-ID nicht gefunden',
        variant: 'destructive',
      });
      return;
    }

    setLoading(planKey);

    try {
      // Use direct fetch to get better error messages
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://koymmvuhcxlvcuoyjnvv.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveW1tdnVoY3hsdmN1b3lqbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODA3NTcsImV4cCI6MjA2OTk1Njc1N30.Pb5uz3xFH2Fupk9JSjcbxNrS-s_mE3ySnFy5B7HcZFw';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          companyId,
          plan: planKey,
          interval: selectedInterval,
        }),
      });

      // Parse response
      const data = await response.json().catch(() => ({}));

      // Check for errors
      if (!response.ok) {
        const errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`;
        const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
        const errorCode = data.code ? `\n\nCode: ${data.code}` : '';
        const hint = data.hint ? `\n\nHinweis: ${data.hint}` : '';
        throw new Error(errorMessage + errorDetails + errorCode + hint);
      }

      // Check if data contains an error (from Edge Function response)
      if (data?.error) {
        const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
        const errorCode = data.code ? `\n\nCode: ${data.code}` : '';
        const hint = data.hint ? `\n\nHinweis: ${data.hint}` : '';
        const setupLink = data.details?.includes('Supabase Secrets') 
          ? `\n\nSetup-Anleitung: Siehe STRIPE_PRICE_IDS_SETUP.md oder gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets`
          : '';
        throw new Error(data.error + errorDetails + errorCode + hint + setupLink);
      }

      // Save plan selection to database before redirecting
      if (companyId) {
        const { error: saveError } = await supabase
          .from('companies')
          .update({ 
            selected_plan_id: planKey,
            plan_interval: selectedInterval,
          })
          .eq('id', companyId);

        if (saveError) {
          console.error('Error saving plan:', saveError);
          // Don't throw - continue with checkout
        }
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      }

      // If no URL and no error, something unexpected happened
      throw new Error('Keine Weiterleitungs-URL erhalten. Bitte versuchen Sie es erneut.');
    } catch (error: any) {
      console.error('Error selecting plan:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Plan konnte nicht ausgewählt werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  // Filter out plans that shouldn't show in checkout
  const availablePlans = PLAN_ORDER.filter(key => PLANS[key].showCheckout);

  const content = (
    <div className={embedded ? "h-full flex flex-col" : ""}>
      {/* Interval Toggle */}
      <div className="flex items-center justify-center gap-2 mb-4 p-1 bg-muted rounded-lg w-fit mx-auto flex-shrink-0">
        <Button
          variant={selectedInterval === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedInterval('month')}
          className="px-4"
        >
          Monatlich
        </Button>
        <Button
          variant={selectedInterval === 'year' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedInterval('year')}
          className="px-4"
        >
          Jährlich
          <span className="ml-1 text-xs text-green-600 font-semibold">(sparen)</span>
        </Button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 ${embedded ? 'flex-1 min-h-0' : ''}`}>
        {availablePlans.map(planKey => {
          const plan = PLANS[planKey];
          const price = plan.prices[selectedInterval];
          const isHighlighted = plan.highlighted;
          const isGrowth = planKey === 'growth';
          const isLoading = loading === planKey;

          return (
            <Card
              key={planKey}
              className={`p-4 relative h-full flex flex-col ${
                isGrowth 
                  ? 'border-primary border-2 bg-primary/5 shadow-lg' 
                  : isHighlighted 
                    ? 'border-primary shadow-lg' 
                    : ''
              }`}
            >
              {isGrowth && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Beliebtester Plan
                </div>
              )}
              {isHighlighted && !isGrowth && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Beliebt
                </div>
              )}
              
              <h3 className={`text-lg font-bold mb-2 ${isGrowth ? 'text-primary' : ''}`}>{plan.label}</h3>
              <div className="mb-3">
                <span className="text-2xl font-bold">{getPriceLabel(price)}</span>
                <span className="text-muted-foreground text-sm">/{selectedInterval === 'month' ? 'Monat' : 'Jahr'}</span>
                {selectedInterval === 'year' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {getPriceLabel(price / 12)}/Monat
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-4 flex-1 text-sm">
                {plan.features
                  .filter((feature) => {
                    // Filter out "Max. 50 zusätzliche Tokens pro Monat kaufbar" for yearly plans
                    if (selectedInterval === 'year' && feature.includes('Max. 50 zusätzliche Tokens pro Monat kaufbar')) {
                      return false;
                    }
                    return true;
                  })
                  .map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isGrowth ? 'text-primary' : 'text-primary'}`} />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(planKey)}
                variant="default"
                className="w-full mt-auto bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  'Jetzt starten'
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Sales Contact Button */}
      {showSalesButton && onContactSales && (
        <div className="mb-3 flex-shrink-0">
          <Button
            onClick={onContactSales}
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Termin mit Sales buchen
          </Button>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Für ein individuelles Angebot und maßgeschneiderte Lösungen
          </p>
        </div>
      )}

      <Button
        onClick={() => onNext?.()}
        variant="ghost"
        className="w-full flex-shrink-0"
        disabled={!!loading}
      >
        Später entscheiden
      </Button>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <OnboardingPopup onSkip={onSkip} showSkip={!!onSkip} stepNumber={stepNumber} totalSteps={totalSteps}>
      <div className="p-8">
        {content}
      </div>
    </OnboardingPopup>
  );
}
