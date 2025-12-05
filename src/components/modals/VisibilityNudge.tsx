import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface VisibilityNudgeProps {
  open: boolean;
  onClose: () => void;
  onChoose: (choice: 'visible' | 'invisible') => void;
  allowClose?: boolean;
}

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

export function VisibilityInfoBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-3 z-[9996] mx-auto w-[min(640px,92vw)] rounded-xl bg-amber-50 text-amber-900 shadow ring-1 ring-amber-200 px-3 py-2 flex items-center gap-2"
         style={{ bottom: 'env(safe-area-inset-bottom, 12px)' }}>
      <span className="text-sm">
        Aktuell <strong>unsichtbar</strong> für Unternehmen.
      </span>
      <button 
        className="ml-auto text-sm underline hover:no-underline min-h-[44px] px-2" 
        onClick={onOpen}
      >
        Sichtbarkeit ändern
      </button>
    </div>
  );
}