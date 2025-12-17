import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VisibilityNudgeProps {
  open: boolean;
  onClose: () => void;
  onChoose: (choice: 'visible' | 'invisible') => void;
  allowClose?: boolean;
}

// NOTE: Deprecated. We use the unified `VisibilityPrompt` everywhere now.
export function VisibilityNudge({ open, onClose, onChoose, allowClose = true }: VisibilityNudgeProps) {
  const handleChoice = (choice: 'visible' | 'invisible') => {
    onChoose(choice);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={allowClose ? onClose : undefined}>
      <DialogContent 
        className="w-[min(560px,92vw)] max-h-[90dvh] overflow-auto p-4 sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Sichtbar für Unternehmen werden?</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Du kannst für passende Unternehmen auffindbar sein.
          </p>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={() => handleChoice('visible')}
            className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700"
          >
            Jetzt sichtbar
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleChoice('invisible')}
            className="flex-1 min-h-[44px]"
          >
            Unsichtbar bleiben
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function VisibilityInfoBanner({ onOpen, onDismiss }: { onOpen: () => void; onDismiss: () => void }) {
  return (
    <div
      className={[
        // Mobile: centered and ABOVE BottomNav so it never blocks it
        "fixed inset-x-0 z-[9996] mx-auto w-[min(680px,92vw)]",
        "rounded-2xl bg-white/85 backdrop-blur shadow-lg ring-1 ring-black/10",
        "px-3 py-2.5 flex items-center gap-2",
        // Desktop: bottom-right toast style
        "md:left-auto md:right-6 md:bottom-6 md:w-[min(520px,40vw)]",
      ].join(" ")}
      style={{
        // BottomNav sits at bottom:0 with its own height. We place this ABOVE it.
        bottom: "calc(env(safe-area-inset-bottom) + 72px)",
      }}
      role="status"
      aria-live="polite"
    >
      <span className="text-sm text-foreground">
        Aktuell <strong>unsichtbar</strong> für Unternehmen.
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto h-9 rounded-full px-3 text-sm underline-offset-4 hover:underline"
        onClick={onOpen}
      >
        Sichtbarkeit ändern
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={onDismiss}
        aria-label="Banner schließen"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}