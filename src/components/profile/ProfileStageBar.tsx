import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { CandidateStatus } from "@/lib/api/candidates";

export interface ProfileStageBarProps {
  currentStageLabel: string;
  candidateStatus: CandidateStatus;
  isOnHold: boolean;
  resumeStatusLabel: string;
  origin?: string | null;
  interviewDate?: string | null;
  formattedUnlockDate: string | null;
  statusUpdating: boolean;
  plannedAt: string;
  completedAt: string;
  showInterviewModal: boolean;
  candidateMetaId: string | null;
  onToggleHold: () => Promise<void>;
  onPlannedAtChange: (value: string) => void;
  onCompletedAtChange: (value: string) => void;
  onShowInterviewModal: (show: boolean) => void;
  onHistorieClick: () => void;
  renderActionButtons: (placement: "main") => React.ReactNode;
}

export function ProfileStageBar({
  currentStageLabel,
  candidateStatus,
  isOnHold,
  resumeStatusLabel,
  origin,
  interviewDate,
  formattedUnlockDate,
  statusUpdating,
  plannedAt,
  completedAt,
  showInterviewModal,
  candidateMetaId,
  onToggleHold,
  onPlannedAtChange,
  onCompletedAtChange,
  onShowInterviewModal,
  onHistorieClick,
  renderActionButtons,
}: ProfileStageBarProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Aktueller Status</p>
        <p className="text-lg font-semibold text-foreground">{currentStageLabel}</p>
        {isOnHold && (
          <Badge variant="outline" className="text-xs">
            Vorher: {resumeStatusLabel}
          </Badge>
        )}
        {origin && (
          <p className="text-sm text-muted-foreground">
            Herkunft: {origin === "BEWERBER" ? "Bewerbung" : origin}
          </p>
        )}
        {interviewDate && (
          <p className="text-sm text-muted-foreground">
            Interviewtermin: {format(new Date(interviewDate), "dd.MM.yyyy HH:mm", { locale: de })}
          </p>
        )}
        {formattedUnlockDate && (
          <p className="text-xs text-muted-foreground">Freigeschaltet am {formattedUnlockDate}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant={isOnHold ? "secondary" : "outline"}
            onClick={onToggleHold}
            disabled={statusUpdating}
          >
            {isOnHold ? "On Hold aufheben" : "On Hold"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 lg:col-span-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Nächste Aktion</p>

        {candidateStatus === "FREIGESCHALTET" && (
          <div className="mt-3 space-y-2">
            <Label>Interviewtermin (optional)</Label>
            <Button type="button" variant="outline" className="w-full justify-start text-left font-normal"
              onClick={() => onShowInterviewModal(true)} disabled={statusUpdating || !candidateMetaId}>
              <Calendar className="mr-2 h-4 w-4" />
              {plannedAt ? format(new Date(plannedAt), "dd.MM.yyyy, HH:mm", { locale: de }) : "Interview planen"}
            </Button>
            <p className="text-xs text-muted-foreground">Termin kann später angepasst werden. Ohne Angabe wird nur der Status geändert.</p>
          </div>
        )}

        {candidateStatus === "INTERVIEW_GEPLANT" && (
          <div className="mt-3 space-y-2">
            <Label htmlFor="completed-at">Interviewdatum</Label>
            <Input id="completed-at" type="datetime-local" value={completedAt}
              onChange={(e) => onCompletedAtChange(e.target.value)} disabled={statusUpdating} />
            <p className="text-xs text-muted-foreground">Pflichtfeld: tatsächliches Datum des Interviews.</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {candidateStatus === "FREIGESCHALTET" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onShowInterviewModal(true)}
              disabled={statusUpdating || !candidateMetaId}
            >
              Interview planen
            </Button>
          )}
          {renderActionButtons("main")}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onHistorieClick}
            className="w-full justify-start"
          >
            <Clock className="h-4 w-4 mr-2" />
            Vollständige Historie anzeigen
          </Button>
        </div>
      </div>
    </div>
  );
}
