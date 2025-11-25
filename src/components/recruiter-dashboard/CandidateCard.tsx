import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, ExternalLink, User, Briefcase } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createInterviewEvent, openCalendarEvent, getUserCalendarPreference } from "@/lib/calendar-integration";

export interface CandidateCardData {
  id: string;
  candidateId: string;
  jobCandidateId?: string | null;
  applicationId?: string | null;
  jobId?: string | null;
  name: string;
  city?: string | null;
  origin?: string | null;
  completeness?: number | null;
  headline?: string | null;
  seeking?: string | null;
  plannedAt?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  isUnlocked?: boolean;
}

export type PlanAction = {
  type: "plan";
  label: string;
  loading?: boolean;
  onConfirm: (plannedAt: string, interviewType: "vor_ort" | "online", locationAddress?: string, companyMessage?: string) => Promise<void> | void;
};

export type CompleteAction = {
  type: "complete";
  label: string;
  loading?: boolean;
  onConfirm: (completedAt: string) => Promise<void> | void;
};

export type InstantAction = {
  type: "instant";
  label: string;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
};

export type PrimaryAction = PlanAction | CompleteAction | InstantAction;

export interface SecondaryAction {
  label: string;
  onClick: () => void;
  loading?: boolean;
  variant?: "ghost" | "destructive" | "outline";
}

interface CandidateCardProps {
  data: CandidateCardData;
  badge?: {
    label: string;
    tone: "accent" | "info";
  };
  primaryAction?: PrimaryAction;
  secondaryAction?: SecondaryAction;
  rejectAction?: SecondaryAction;
  onViewProfile?: (candidateId: string) => void;
  onDownloadCv?: (candidateId: string) => void;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  try {
    return format(new Date(value), "dd.MM.yyyy HH:mm", { locale: de });
  } catch (error) {
    return value;
  }
}

