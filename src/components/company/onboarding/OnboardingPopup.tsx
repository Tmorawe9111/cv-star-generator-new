import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface OnboardingPopupProps {
  children: ReactNode;
  onSkip?: () => void;
  showSkip?: boolean;
  stepNumber?: number;
  totalSteps?: number;
}

export function OnboardingPopup({ children, onSkip, showSkip = true, stepNumber, totalSteps }: OnboardingPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="w-full max-w-2xl mx-6 bg-card border border-border/60 rounded-3xl shadow-soft-xl relative">
        {showSkip && onSkip && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {stepNumber !== undefined && totalSteps !== undefined && (
              <span className="text-sm text-muted-foreground">
                {stepNumber + 1} / {totalSteps}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
