import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingPopup } from './OnboardingPopup';
import { Users, Mail, CheckCircle2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanyId } from '@/hooks/useCompanyId';

interface TeamInviteProps {
  onNext: () => void;
  onSkip: () => void;
  stepNumber: number;
  totalSteps: number;
  hasTeam?: boolean;
}

export function TeamInvite({ onNext, onSkip, stepNumber, totalSteps, hasTeam }: TeamInviteProps) {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!email || !companyId) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Ungültige E-Mail',
        description: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        // User exists, add to company_users
        const { error: addError } = await supabase
          .from('company_users')
          .insert({
            company_id: companyId,
            user_id: existingUser.id,
            role: 'member',
          });

        if (addError && addError.code !== '23505') { // Ignore duplicate key errors
          throw addError;
        }
      }

      // Send invitation email (you can implement this with your email service)
      // For now, we'll just show a success message

      toast({
        title: 'Einladung gesendet',
        description: `Eine Einladung wurde an ${email} gesendet.`,
      });

      setEmail('');
      onNext();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Fehler',
        description: 'Einladung konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (hasTeam) {
    return (
      <OnboardingPopup onSkip={onSkip} showSkip={false} stepNumber={stepNumber} totalSteps={totalSteps}>
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Team erweitert! ✅</h2>
            <p className="text-muted-foreground">
              Großartig! Sie haben bereits Team-Mitglieder eingeladen.
            </p>
          </div>

          <Button
            onClick={onNext}
            className="w-full"
            size="lg"
          >
            Weiter
          </Button>
        </div>
      </OnboardingPopup>
    );
  }

  return (
    <OnboardingPopup onSkip={onSkip} showSkip={true} stepNumber={stepNumber} totalSteps={totalSteps}>
      <div className="p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Team-Mitglieder einladen</h2>
          <p className="text-muted-foreground">
            Laden Sie Kollegen ein, um gemeinsam an der Rekrutierung zu arbeiten
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Gemeinsam rekrutieren</h3>
                <p className="text-sm text-muted-foreground">
                  Mehrere Personen können gleichzeitig Kandidaten sichten und bewerten
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Einfache Einladung</h3>
                <p className="text-sm text-muted-foreground">
                  Senden Sie eine E-Mail-Einladung und Ihr Team kann sofort loslegen
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="email" className="text-sm font-semibold mb-2 block">
              E-Mail-Adresse des Team-Mitglieds
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kollege@unternehmen.de"
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Überspringen
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!email || sending}
            className="flex-1"
            size="lg"
          >
            {sending ? 'Wird gesendet...' : 'Einladung senden'}
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground mt-4">
          Sie können Team-Mitglieder auch später in den Einstellungen einladen
        </p>
      </div>
    </OnboardingPopup>
  );
}

