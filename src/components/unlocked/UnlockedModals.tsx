import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FullProfileModal } from "@/components/Company/FullProfileModal";
import { UserCVModal } from "@/components/admin/user/UserCVModal";
import type { UnlockedCandidate } from "@/types/unlocked";

export interface UnlockedModalsProps {
  isProfileModalOpen: boolean;
  selectedProfile: UnlockedCandidate | null;
  cvModalOpen: boolean;
  selectedCVUserId: string | null;
  onProfileModalClose: () => void;
  onCvModalOpenChange: (open: boolean) => void;
  onStageChange: (newStage: string) => Promise<void>;
  onReload: () => Promise<void>;
}

export function UnlockedModals({
  isProfileModalOpen,
  selectedProfile,
  cvModalOpen,
  selectedCVUserId,
  onProfileModalClose,
  onCvModalOpenChange,
  onStageChange,
  onReload,
}: UnlockedModalsProps) {
  const handleArchive = async (reason?: string) => {
    if (!selectedProfile?.company_candidate_id) return;
    const { error } = await supabase
      .from("company_candidates")
      .update({ stage: "rejected", notes: reason ? `Absage: ${reason}` : undefined })
      .eq("id", selectedProfile.company_candidate_id);
    if (!error) {
      toast.success("Kandidat abgelehnt");
      onProfileModalClose();
      await onReload();
    } else {
      toast.error("Fehler beim Ablehnen");
    }
  };

  return (
    <>
      <FullProfileModal
        isOpen={isProfileModalOpen}
        onClose={onProfileModalClose}
        profile={selectedProfile}
        isUnlocked
        companyCandidate={
          selectedProfile
            ? {
                id: selectedProfile.company_candidate_id || "",
                stage: selectedProfile.stage || "new",
                unlocked_at: selectedProfile.unlocked_at || "",
              }
            : undefined
        }
        onStageChange={onStageChange}
        onArchive={handleArchive}
      />
      <UserCVModal open={cvModalOpen} onOpenChange={onCvModalOpenChange} userId={selectedCVUserId || ""} />
    </>
  );
}
