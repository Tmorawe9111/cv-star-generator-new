import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Loader2, Plus, X, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createInterviewRequest } from '@/lib/api/interview-requests';
import { createCalendarEvent, CalendarProvider } from '@/lib/calendar-integration';
import { useCompany } from '@/hooks/useCompany';

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
  const { company } = useCompany();
  const [timeSlots, setTimeSlots] = useState<Array<{ start: string; end: string; duration: number }>>([
    { start: '', end: '', duration: 60 }
  ]);
  const [interviewType, setInterviewType] = useState<'vor_ort' | 'online'>('online');
  const [locationAddress, setLocationAddress] = useState('');
  const [companyMessage, setCompanyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyCandidateId, setCompanyCandidateId] = useState<string | null>(providedCompanyCandidateId || null);
  const [calendarIntegration, setCalendarIntegration] = useState<{ provider: CalendarProvider; access_token: string } | null>(null);

  useEffect(() => {
    // If provided, use it directly
    if (providedCompanyCandidateId) {
      setCompanyCandidateId(providedCompanyCandidateId);
    }
    
    // Otherwise, load it from application
    if (open && applicationId && !providedCompanyCandidateId) {
      loadCompanyCandidateId();
    }
    
    // Load calendar integration when modal opens
    if (open && companyId) {
      loadCalendarIntegration();
    }
  }, [open, applicationId, providedCompanyCandidateId, companyId]);

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

  const loadCalendarIntegration = async () => {
    try {
      if (!companyId) return;

      // Load active calendar integration for this company
      const { data: integrations, error } = await supabase
        .from('company_calendar_integrations')
        .select('provider, access_token')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading calendar integration:', error);
        return;
      }

      if (integrations && integrations.access_token) {
        setCalendarIntegration({
          provider: integrations.provider as CalendarProvider,
          access_token: integrations.access_token,
        });
      }
    } catch (error) {
      console.error('Error in loadCalendarIntegration:', error);
    }
  };

  const addTimeSlot = () => {
    if (timeSlots.length >= 3) {
      toast({
        title: 'Hinweis',
        description: 'Sie können maximal 3 Termine vorschlagen.',
        variant: 'default'
      });
      return;
    }
    setTimeSlots([...timeSlots, { start: '', end: '', duration: 60 }]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length <= 1) {
      toast({
        title: 'Hinweis',
        description: 'Mindestens ein Termin ist erforderlich.',
        variant: 'default'
      });
      return;
    }
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end' | 'duration', value: string | number) => {
    const updated = [...timeSlots];
    const slot = updated[index];
    
    if (field === 'duration') {
      const duration = typeof value === 'number' ? value : parseInt(value as string);
      updated[index] = { ...slot, duration };
      
      // Recalculate end time if start is set
      if (slot.start) {
        const startDate = new Date(slot.start);
        const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
        updated[index].end = endDate.toISOString().slice(0, 16);
      }
    } else if (field === 'start') {
      updated[index] = { ...slot, start: value as string };
      
      // Auto-set end time based on duration
      if (value) {
        const startDate = new Date(value as string);
        const endDate = new Date(startDate.getTime() + slot.duration * 60 * 1000);
        updated[index].end = endDate.toISOString().slice(0, 16);
      }
    } else {
      updated[index] = { ...slot, [field]: value as string };
    }
    
    setTimeSlots(updated);
  };
  
  const updateTimeSlotDuration = (index: number, duration: number) => {
    const slot = timeSlots[index];
    if (!slot.start) {
      // If no start time, just update duration
      const updated = [...timeSlots];
      updated[index] = { ...slot, duration };
      setTimeSlots(updated);
      return;
    }
    
    // Recalculate end time based on new duration
    const startDate = new Date(slot.start);
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
    
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endHour = String(endDate.getHours()).padStart(2, '0');
    const endMinute = String(endDate.getMinutes()).padStart(2, '0');
    const newEnd = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}`;
    
    const updated = [...timeSlots];
    updated[index] = { ...slot, duration, end: newEnd };
    setTimeSlots(updated);
  };

  const handleSchedule = async () => {
    // Validate time slots
    const validSlots = timeSlots.filter(slot => slot.start && slot.end);
    
    if (validSlots.length === 0) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie mindestens einen Termin aus.',
        variant: 'destructive'
      });
      return;
    }

    if (!companyCandidateId) {
      toast({
        title: 'Fehler',
        description: 'Kandidat-ID nicht gefunden.',
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
      // Format time slots for API - convert local datetime to ISO strings
      const formattedSlots = validSlots.map(slot => {
        // Convert "2024-01-01T10:00" format to ISO string
        // If the string doesn't have timezone info, treat it as local time
        let startDate: Date;
        let endDate: Date;
        
        if (slot.start.includes('T') && !slot.start.includes('Z') && !slot.start.includes('+')) {
          // Local datetime format: "2024-01-01T10:00"
          startDate = new Date(slot.start);
        } else {
          startDate = new Date(slot.start);
        }
        
        if (slot.end.includes('T') && !slot.end.includes('Z') && !slot.end.includes('+')) {
          endDate = new Date(slot.end);
        } else {
          endDate = new Date(slot.end);
        }
        
        return {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
      });

      console.log('Formatted slots for API:', formattedSlots);

      // Create calendar events and generate video links if integration is available
      const slotsWithCalendarEvents = await Promise.all(
        formattedSlots.map(async (slot) => {
          let videoLink: string | undefined;
          let calendarEventId: string | undefined;
          let calendarProvider: CalendarProvider = 'manual';

          if (interviewType === 'online' && calendarIntegration) {
            try {
              const calendarResult = await createCalendarEvent(
                calendarIntegration.provider,
                {
                  title: `Interview mit ${candidateName}`,
                  description: companyMessage.trim() || `Interview-Termin mit ${candidateName}`,
                  start: new Date(slot.start),
                  end: new Date(slot.end),
                  location: interviewType === 'vor_ort' ? locationAddress : undefined,
                },
                calendarIntegration.access_token
              );

              if (calendarResult) {
                calendarEventId = calendarResult.eventId;
                videoLink = calendarResult.videoLink;
                calendarProvider = calendarIntegration.provider;
              }
            } catch (error) {
              console.error('Error creating calendar event:', error);
              // Continue without calendar event
            }
          } else if (interviewType === 'online' && !calendarIntegration) {
            // Generate manual video link based on preference
            // For now, use Google Meet as default
            videoLink = 'https://meet.google.com/new';
          }

          return {
            ...slot,
            videoLink,
            calendarEventId,
            calendarProvider,
          };
        })
      );

      await createInterviewRequest({
        companyCandidateId,
        interviewType,
        timeSlots: slotsWithCalendarEvents.map(slot => ({
          start: slot.start,
          end: slot.end,
        })),
        locationAddress: interviewType === 'vor_ort' ? locationAddress : undefined,
        companyMessage: companyMessage.trim() || undefined,
        videoLink: slotsWithCalendarEvents[0]?.videoLink,
        calendarProvider: slotsWithCalendarEvents[0]?.calendarProvider || 'manual'
      });

      toast({
        title: 'Erfolgreich',
        description: `Interview-Anfrage mit ${validSlots.length} Termin${validSlots.length > 1 ? 'en' : ''} wurde an den Kandidaten gesendet.`,
      });

      onComplete?.();
      onOpenChange(false);
      
      // Reset form
      setTimeSlots([{ start: '', end: '', duration: 60 }]);
      setInterviewType('online');
      setLocationAddress('');
      setCompanyMessage('');
    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      toast({
        title: 'Fehler',
        description: error.message || error.details || 'Interview-Anfrage konnte nicht gesendet werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Interview planen</DialogTitle>
          <DialogDescription>
            {candidateName 
              ? `Bitte wähle Datum, Uhrzeit und Art des Gesprächs mit ${candidateName}.`
              : 'Bitte wähle Datum, Uhrzeit und Art des Gesprächs.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Termine vorschlagen (1-3) *
              </Label>
              {timeSlots.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeSlot}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Termin hinzufügen
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Der Kandidat kann einen der vorgeschlagenen Termine wählen oder einen alternativen Termin vorschlagen.
            </p>
            
            <div className="space-y-3">
              {timeSlots.map((slot, index) => (
                <div key={index} className="flex items-start gap-2 p-4 border rounded-lg bg-slate-50/50">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 min-w-[70px]">
                        Termin {index + 1}:
                      </span>
                    </div>
                    
                    <div className="space-y-3 ml-[70px]">
                      {/* Combined Date & Time Input */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Datum und Uhrzeit *</Label>
                        <Input
                          type="datetime-local"
                          value={slot.start ? slot.start.slice(0, 16) : ''}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            if (newStart) {
                              const startDate = new Date(newStart);
                              const endDate = new Date(startDate.getTime() + slot.duration * 60 * 1000);
                              const year = endDate.getFullYear();
                              const month = String(endDate.getMonth() + 1).padStart(2, '0');
                              const day = String(endDate.getDate()).padStart(2, '0');
                              const hour = String(endDate.getHours()).padStart(2, '0');
                              const minute = String(endDate.getMinutes()).padStart(2, '0');
                              const newEnd = `${year}-${month}-${day}T${hour}:${minute}`;
                              
                              const updated = [...timeSlots];
                              updated[index] = { ...slot, start: newStart, end: newEnd };
                              setTimeSlots(updated);
                            }
                          }}
                          min={new Date().toISOString().slice(0, 16)}
                          step="900"
                          className="h-9"
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                          Wählen Sie Datum und Uhrzeit für diesen Termin
                        </p>
                      </div>
                      
                      {/* Duration - Radio Buttons */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Dauer *</Label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`duration-${index}`}
                              value="30"
                              checked={slot.duration === 30}
                              onChange={(e) => {
                                const duration = parseInt(e.target.value);
                                updateTimeSlotDuration(index, duration);
                              }}
                              disabled={loading}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">30 Minuten</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`duration-${index}`}
                              value="60"
                              checked={slot.duration === 60}
                              onChange={(e) => {
                                const duration = parseInt(e.target.value);
                                updateTimeSlotDuration(index, duration);
                              }}
                              disabled={loading}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">60 Minuten</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {slot.start && slot.end && (
                      <div className="text-xs text-muted-foreground ml-[70px] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(slot.start).toLocaleDateString('de-DE', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} ({slot.duration} Min.)
                      </div>
                    )}
                  </div>
                  {timeSlots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(index)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
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

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Später
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={loading || timeSlots.every(s => !s.start) || (interviewType === 'vor_ort' && !locationAddress.trim()) || !companyCandidateId}
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

