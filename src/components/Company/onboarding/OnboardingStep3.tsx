import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { OnboardingData } from './OnboardingWizard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep3Props {
  data: OnboardingData;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function OnboardingStep3({ data, onNext, onPrev, onSkip }: OnboardingStep3Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Skip payment setup for free plan
  if (data.selectedPlan === 'free') {
    React.useEffect(() => {
      onSkip();
    }, []);
    return null;
  }

  const handleStripeSetup = async () => {
    setLoading(true);
    
    try {
      const { data: sessionData, error } = await supabase.functions.invoke('create-subscription', {
        body: { planId: data.selectedPlan }
      });

      if (error) throw error;

      if (sessionData?.url) {
        // Open Stripe checkout in new tab
        window.open(sessionData.url, '_blank');
        
        // For demo purposes, proceed to next step after a delay
        setTimeout(() => {
          onNext();
        }, 2000);
      }
    } catch (error) {
      console.error('Error setting up Stripe:', error);
      toast({
        title: "Fehler bei der Zahlungseinrichtung",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const planNames = {
    starter: 'Starter-Plan',
    premium: 'Premium-Plan',
    enterprise: 'Enterprise-Plan'
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Zahlungsdetails hinterlegen</h2>
        <p className="text-muted-foreground">
          Für {planNames[data.selectedPlan as keyof typeof planNames]} benötigen wir eine Zahlungsmethode.
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <CardTitle>Sichere Zahlung mit Stripe</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Ihre Zahlungsdaten werden sicher über Stripe verarbeitet.</p>
            <p>✓ SSL-verschlüsselt</p>
            <p>✓ PCI-DSS konform</p>
            <p>✓ Keine Kartendaten gespeichert</p>
          </div>
          
          <Button 
            onClick={handleStripeSetup}
            disabled={loading}
            className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Wird geladen...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Kreditkarte hinzufügen
              </>
            )}
          </Button>
          
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={onNext}
              className="text-sm"
            >
              Später einrichten
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      </div>
    </div>
  );
}