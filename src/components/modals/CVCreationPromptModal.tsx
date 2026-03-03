import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, Upload } from 'lucide-react';
import { CVUploadModal } from '@/components/cv-upload/CVUploadModal';

interface CVCreationPromptModalProps {
  open: boolean;
  onContinue: () => void;
  onClose?: () => void;
  onUploadComplete?: (uploadId: string, extractedData?: Record<string, any>) => void;
  onUseOriginal?: (uploadId: string, storagePath: string) => void;
}

export const CVCreationPromptModal: React.FC<CVCreationPromptModalProps> = ({
  open,
  onContinue,
  onClose,
  onUploadComplete,
  onUseOriginal
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && onClose) {
        onClose();
      }
    }} modal={true}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:max-w-md mx-auto"
        onInteractOutside={(e) => {
          // Allow closing by clicking outside
          if (onClose) {
            onClose();
          }
        }}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            CV erstellen 🎉
          </DialogTitle>
          <DialogDescription className="text-base">
            Erstelle jetzt deinen Lebenslauf, damit Unternehmen dich finden können. Du kannst ihn später als PDF herunterladen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Mit deinem CV kannst du dich bei Unternehmen bewerben</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={onContinue}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            CV erstellen
          </Button>
          {onUploadComplete && (
            <Button 
              onClick={() => setShowUploadModal(true)}
              variant="outline"
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              CV hochladen
            </Button>
          )}
          {onClose && (
            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Später
            </Button>
          )}
        </div>

        {onUploadComplete && (
          <CVUploadModal
            open={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={(uploadId, extractedData) => {
              setShowUploadModal(false);
              onUploadComplete(uploadId, extractedData);
              onClose?.();
            }}
            onUseOriginal={onUseOriginal}
            onCreateNewLayout={(uploadId, extractedData) => {
              setShowUploadModal(false);
              onUploadComplete(uploadId, extractedData);
              onClose?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

