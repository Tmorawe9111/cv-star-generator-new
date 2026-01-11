import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProfileCreatedPopupProps {
  open: boolean;
  onContinue: () => void;
  userName?: string;
}

export const ProfileCreatedPopup: React.FC<ProfileCreatedPopupProps> = ({
  open,
  onContinue,
  userName
}) => {
  useEffect(() => {
    if (open) {
      // Trigger confetti animation when popup opens
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: NodeJS.Timeout = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Launch from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        
        // Launch from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}} modal={true}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {userName ? `${userName}, ` : ''}Dein Profil wurde erstellt! 🎉
          </DialogTitle>
          <DialogDescription className="text-base">
            Vervollständige jetzt dein Profil, damit es für Unternehmen sichtbar wird
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Mit deinem vollständigen Profil kannst du Jobs finden und dich bewerben</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={onContinue}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            Weiter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

