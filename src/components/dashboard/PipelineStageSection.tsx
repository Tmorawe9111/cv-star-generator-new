import { StageSection } from "./StageSection";
import { CandidateList } from "@/components/recruiter-dashboard/CandidateList";
import type { CandidateListItem } from "@/components/recruiter-dashboard/CandidateList";
import type { DashboardTab } from "@/types/dashboard";
import type { ListState } from "@/types/dashboard";
import type { PipelineCounts } from "@/types/dashboard";

export interface PipelineStageSectionProps {
  stage: DashboardTab;
  listState: ListState<CandidateListItem>;
  pipeline: PipelineCounts;
  pipelineLoading: boolean;
  pendingActionId: string | null;
  loadDashboardSnapshot: () => Promise<void>;
  onUnlockCandidate: (c: CandidateListItem) => void;
  onAssignApplication: (c: CandidateListItem) => void;
  onRejectCandidate: (c: CandidateListItem) => void;
  onCancelCandidate: (c: CandidateListItem) => void;
  onViewProfile: (id: string) => void;
  onViewAll: (s?: DashboardTab) => void;
  onDownloadCv: (id: string) => void;
}

const STAGE_CONFIG: Record<
  DashboardTab,
  { title: string; subtitle: string; countKey: keyof PipelineCounts }
> = {
  new: {
    title: "Neue Bewerbungen",
    subtitle: "Frisch eingetroffen und noch unbearbeitet",
    countKey: "new_apps",
  },
  unlocked: {
    title: "Freigeschaltet · Termin planen",
    subtitle: "Profile mit Zugriff – jetzt Interviews terminieren",
    countKey: "unlocked_and_plan",
  },
  planned: {
    title: "Geplante Interviews",
    subtitle: "Termine stehen – Nachbereitung im Blick behalten",
    countKey: "interviews_planned",
  },
};

export function PipelineStageSection({
  stage,
  listState,
  pipeline,
  pipelineLoading,
  pendingActionId,
  loadDashboardSnapshot,
  onUnlockCandidate,
  onAssignApplication,
  onRejectCandidate,
  onCancelCandidate,
  onViewProfile,
  onViewAll,
  onDownloadCv,
}: PipelineStageSectionProps) {
  const config = STAGE_CONFIG[stage];
  const count = pipeline[config.countKey];

  const primaryActionFactory = (candidate: CandidateListItem) => {
    if (stage === "new") {
      const isApplication = candidate.origin === "bewerbung" || candidate.applicationId;
      const isAlreadyUnlocked = candidate.isUnlocked;
      if (isApplication && isAlreadyUnlocked) {
        return {
          type: "instant" as const,
          label: "Annehmen",
          loading: pendingActionId === candidate.id,
          onConfirm: () => onAssignApplication(candidate),
          disabled: false,
        };
      }
      return {
        type: "instant" as const,
        label: candidate.isUnlocked ? "Bereits freigeschaltet" : "Freischalten (1 Token)",
        loading: pendingActionId === candidate.id,
        onConfirm: () => onUnlockCandidate(candidate),
        disabled: candidate.isUnlocked,
      };
    }
    return {
      type: "plan" as const,
      label: "Interview planen",
      loading: pendingActionId === candidate.id,
      onConfirm: async () => loadDashboardSnapshot(),
    };
  };

  const rejectActionFactory = (candidate: CandidateListItem) => ({
    label: candidate.origin === "bewerbung" || candidate.applicationId ? "Ablehnen" : "Unpassend",
    variant: "outline" as const,
    loading: pendingActionId === candidate.id,
    onClick: () => onRejectCandidate(candidate),
  });

  const secondaryActionFactory =
    stage !== "new"
      ? (candidate: CandidateListItem) => ({
          label: "Absagen",
          variant: "outline" as const,
          loading: pendingActionId === candidate.id,
          onClick: () => onCancelCandidate(candidate),
        })
      : undefined;

  return (
    <StageSection
      title={config.title}
      subtitle={config.subtitle}
      count={count}
      onViewAll={() => onViewAll(stage)}
    >
      <CandidateList
        items={listState.items}
        loading={pipelineLoading || listState.loading}
        variant={stage}
        primaryActionFactory={primaryActionFactory}
        secondaryActionFactory={secondaryActionFactory}
        rejectActionFactory={rejectActionFactory}
        onViewProfile={onViewProfile}
        onDownloadCv={onDownloadCv}
        hasMore={false}
      />
    </StageSection>
  );
}
