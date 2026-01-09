import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CVFormProvider } from '@/contexts/CVFormContext';
import CVGenerator from '@/components/CVGenerator';
import { useNavigate } from 'react-router-dom';

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
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = () => {
    setIsComplete(true);
    onComplete?.();
    // Close modal and redirect to dashboard after short delay
    setTimeout(() => {
      onClose();
      navigate('/mein-bereich');
    }, 1500);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isComplete) {
      // Warn user if they try to close before completing
      if (window.confirm('Möchtest du wirklich abbrechen? Dein Profil ist noch nicht vollständig.')) {
        onClose();
      }
    } else if (!newOpen && isComplete) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Vervollständige dein Profil</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Fülle die folgenden Felder aus, um dein Profil zu vervollständigen.
          </p>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <CVFormProvider>
            {/* CVGenerator is used directly without CVGeneratorGate since user just signed up */}
            <CVGenerator onComplete={handleComplete} />
          </CVFormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

