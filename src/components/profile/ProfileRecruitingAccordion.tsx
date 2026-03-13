import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProfileStageBar } from "./ProfileStageBar";
import { ProfileJobAssignment } from "./ProfileJobAssignment";
import { ProfileNotes } from "./ProfileNotes";
import type { ProfileStageBarProps } from "./ProfileStageBar";
import type { ProfileJobAssignmentProps } from "./ProfileJobAssignment";
import type { ProfileNotesProps } from "./ProfileNotes";

export interface ProfileRecruitingAccordionProps {
  metaAccordionValue: string | null;
  onMetaAccordionValueChange: (value: string | null) => void;
  currentStageLabel: string;
  formattedUnlockDate: string | null;
  summaryJobsCount: number;
  summaryNotesCount: number;
  stageBarProps: Omit<ProfileStageBarProps, "renderActionButtons"> & {
    renderActionButtons: (placement: "main" | "notes") => React.ReactNode;
  };
  jobAssignmentProps: ProfileJobAssignmentProps;
  notesProps: ProfileNotesProps;
}

export function ProfileRecruitingAccordion({
  metaAccordionValue,
  onMetaAccordionValueChange,
  currentStageLabel,
  formattedUnlockDate,
  summaryJobsCount,
  summaryNotesCount,
  stageBarProps,
  jobAssignmentProps,
  notesProps,
}: ProfileRecruitingAccordionProps) {
  const { renderActionButtons, ...restStageBarProps } = stageBarProps;
  return (
    <Accordion
      type="single"
      collapsible
      value={metaAccordionValue ?? undefined}
      onValueChange={(v) => onMetaAccordionValueChange(v ?? null)}
      className="mb-6 rounded-lg border bg-card"
    >
      <AccordionItem value="meta">
        <AccordionTrigger className="flex flex-col items-start gap-1 px-4 py-4 text-left">
          <span className="text-sm font-medium text-foreground">Recruiting-Aktivitäten</span>
          <span className="text-xs text-muted-foreground">
            Status: {currentStageLabel}
            {formattedUnlockDate ? ` • Freigeschaltet am ${formattedUnlockDate}` : ""}
            {` • Stellen: ${summaryJobsCount}`}
            {` • Notizen: ${summaryNotesCount}`}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-0">
          <div className="space-y-6">
            <ProfileStageBar {...restStageBarProps} renderActionButtons={renderActionButtons} />
            <div className="grid gap-4 lg:grid-cols-2">
              <ProfileJobAssignment {...jobAssignmentProps} />
              <ProfileNotes {...notesProps} renderActionButtons={renderActionButtons} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
