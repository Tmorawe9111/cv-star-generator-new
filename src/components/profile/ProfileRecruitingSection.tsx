import { Button } from "@/components/ui/button";
import { ProfileRecruitingAccordion } from "./ProfileRecruitingAccordion";
import { STATUS_LABELS } from "@/hooks/useProfileView";
import type { UseProfileViewResult } from "@/hooks/useProfileView";
import type { UseProfileNotesResult } from "@/hooks/useProfileNotes";
import type { UseProfileJobAssignmentResult } from "@/hooks/useProfileJobAssignment";
import type { ActionOption } from "@/hooks/useProfileActions";

export interface ProfileRecruitingSectionProps {
  view: UseProfileViewResult;
  notes: UseProfileNotesResult;
  jobs: UseProfileJobAssignmentResult;
  availableActions: ActionOption[];
  onRunAction: (action: ActionOption) => Promise<void>;
  isActionDisabled: (action: ActionOption) => boolean;
  onHistorieNavigate: () => void;
}

export function ProfileRecruitingSection({
  view,
  notes,
  jobs,
  availableActions,
  onRunAction,
  isActionDisabled,
  onHistorieNavigate,
}: ProfileRecruitingSectionProps) {
  const renderActionButtons = (placement: "main" | "notes") => {
    if (availableActions.length === 0) {
      return placement === "main" ? (
        <p className="mt-3 text-sm text-muted-foreground">Keine weiteren Aktionen notwendig.</p>
      ) : null;
    }
    return (
      <div className={`${placement === "main" ? "mt-4" : "mt-2"} flex flex-wrap gap-2`}>
        {availableActions.map((action) => (
          <Button
            key={`${placement}-${action.key}`}
            size="sm"
            variant={
              action.variant === "destructive"
                ? "destructive"
                : action.variant === "primary"
                  ? "default"
                  : "outline"
            }
            onClick={() => onRunAction(action)}
            disabled={isActionDisabled(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <ProfileRecruitingAccordion
      metaAccordionValue={view.metaAccordionValue}
      onMetaAccordionValueChange={view.setMetaAccordionValue}
      currentStageLabel={view.currentStageLabel}
      formattedUnlockDate={view.formattedUnlockDate}
      summaryJobsCount={jobs.jobBadgeData.length}
      summaryNotesCount={notes.notesList.length}
      stageBarProps={{
        currentStageLabel: view.currentStageLabel,
        candidateStatus: view.candidateStatus,
        isOnHold: view.isOnHold,
        resumeStatusLabel: STATUS_LABELS[view.resumeStatus],
        origin: view.candidateMeta?.origin,
        interviewDate: view.candidateMeta?.interview_date,
        formattedUnlockDate: view.formattedUnlockDate,
        statusUpdating: view.statusUpdating,
        plannedAt: view.plannedAt,
        completedAt: view.completedAt,
        showInterviewModal: view.showInterviewModal,
        candidateMetaId: view.candidateMeta?.id ?? null,
        onToggleHold: view.handleToggleHold,
        onPlannedAtChange: view.setPlannedAt,
        onCompletedAtChange: view.setCompletedAt,
        onShowInterviewModal: view.setShowInterviewModal,
        onHistorieClick: onHistorieNavigate,
        renderActionButtons,
      }}
      jobAssignmentProps={{
        jobOptions: jobs.jobOptions,
        selectedJobIds: jobs.selectedJobIds,
        jobBadgeData: jobs.jobBadgeData,
        jobsLoading: jobs.jobsLoading,
        updatingJobs: jobs.updatingJobs,
        onJobAssignmentChange: jobs.handleJobAssignmentChange,
      }}
      notesProps={{
        notesList: notes.notesList,
        newNote: notes.newNote,
        addingNote: notes.addingNote,
        formatNoteDate: notes.formatNoteDate,
        onNewNoteChange: notes.setNewNote,
        onAddNote: notes.handleAddNote,
        renderActionButtons,
      }}
    />
  );
}
