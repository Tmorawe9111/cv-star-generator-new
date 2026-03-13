import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyUserRole } from "@/hooks/useCompanyUserRole";
import { useAssignedJobIds } from "@/hooks/useAssignedJobIds";
import { useProfileView } from "@/hooks/useProfileView";
import { useProfileNotes } from "@/hooks/useProfileNotes";
import { useProfileJobAssignment } from "@/hooks/useProfileJobAssignment";
import { useProfileActions } from "@/hooks/useProfileActions";
import { ProfileMainContent } from "@/components/profile/ProfileMainContent";
import { ProfileRecruitingSection } from "@/components/profile/ProfileRecruitingSection";
import { ProfileModals } from "@/components/profile/ProfileModals";
import { ProfileBanners } from "@/components/profile/ProfileBanners";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileViewNav, ProfileViewHeader } from "@/components/profile/ProfileViewNav";

export default function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { company } = useCompany();
  const { user } = useAuth();
  const { data: role } = useCompanyUserRole(company?.id);
  const { data: assignedJobIds } = useAssignedJobIds(
    company?.id,
    role === "recruiter" || role === "viewer"
  );

  const navState = location.state as { from?: { pathname: string; search?: string }; label?: string } | undefined;
  const backPath = navState?.from ? `${navState.from.pathname}${navState.from.search ?? ""}` : "/company/search";
  const backLabel = navState?.label ?? "Kandidatensuche";

  const view = useProfileView({ candidateId: id, companyId: company?.id, company });

  const notes = useProfileNotes({
    companyId: company?.id,
    candidateId: id,
    rawNotes: view.candidateMeta?.notes,
    userId: user?.id,
    userDisplayName: (user?.user_metadata?.name as string) || user?.email || user?.id,
    onNotesUpdated: view.loadCandidateMeta,
  });

  const jobs = useProfileJobAssignment({
    companyId: company?.id,
    candidateId: id,
    linkedJobIds: view.candidateMeta?.linked_job_ids,
    role,
    assignedJobIds,
    updateCandidateRecord: view.updateCandidateRecord,
    onMetaReload: view.loadCandidateMeta,
  });

  const actions = useProfileActions({
    candidateStatus: view.candidateStatus,
    resumeStatus: view.resumeStatus,
    statusUpdating: view.statusUpdating,
    plannedAt: view.plannedAt,
    completedAt: view.completedAt,
    onStatusChange: view.handleStatusChange,
  });

  const handleUnlockSuccess = async () => {
    view.setUnlockModalOpen(false);
    await view.loadProfile();
    await view.checkUnlockState();
    await view.loadCandidateMeta();
    toast.success("Profil freigeschaltet!");
  };

  const handleInterviewComplete = async () => {
    await view.loadCandidateMeta();
    view.setShowInterviewModal(false);
  };

  if (view.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!view.profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-muted-foreground">Profil nicht gefunden</p>
        <Button onClick={() => navigate(backPath)}>Zurück zu {backLabel}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <ProfileViewNav
          backPath={backPath}
          backLabel={backLabel}
          displayName={view.profile?.vorname || view.profile?.full_name || "Profil"}
          isUnlocked={view.isUnlocked}
          followStatus={view.followStatus}
          following={view.following}
          onBack={() => navigate(backPath)}
          onFollow={view.handleFollow}
        />

        {view.isUnlocked && (
          <ProfileRecruitingSection
            view={view}
            notes={notes}
            jobs={jobs}
            availableActions={actions.availableActions}
            onRunAction={actions.runAction}
            isActionDisabled={actions.isActionDisabled}
            onHistorieNavigate={() => navigate(`/unternehmen/profil/${id}/historie`)}
          />
        )}

        <ProfileViewHeader
          backPath={backPath}
          backLabel={backLabel}
          isUnlocked={view.isUnlocked}
          followStatus={view.followStatus}
          following={view.following}
          onBack={() => navigate(backPath)}
          onFollow={view.handleFollow}
        />

        <ProfileBanners
          applications={view.applications}
          isUnlocked={view.isUnlocked}
          candidateWorksForCompany={view.candidateWorksForCompany}
          interestRequestStatus={view.interestRequestStatus}
          creatingInterestRequest={view.creatingInterestRequest}
          onUnlockClick={() => view.setUnlockModalOpen(true)}
          onCreateInterestRequest={view.handleCreateInterestRequest}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <ProfileMainContent
            displayProfile={view.displayProfile}
            isUnlocked={view.isUnlocked}
            userId={id || ""}
            followStatus={view.followStatus}
            berufserfahrung={view.displayProfile?.berufserfahrung || []}
            schulbildung={view.displayProfile?.schulbildung || []}
          />
          <div className="lg:col-span-4">
            <ProfileSidebar
              loadingEmploymentRequest={view.loadingEmploymentRequest}
              employmentRequest={view.employmentRequest}
              employmentRequestUpdating={view.employmentRequestUpdating}
              getEmploymentRequestBadge={view.getEmploymentRequestBadge}
              onEmploymentRequestAccept={() => view.handleEmploymentRequestStatus("accepted")}
              onEmploymentRequestDecline={() => view.handleEmploymentRequestStatus("declined")}
              isUnlocked={view.isUnlocked}
              profile={view.profile}
              displayProfile={view.displayProfile}
              profileId={id || ""}
            />
          </div>
        </div>

        <ProfileModals
          profile={view.profile}
          companyId={company?.id || ""}
          unlockModalOpen={view.unlockModalOpen}
          onUnlockModalOpenChange={view.setUnlockModalOpen}
          onUnlockSuccess={handleUnlockSuccess}
          showInterviewModal={view.showInterviewModal}
          onInterviewModalOpenChange={view.setShowInterviewModal}
          companyCandidateId={view.candidateMeta?.id ?? null}
          applicationId={view.applications[0]?.id || ""}
          jobId={jobs.linkedJobs[0]?.id || jobs.selectedJobIds[0] || ""}
          candidateName={view.profile?.full_name || view.profile?.vorname || "Kandidat"}
          onInterviewComplete={handleInterviewComplete}
        />
      </div>
    </div>
  );
}
