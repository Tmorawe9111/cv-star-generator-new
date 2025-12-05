import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles } from 'lucide-react';

interface AddInterviewQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  onAddNow: () => void;
  onLater: () => void;
}

export function AddInterviewQuestionsModal({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onAddNow,
  onLater
}: AddInterviewQuestionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Interview-Fragen hinzufügen?
          </DialogTitle>
          <DialogDescription className="pt-2">
            Möchten Sie spezifische Interview-Fragen für die Stelle <strong>"{jobTitle}"</strong> hinzufügen?
            <br /><br />
            Kandidaten können diese Fragen nach der Freischaltung beantworten, um sich auf das Gespräch vorzubereiten.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Tipp:</p>
                <p>Wir können Ihnen basierend auf der Stellenbeschreibung passende Fragen vorschlagen.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onLater();
              onOpenChange(false);
            }}
          >
            Später
          </Button>
          <Button
            onClick={() => {
              onAddNow();
              onOpenChange(false);
            }}
          >
            Jetzt hinzufügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

