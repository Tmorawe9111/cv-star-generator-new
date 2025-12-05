import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createInterviewRequest } from '@/lib/api/interview-requests';

interface ScheduleInterviewAfterQuestionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  jobId: string;
  companyId: string;
  candidateName?: string;
  onComplete?: () => void;
  companyCandidateId?: string; // Optional: if provided, skip loading
}

export function ScheduleInterviewAfterQuestions({
  open,
  onOpenChange,
  applicationId,
  jobId,
  companyId,
  candidateName,
  onComplete,
  companyCandidateId: providedCompanyCandidateId
}: ScheduleInterviewAfterQuestionsProps) {
  const [scheduleValue, setScheduleValue] = useState('');
  const [interviewType, setInterviewType] = useState<'vor_ort' | 'online'>('online');
  const [locationAddress, setLocationAddress] = useState('');
  const [companyMessage, setCompanyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyCandidateId, setCompanyCandidateId] = useState<string | null>(providedCompanyCandidateId || null);

  useEffect(() => {
    // If provided, use it directly
    if (providedCompanyCandidateId) {
      setCompanyCandidateId(providedCompanyCandidateId);
      return;
    }
    
    // Otherwise, load it from application
    if (open && applicationId) {
      loadCompanyCandidateId();
    }
  }, [open, applicationId, providedCompanyCandidateId]);

  const loadCompanyCandidateId = async () => {
    try {
      // Get candidate_id from application
      const { data: application, error } = await supabase
        .from('applications')
        .select('candidate_id')
        .eq('id', applicationId)
        .single();

      if (error || !application) {
        console.error('Error loading application:', error);
        return;
      }

      // Find company_candidate_id
      const { data: companyCandidate, error: ccError } = await supabase
        .from('company_candidates')
        .select('id')
        .eq('company_id', companyId)
        .eq('candidate_id', application.candidate_id)
        .maybeSingle();

      if (ccError) {
        console.error('Error loading company candidate:', ccError);
        return;
      }

      if (companyCandidate) {
        setCompanyCandidateId(companyCandidate.id);
      }
    } catch (error) {
      console.error('Error in loadCompanyCandidateId:', error);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleValue || !companyCandidateId) {
      toast({
        title: 'Fehler',
        description: 'Bitte fülle alle Pflichtfelder aus.',
        variant: 'destructive'
      });
      return;
    }

    if (interviewType === 'vor_ort' && !locationAddress.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib eine Adresse für das Vor-Ort-Interview an.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await createInterviewRequest({
        companyCandidateId,
        interviewType,
        plannedAt: new Date(scheduleValue).toISOString(),
        locationAddress: interviewType === 'vor_ort' ? locationAddress : undefined,
        companyMessage: companyMessage.trim() || undefined
      });

      toast({
        title: 'Erfolgreich',
        description: 'Interview-Anfrage wurde an den Kandidaten gesendet.',
      });

      onComplete?.();
      onOpenChange(false);
      
      // Reset form
      setScheduleValue('');
      setInterviewType('online');
      setLocationAddress('');
      setCompanyMessage('');
    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Interview-Anfrage konnte nicht gesendet werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Interview planen</DialogTitle>
          <DialogDescription>
            {candidateName 
              ? `Bitte wähle Datum, Uhrzeit und Art des Gesprächs mit ${candidateName}.`
              : 'Bitte wähle Datum, Uhrzeit und Art des Gesprächs.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planned_at" className="text-sm font-medium">
              Termin (Datum & Uhrzeit) *
            </Label>
            <Input
              id="planned_at"
              type="datetime-local"
              value={scheduleValue}
              onChange={(e) => setScheduleValue(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Art des Interviews *
            </Label>
            <RadioGroup 
              value={interviewType} 
              onValueChange={(value) => setInterviewType(value as 'vor_ort' | 'online')}
              className="space-y-3"
            >
              <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="online" id="online" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="online" className="cursor-pointer font-medium">
                    Online
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Video-Interview (Google Meet, Zoom, Teams)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="vor_ort" id="vor_ort" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="vor_ort" className="cursor-pointer font-medium">
                    Vor Ort
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Persönliches Treffen im Unternehmen
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {interviewType === 'vor_ort' && (
            <div className="space-y-2">
              <Label htmlFor="location_address" className="text-sm font-medium">
                Adresse *
              </Label>
              <Textarea
                id="location_address"
                rows={2}
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Straße, Hausnummer, PLZ, Stadt"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="company_message" className="text-sm font-medium">
              Nachricht (optional)
            </Label>
            <Textarea
              id="company_message"
              rows={3}
              value={companyMessage}
              onChange={(e) => setCompanyMessage(e.target.value)}
              placeholder="Optionale Nachricht an den Kandidaten..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Später
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={loading || !scheduleValue || (interviewType === 'vor_ort' && !locationAddress.trim()) || !companyCandidateId}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Interview-Anfrage senden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

