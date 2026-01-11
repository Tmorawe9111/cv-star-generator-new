import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CVFormProvider } from '@/contexts/CVFormContext';
import CVGenerator from '@/components/CVGenerator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface CVGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const CVGeneratorModal: React.FC<CVGeneratorModalProps> = ({ 
  open, 
  onClose, 
  onComplete 
}) => {
  const navigate = useNavigate();
  const { profile, refetchProfile } = useAuth();
  const [isComplete, setIsComplete] = useState(false);

  // Check if CV is created (cv_url exists) and close modal automatically
  useEffect(() => {
    if (open && profile?.cv_url) {
      setIsComplete(true);
      onComplete?.();
      // Close modal after short delay when CV is created
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }, [open, profile?.cv_url, onComplete, onClose]);

  // Poll for profile updates while modal is open
  useEffect(() => {
    if (!open || isComplete) return;

    const interval = setInterval(() => {
      refetchProfile();
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [open, isComplete, refetchProfile]);

  const handleComplete = () => {
    setIsComplete(true);
    onComplete?.();
    // Refetch profile to check if it's complete
    refetchProfile().then(() => {
      // Close modal and redirect to dashboard after short delay
      setTimeout(() => {
        onClose();
        navigate('/mein-bereich');
      }, 1500);
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Allow closing the modal - user can close it manually
    if (!newOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-4xl md:max-w-6xl lg:max-w-7xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col mx-auto"
        onInteractOutside={(e) => {
          // Allow closing by clicking outside
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          // Allow closing with Escape key
          onClose();
        }}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">CV erstellen</DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Erstelle deinen Lebenslauf Schritt für Schritt. Deine bereits ausgefüllten Profildaten werden automatisch übernommen.
          </p>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CVFormProvider>
            {/* CVGenerator is used directly - profile data will be auto-loaded if profile is complete */}
            <CVGenerator onComplete={handleComplete} skipWelcomeStep={true} />
          </CVFormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