export function CandidateCard({
  data,
  badge,
  primaryAction,
  secondaryAction,
  rejectAction,
  onViewProfile,
  onDownloadCv,
}: CandidateCardProps) {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");
  const [interviewType, setInterviewType] = useState<"vor_ort" | "online">("online");
  const [locationAddress, setLocationAddress] = useState("");
  const [companyMessage, setCompanyMessage] = useState("");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeValue, setCompleteValue] = useState("");

  const isApplication = !!data.applicationId;
  const isUnlocked = data.isUnlocked ?? true; // Default to true for backwards compatibility
  
  const initials = data.name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handlePrimaryClick = () => {
    if (!primaryAction) return;
    if (primaryAction.type === "plan") {
      setScheduleDialogOpen(true);
      return;
    }
    if (primaryAction.type === "complete") {
      setCompleteDialogOpen(true);
      return;
    }
    primaryAction.onConfirm();
  };

  const handleAddToCalendar = (plannedAt: string | null | undefined, candidateName: string) => {
    if (!plannedAt) return;
    
    try {
      // Create calendar event using utility function
      const event = createInterviewEvent(candidateName, plannedAt, 60);
      
      // Get user's preferred calendar provider (defaults to Google)
      const provider = getUserCalendarPreference();
      
      // Open calendar event in user's preferred provider
      openCalendarEvent(event, provider);
      
      // Future: For automatic sync, use createCalendarEventViaAPI instead
      // await createCalendarEventViaAPI(event, provider);
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  };

  const renderPrimaryButton = () => {
    if (!primaryAction) return null;
    const isDisabled = primaryAction.loading || (primaryAction as any).disabled;
    return (
      <Button 
        size="sm" 
        className={cn(
          "w-full text-xs h-8",
          !isUnlocked && isApplication && "bg-blue-600 hover:bg-blue-700"
        )}
        onClick={handlePrimaryClick} 
        disabled={isDisabled}
      >
        {primaryAction.label}
      </Button>
    );
  };

  return (
    <>
      <Card className={cn(
        "flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm min-h-[280px]",
        isApplication && !isUnlocked && "border-orange-300 ring-2 ring-orange-200"
      )}>
        {/* Header Section */}
        <div className="flex items-start gap-3 mb-4">
          <div className={isApplication && !isUnlocked ? "rounded-full ring-2 ring-orange-400 ring-offset-2" : ""}>
            <Avatar className="h-14 w-14 flex-shrink-0">
              {isUnlocked ? (
                <>
                  <AvatarImage src={data.avatarUrl || undefined} />
                  <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
                  <User className="h-6 w-6 text-blue-600" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 truncate">{data.name}</h3>
                  {isApplication && !isUnlocked && data.jobTitle && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex h-2 w-2 rounded-full bg-orange-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          <p>
                            {data.name} hat sich beworben
                          </p>
                          {data.jobTitle && (
                            <p className="mt-1">
                              Stelle: {data.jobTitle}
                              {data.city ? ` · ${data.city}` : ""}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {data.city ? `${data.city} · ` : ""}
                  {data.jobTitle ?? data.headline ?? "Profil"}
                </p>
              </div>
              {badge && (
                <Badge
                  variant="outline"
                  className={cn(
                    "border-none px-2.5 py-1 text-xs font-semibold flex-shrink-0",
                    badge.tone === "accent" ? "bg-cyan-100 text-cyan-700" : "bg-blue-100 text-blue-700",
                  )}
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            {data.seeking && (
              <p className="text-sm text-slate-600 line-clamp-1 mt-1">
                <span className="font-medium text-slate-700">Sucht:</span> {data.seeking}
              </p>
            )}
          </div>
        </div>

        {/* Actions Section - Centered and optimized */}
        <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
          {/* Calendar Section - Only for planned interviews */}
          {data.plannedAt && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {formatDate(data.plannedAt)}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-xs flex-shrink-0"
                onClick={() => handleAddToCalendar(data.plannedAt, data.name)}
                title="Zu Kalender hinzufügen (Google Calendar, Outlook, Teams)"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Hinzufügen
              </Button>
            </div>
          )}
          {/* Primary Action - Full width if present */}
          {primaryAction && (
            <div className="w-full">
              {renderPrimaryButton()}
            </div>
          )}
          
          {/* Secondary Actions - Full width 50/50 split */}
          <div className="grid grid-cols-2 gap-2">
            {secondaryAction && data.applicationId ? (
              <Button
                size="sm"
                variant={secondaryAction.variant ?? "outline"}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.loading}
                className="text-xs h-8"
              >
                {secondaryAction.label}
              </Button>
            ) : rejectAction && !data.applicationId ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={rejectAction.onClick}
                disabled={rejectAction.loading}
                className="text-xs h-8"
              >
                {rejectAction.label}
              </Button>
            ) : (
              <div />
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onViewProfile?.(data.candidateId)}
              className="text-xs h-8"
            >
              Profil ansehen
            </Button>
          </div>
        </div>
      </Card>

      {primaryAction?.type === "plan" && (
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Interview planen</DialogTitle>
              <DialogDescription>
                Bitte wähle Datum, Uhrzeit und Art des Gesprächs mit {data.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planned_at" className="text-sm font-medium text-slate-700">
                  Termin (Datum & Uhrzeit) *
                </Label>
                <Input
                  id="planned_at"
                  type="datetime-local"
                  value={scheduleValue}
                  onChange={event => setScheduleValue(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Art des Interviews *
                </Label>
                <RadioGroup 
                  value={interviewType} 
                  onValueChange={(value) => setInterviewType(value as "vor_ort" | "online")}
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

              {interviewType === "vor_ort" && (
                <div className="space-y-2">
                  <Label htmlFor="location_address" className="text-sm font-medium text-slate-700">
                    Adresse *
                  </Label>
                  <Textarea
                    id="location_address"
                    rows={2}
                    value={locationAddress}
                    onChange={event => setLocationAddress(event.target.value)}
                    placeholder="Straße, Hausnummer, PLZ, Stadt"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="company_message" className="text-sm font-medium text-slate-700">
                  Nachricht (optional)
                </Label>
                <Textarea
                  id="company_message"
                  rows={3}
                  value={companyMessage}
                  onChange={event => setCompanyMessage(event.target.value)}
                  placeholder="Optionale Nachricht an den Kandidaten..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => {
                setScheduleDialogOpen(false);
                setScheduleValue("");
                setInterviewType("online");
                setLocationAddress("");
                setCompanyMessage("");
              }}>
                Abbrechen
              </Button>
              <Button
                onClick={async () => {
                  if (!scheduleValue) return;
                  if (interviewType === "vor_ort" && !locationAddress.trim()) {
                    return;
                  }
                  await primaryAction.onConfirm(
                    new Date(scheduleValue).toISOString(),
                    interviewType,
                    interviewType === "vor_ort" ? locationAddress : undefined,
                    companyMessage.trim() || undefined
                  );
                  setScheduleDialogOpen(false);
                  setScheduleValue("");
                  setInterviewType("online");
                  setLocationAddress("");
                  setCompanyMessage("");
                }}
                disabled={!scheduleValue || primaryAction.loading || (interviewType === "vor_ort" && !locationAddress.trim())}
              >
                {primaryAction.loading ? "Wird gesendet..." : "Anfrage senden"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {primaryAction?.type === "complete" && (
        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Interview dokumentieren</DialogTitle>
              <DialogDescription>
                Wann wurde das Interview durchgeführt?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700" htmlFor="completed_at">
                Datum & Uhrzeit
              </label>
              <Input
                id="completed_at"
                type="datetime-local"
                value={completeValue}
                onChange={event => setCompleteValue(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCompleteDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (!completeValue) return;
                  primaryAction.onConfirm(new Date(completeValue).toISOString());
                  setCompleteDialogOpen(false);
                  setCompleteValue("");
                }}
                disabled={!completeValue || primaryAction.loading}
              >
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
