import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AppleOnboardingWizard } from './AppleOnboardingWizard';

interface AppleOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppleOnboardingModal({ open, onOpenChange }: AppleOnboardingModalProps) {
  // Prevent closing the modal by clicking outside or pressing ESC
  const handleOpenChange = (newOpen: boolean) => {
    // Only allow closing if explicitly called from within (onComplete)
    // This prevents accidental closing
    if (!newOpen && open) {
      // Modal is trying to close - prevent it
      return;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className="max-w-[90vw] max-h-[90vh] w-full h-[90vh] p-0 overflow-hidden [&>button]:hidden rounded-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Unternehmens-Onboarding</DialogTitle>
        <div className="h-full flex flex-col overflow-hidden bg-white">
          <AppleOnboardingWizard onComplete={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

