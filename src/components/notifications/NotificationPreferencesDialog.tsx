import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import NotifSettingsPanel from './NotifSettingsPanel';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function NotificationPreferencesDialog({ open, onOpenChange, userId }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Benachrichtigungseinstellungen</DialogTitle>
          <DialogDescription>
            Verwalten Sie Ihre Benachrichtigungspräferenzen.
          </DialogDescription>
        </DialogHeader>
        <NotifSettingsPanel userId={userId} />
      </DialogContent>
    </Dialog>
  );
}
