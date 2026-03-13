import { useMemo } from "react";
import { toast } from "sonner";
import { STATUS_LABELS } from "./useProfileView";
import type { CandidateStatus } from "@/lib/api/candidates";

export interface ActionOption {
  key: string;
  label: string;
  status: CandidateStatus;
  requiresDate?: "planned" | "completed";
  variant?: "primary" | "outline" | "destructive";
}

export interface UseProfileActionsOptions {
  candidateStatus: CandidateStatus;
  resumeStatus: CandidateStatus;
  statusUpdating: boolean;
  plannedAt: string;
  completedAt: string;
  onStatusChange: (
    nextStatus: CandidateStatus,
    meta?: Record<string, unknown>,
    options?: { silent?: boolean }
  ) => Promise<void>;
}

export function useProfileActions({
  candidateStatus,
  resumeStatus,
  statusUpdating,
  plannedAt,
  completedAt,
  onStatusChange,
}: UseProfileActionsOptions) {
  const availableActions = useMemo<ActionOption[]>(() => {
    const s = candidateStatus;
    const r = resumeStatus;
    switch (s) {
      case "FREIGESCHALTET":
        return [
          { key: "reject", label: "Unpassend", status: "ABGELEHNT" as CandidateStatus, variant: "destructive" as const },
        ];
      case "INTERVIEW_GEPLANT":
        return [
          {
            key: "conducted",
            label: "Interview hat stattgefunden",
            status: "INTERVIEW_DURCHGEFÜHRT" as CandidateStatus,
            requiresDate: "completed" as const,
            variant: "primary" as const,
          },
          { key: "cancel", label: "Absagen", status: "ABGESAGT" as CandidateStatus, variant: "destructive" as const },
        ];
      case "INTERVIEW_DURCHGEFÜHRT":
        return [
          { key: "offer", label: "Angebot senden", status: "ANGEBOT_GESENDET" as CandidateStatus, variant: "primary" as const },
          { key: "decline", label: "Unpassend", status: "ABGELEHNT" as CandidateStatus, variant: "destructive" as const },
        ];
      case "ANGEBOT_GESENDET":
        return [
          { key: "hire", label: "Eingestellt", status: "EINGESTELLT" as CandidateStatus, variant: "primary" as const },
          { key: "reject", label: "Abgelehnt", status: "ABGELEHNT" as CandidateStatus, variant: "destructive" as const },
        ];
      case "ON_HOLD":
        return [
          { key: "resume", label: `Fortsetzen (${STATUS_LABELS[r]})`, status: r, variant: "primary" as const },
          { key: "reject", label: "Unpassend", status: "ABGELEHNT" as CandidateStatus, variant: "destructive" as const },
        ];
      default:
        return [];
    }
  }, [candidateStatus, resumeStatus]);

  const runAction = async (action: ActionOption) => {
    if (statusUpdating) return;
    if (action.requiresDate === "planned") {
      if (!plannedAt) {
        toast.error("Bitte Interviewtermin auswählen.");
        return;
      }
      await onStatusChange(action.status, { planned_at: new Date(plannedAt).toISOString() });
      return;
    }
    if (action.requiresDate === "completed") {
      const v = completedAt || plannedAt;
      if (!v) {
        toast.error("Bitte Datum und Uhrzeit des Interviews angeben.");
        return;
      }
      await onStatusChange(action.status, { interview_date: new Date(v).toISOString() });
      return;
    }
    await onStatusChange(action.status);
  };

  const isActionDisabled = (action: ActionOption) => {
    if (statusUpdating) return true;
    if (action.requiresDate === "planned") return !plannedAt;
    if (action.requiresDate === "completed") return !(completedAt || plannedAt);
    return false;
  };

  return { availableActions, runAction, isActionDisabled };
}
