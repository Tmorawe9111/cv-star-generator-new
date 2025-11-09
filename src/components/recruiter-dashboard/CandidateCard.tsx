import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export interface CandidateCardData {
  id: string;
  candidateId: string;
  jobCandidateId?: string | null;
  name: string;
  city?: string | null;
  origin?: string | null;
  completeness?: number | null;
  headline?: string | null;
  seeking?: string | null;
  plannedAt?: string | null;
  jobTitle?: string | null;
}

export type PlanAction = {
  type: "plan";
  label: string;
  loading?: boolean;
  onConfirm: (plannedAt: string) => Promise<void> | void;
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
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeValue, setCompleteValue] = useState("");

  const completion = Math.min(Math.max(data.completeness ?? 0, 0), 100);
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

  const renderPrimaryButton = () => {
    if (!primaryAction) return null;
    return (
      <Button className="w-full" onClick={handlePrimaryClick} disabled={primaryAction.loading}>
        {primaryAction.label}
      </Button>
    );
  };

  return (
    <>
      <Card className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{data.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {data.city ? `${data.city} · ` : ""}
                  {data.jobTitle ?? data.headline ?? "Profil"}
                </p>
              </div>
              {badge && (
                <Badge
                  variant="outline"
                  className={cn(
                    "border-none px-3 py-1 text-xs font-semibold",
                    badge.tone === "accent" ? "bg-cyan-100 text-cyan-700" : "bg-blue-100 text-blue-700",
                  )}
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            {data.seeking && (
              <p className="mt-3 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Sucht:</span> {data.seeking}
              </p>
            )}
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Profilvollständigkeit</span>
                <span className="font-semibold">{completion}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400" style={{ width: `${completion}%` }} />
              </div>
            </div>
            {data.plannedAt && (
              <p className="mt-3 text-sm text-slate-600">
                Geplant am: <span className="font-medium text-slate-800">{formatDate(data.plannedAt)}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {renderPrimaryButton()}
          <div className="flex gap-2">
            {secondaryAction && (
              <Button
                className="w-full"
                variant={secondaryAction.variant ?? "outline"}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.loading}
              >
                {secondaryAction.label}
              </Button>
            )}
            {rejectAction && (
              <Button
                className="w-full"
                variant={rejectAction.variant ?? "outline"}
                onClick={rejectAction.onClick}
                disabled={rejectAction.loading}
              >
                {rejectAction.label}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onViewProfile?.(data.candidateId)}
            >
              Profil ansehen
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onDownloadCv?.(data.candidateId)}
            >
              CV Download
            </Button>
          </div>
        </div>
      </Card>

      {primaryAction?.type === "plan" && (
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Interview planen</DialogTitle>
              <DialogDescription>
                Bitte wähle Datum und Uhrzeit für das Gespräch mit {data.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700" htmlFor="planned_at">
                Termin (Datum & Uhrzeit)
              </label>
              <Input
                id="planned_at"
                type="datetime-local"
                value={scheduleValue}
                onChange={event => setScheduleValue(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setScheduleDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (!scheduleValue) return;
                  primaryAction.onConfirm(new Date(scheduleValue).toISOString());
                  setScheduleDialogOpen(false);
                  setScheduleValue("");
                }}
                disabled={!scheduleValue || primaryAction.loading}
              >
                Speichern
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
