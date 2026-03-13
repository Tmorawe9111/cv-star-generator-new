import CandidateUnlockModal from "@/components/unlock/CandidateUnlockModal";
import { ScheduleInterviewAfterQuestions } from "@/components/jobs/ScheduleInterviewAfterQuestions";

export interface UnlockCandidate {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  vorname?: string | null;
  nachname?: string | null;
}

export interface ProfileModalsProps {
  profile: UnlockCandidate | null;
  companyId: string;
  unlockModalOpen: boolean;
  onUnlockModalOpenChange: (open: boolean) => void;
  onUnlockSuccess: () => Promise<void>;
  showInterviewModal: boolean;
  onInterviewModalOpenChange: (open: boolean) => void;
  companyCandidateId: string | null;
  applicationId: string;
  jobId: string;
  candidateName: string;
  onInterviewComplete: () => Promise<void>;
}

export function ProfileModals({
  profile,
  companyId,
  unlockModalOpen,
  onUnlockModalOpenChange,
  onUnlockSuccess,
  showInterviewModal,
  onInterviewModalOpenChange,
  companyCandidateId,
  applicationId,
  jobId,
  candidateName,
  onInterviewComplete,
}: ProfileModalsProps) {
  return (
    <>
      {profile && (
        <CandidateUnlockModal
          open={unlockModalOpen}
          onOpenChange={onUnlockModalOpenChange}
          candidate={{
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name,
            vorname: profile.vorname,
            nachname: profile.nachname,
          }}
          companyId={companyId}
          contextApplication={null}
          contextType="none"
          onSuccess={onUnlockSuccess}
        />
      )}
      {companyCandidateId && (
        <ScheduleInterviewAfterQuestions
          open={showInterviewModal}
          onOpenChange={onInterviewModalOpenChange}
          applicationId={applicationId}
          jobId={jobId}
          companyId={companyId}
          candidateName={candidateName}
          companyCandidateId={companyCandidateId}
          onComplete={onInterviewComplete}
        />
      )}
    </>
  );
}
