import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import type { NotificationRow } from '@/types/notifications';

interface InterestRequestResponseProps {
  notification: NotificationRow;
  onAction?: (notification: NotificationRow, action: string) => void;
}

export function InterestRequestResponse({ notification, onAction }: InterestRequestResponseProps) {
  const [processing, setProcessing] = useState(false);
  const requestId = notification.payload?.request_id as string | undefined;
  const tokenCost = notification.payload?.token_cost as number | undefined;

  const handleConfirm = async () => {
    if (!requestId || processing) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('confirm_company_interest_request', {
        p_request_id: requestId,
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(
          data.already_unlocked 
            ? 'Profil war bereits freigeschaltet'
            : `Interesse-Anfrage bestätigt. ${data.tokens_spent} Tokens wurden abgebucht.`
        );
        onAction?.(notification, 'confirmed');
      } else {
        toast.error(data?.message || 'Fehler beim Bestätigen der Anfrage');
      }
    } catch (error: any) {
      console.error('Error confirming interest request:', error);
      toast.error(error?.message || 'Fehler beim Bestätigen der Anfrage');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!requestId || processing) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('reject_company_interest_request', {
        p_request_id: requestId,
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Interesse-Anfrage wurde abgelehnt');
        onAction?.(notification, 'rejected');
      } else {
        toast.error(data?.message || 'Fehler beim Ablehnen der Anfrage');
      }
    } catch (error: any) {
      console.error('Error rejecting interest request:', error);
      toast.error(error?.message || 'Fehler beim Ablehnen der Anfrage');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm text-muted-foreground">
        {tokenCost 
          ? `Nach Bestätigung werden ${tokenCost} Tokens vom Unternehmen abgebucht und Ihr Profil wird freigeschaltet.`
          : 'Nach Bestätigung wird Ihr Profil für das Unternehmen freigeschaltet.'}
      </p>
      <div className="flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={processing}
          size="sm"
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Wird verarbeitet...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Bestätigen
            </>
          )}
        </Button>
        <Button
          onClick={handleReject}
          disabled={processing}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          Ablehnen
        </Button>
      </div>
    </div>
  );
}

