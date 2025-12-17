import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Loader2, Clock } from 'lucide-react';
import { acceptInterviewRequest, declineInterviewRequest, createTimeSlotProposal } from '@/lib/api/interview-requests';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface InterviewRequestResponseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewRequestId: string;
  timeSlots?: Array<{ start: string; end: string; status?: string; index?: number }>;
  plannedAt?: string; // Legacy: single time slot
  interviewType?: 'vor_ort' | 'online';
  locationAddress?: string;
  jobTitle?: string;
  companyMessage?: string;
  onComplete?: () => void;
}

export function InterviewRequestResponse({
  open,
  onOpenChange,
  interviewRequestId,
  timeSlots,
  plannedAt,
  interviewType,
  locationAddress,
  jobTitle,
  companyMessage,
  onComplete
}: InterviewRequestResponseProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [proposedTime, setProposedTime] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine available slots
  const availableSlots = timeSlots && timeSlots.length > 0
    ? timeSlots.filter(slot => !slot.status || slot.status === 'pending')
    : plannedAt
    ? [{ start: plannedAt, end: new Date(new Date(plannedAt).getTime() + 60 * 60 * 1000).toISOString(), index: 0 }]
    : [];

  const hasMultipleSlots = availableSlots.length > 1;

  const handleAccept = async () => {
    if (hasMultipleSlots && selectedSlotIndex === null) {
      toast.error('Bitte wählen Sie einen Termin aus.');
      return;
    }

    setLoading(true);
    try {
      await acceptInterviewRequest({
        requestId: interviewRequestId,
        selectedSlotIndex: selectedSlotIndex ?? 0,
      });

      toast.success('Interview-Anfrage angenommen. Sie erhalten in Kürze eine E-Mail mit dem Meeting-Link.');
      onComplete?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error accepting interview:', error);
      toast.error(error.message || 'Interview-Anfrage konnte nicht angenommen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await declineInterviewRequest({
        requestId: interviewRequestId,
      });

      toast.success('Interview-Anfrage abgelehnt.');
      onComplete?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error declining interview:', error);
      toast.error('Interview-Anfrage konnte nicht abgelehnt werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleProposeAlternative = async () => {
    if (!proposedTime) {
      toast.error('Bitte wählen Sie einen alternativen Termin aus.');
      return;
    }

    setLoading(true);
    try {
      await createTimeSlotProposal({
        interviewRequestId,
        proposedAt: new Date(proposedTime).toISOString(),
        candidateMessage: proposalMessage.trim() || undefined,
      });

      toast.success('Alternativer Termin wurde vorgeschlagen.');
      onComplete?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error proposing alternative time:', error);
      toast.error('Alternativer Termin konnte nicht vorgeschlagen werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Interview-Anfrage</DialogTitle>
            <DialogDescription>
              {jobTitle 
                ? `Einladung zum Interview für "${jobTitle}"`
                : 'Einladung zum Interview'}
            </DialogDescription>
          </DialogHeader>

          {companyMessage && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Nachricht vom Unternehmen:</p>
              <p className="text-muted-foreground">{companyMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            {hasMultipleSlots ? (
              <>
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Bitte wählen Sie einen der folgenden Termine:
                  </Label>
                  <RadioGroup
                    value={selectedSlotIndex?.toString() ?? ''}
                    onValueChange={(value) => setSelectedSlotIndex(parseInt(value))}
                    className="space-y-3"
                  >
                    {availableSlots.map((slot, index) => {
                      const slotIndex = slot.index ?? index;
                      const startDate = new Date(slot.start);
                      const endDate = new Date(slot.end);
                      
                      return (
                        <div
                          key={slotIndex}
                          className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <RadioGroupItem value={slotIndex.toString()} id={`slot-${slotIndex}`} className="mt-1" />
                          <Label htmlFor={`slot-${slotIndex}`} className="cursor-pointer flex-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(startDate, "EEEE, dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Dauer: {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} Minuten
                            </div>
                            {interviewType === 'vor_ort' && locationAddress && (
                              <div className="text-xs text-muted-foreground mt-1">
                                📍 {locationAddress}
                              </div>
                            )}
                            {interviewType === 'online' && (
                              <div className="text-xs text-muted-foreground mt-1">
                                💻 Online (Video-Interview)
                              </div>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              </>
            ) : availableSlots.length === 1 ? (
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(availableSlots[0].start), "EEEE, dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                  </span>
                </div>
                {interviewType === 'vor_ort' && locationAddress && (
                  <div className="text-sm text-muted-foreground mb-2">
                    📍 {locationAddress}
                  </div>
                )}
                {interviewType === 'online' && (
                  <div className="text-sm text-muted-foreground">
                    💻 Online (Video-Interview)
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Termine verfügbar.</p>
            )}
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowProposal(true)}
              disabled={loading}
            >
              Alternativer Termin
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={loading}
            >
              Ablehnen
            </Button>
            <Button
              onClick={handleAccept}
              disabled={loading || (hasMultipleSlots && selectedSlotIndex === null)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  {hasMultipleSlots ? 'Termin annehmen' : 'Annehmen'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proposal Dialog */}
      <Dialog open={showProposal} onOpenChange={setShowProposal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alternativen Termin vorschlagen</DialogTitle>
            <DialogDescription>
              Schlagen Sie einen alternativen Termin vor, falls keiner der vorgeschlagenen passt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proposed_time">Gewünschter Termin *</Label>
              <Input
                id="proposed_time"
                type="datetime-local"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal_message">Nachricht (optional)</Label>
              <Textarea
                id="proposal_message"
                rows={3}
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
                placeholder="Warum passt dieser Termin besser?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposal(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleProposeAlternative}
              disabled={loading || !proposedTime}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                'Vorschlagen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

