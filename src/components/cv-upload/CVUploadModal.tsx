import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CVUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete?: (uploadId: string, extractedData?: Record<string, any>) => void;
  onUseOriginal?: (uploadId: string, storagePath: string) => void;
  onCreateNewLayout?: (uploadId: string, extractedData?: Record<string, any>) => void;
}

export const CVUploadModal: React.FC<CVUploadModalProps> = ({
  open,
  onClose,
  onUploadComplete,
  onUseOriginal,
  onCreateNewLayout,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Das eigentliche Upload-/Extraktions-Handling liegt im Aufrufer,
      // hier übergeben wir nur die ausgewählte Datei-ID via callback.
      // Bis eine vollwertige Upload-Logik implementiert ist, simulieren wir eine Upload-ID.
      const fakeUploadId = `local-upload-${Date.now()}`;
      onUploadComplete?.(fakeUploadId);
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lebenslauf hochladen</DialogTitle>
          <DialogDescription>
            Lade deinen bestehenden Lebenslauf hoch. Wir extrahieren automatisch alle relevanten Daten und füllen deinen CV für dich vor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            className="w-full"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? 'Lade hoch…' : 'Datei auswählen'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Unterstützte Formate: PDF, DOC, DOCX. Größere Dateien können etwas länger dauern.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CVUploadModal;

