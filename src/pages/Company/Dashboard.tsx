import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useCompanyUserRole } from "@/hooks/useCompanyUserRole";
import { useAssignedJobIds } from "@/hooks/useAssignedJobIds";
import { useCompanyDashboard } from "@/hooks/useCompanyDashboard";
import { useCompanyDashboardActions } from "@/hooks/useCompanyDashboardActions";
import { usePurchaseSuccessFromUrl } from "@/hooks/usePurchaseSuccessFromUrl";
import { useQuery } from "@tanstack/react-query";
import { getTopMatchCountForCompany } from "@/lib/api/company-matches";
import { TopRightQuickActions } from "@/components/Company/TopRightQuickActions";
import { CompanyTopMatchesBanner } from "@/components/Company/CompanyTopMatchesBanner";
import { WelcomePopup } from "@/components/welcome/WelcomePopup";
import {
  StatsGrid,
  PipelineTabs,
  JobHighlights,
  TodayTasksCard,
  CommunitySpotlight,
  AdminShortcut,
  DashboardModals,
  PipelineStageSection,
} from "@/components/dashboard";
import type { DashboardTab } from "@/types/dashboard";

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { company, refetch: refetchCompany } = useCompany();
  const { data: role } = useCompanyUserRole(company?.id);
  const { data: assignedJobIds, isLoading: assignedJobsLoading } = useAssignedJobIds(company?.id, role === "recruiter" || role === "viewer");

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTokenPurchaseModal, setShowTokenPurchaseModal] = useState(false);
  const [successModal, setSuccessModal] = useState<{ open: boolean; type: "tokens" | "plan"; tokenAmount?: number; planKey?: string }>({ open: false, type: "tokens" });

  const dashboard = useCompanyDashboard({ companyId, company, role, assignedJobIds, assignedJobsLoading });
  const actions = useCompanyDashboardActions({ companyId, loadDashboardSnapshot: dashboard.loadDashboardSnapshot });

  usePurchaseSuccessFromUrl({ companyId, refetchCompany, setSuccessModal });

  const { data: topMatchCount = 0, isLoading: topMatchCountLoading } = useQuery({
    queryKey: ["top-match-count", companyId],
    queryFn: () => (companyId ? getTopMatchCountForCompany(companyId) : 0),
    enabled: !!companyId,
    refetchInterval: 60000,
  });

  const handleStageChange = (tab: DashboardTab) => {
    dashboard.setActiveStage(tab);
    if (dashboard.pipelineCardRef.current) {
      dashboard.pipelineCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      sessionStorage.setItem("company-dashboard-focus", tab);
    }
  };

  const listState = dashboard.activeStage === "new" ? dashboard.newList : dashboard.activeStage === "unlocked" ? dashboard.unlockedList : dashboard.plannedList;

  return (
    <>
      <WelcomePopup type="company" companyId={companyId ?? undefined} />
      <div className="min-h-screen bg-background">
        <div className="flex w-full flex-col gap-6 px-4 pb-12 pt-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur">
            <div className="px-2 pt-3 sm:px-4 lg:px-8 xl:px-12">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Dashboard für Recruiter*innen
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold text-slate-900">Willkommen zurück</h1>
                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                      {company?.name ?? "Ihr Unternehmen"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Behalten Sie KPIs, aktuelle Bewerbungen und aktive Stellen im Blick.
                  </p>
                </div>
                <TopRightQuickActions
                  role="Admin"
                  newApplicationsCount={dashboard.pipeline.new_apps}
                  onPostJob={() => navigate("/company/jobs/new")}
                  onReviewApplications={() => handleStageChange("new")}
                  onUpgradePlan={() => setShowUpgradeModal(true)}
                  onBuyTokens={() => setShowTokenPurchaseModal(true)}
                />
              </div>
            </div>
          </div>

          <StatsGrid
            counts={dashboard.counts}
            loading={dashboard.countsLoading}
            onManageSeats={() => navigate("/company/settings/team")}
          />

          {!topMatchCountLoading && topMatchCount > 0 && (
            <CompanyTopMatchesBanner count={topMatchCount} />
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              <div ref={dashboard.pipelineCardRef}>
                <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                      Talente im Prozess
                    </p>
                    <CardTitle className="text-lg">
                      Neue Bewerbungen, freigeschaltete Profile und Interviews
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Direkt eingegangene Bewerbungen warten auf Ihre Entscheidung.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <PipelineTabs
                      activeTab={dashboard.activeStage}
                      onTabChange={(tab) => handleStageChange(tab as DashboardTab)}
                      counts={dashboard.pipelineLoading ? null : dashboard.pipeline}
                    />
                    <PipelineStageSection
                      stage={dashboard.activeStage}
                      listState={listState}
                      pipeline={dashboard.pipeline}
                      pipelineLoading={dashboard.pipelineLoading}
                      pendingActionId={actions.pendingActionId}
                      loadDashboardSnapshot={dashboard.loadDashboardSnapshot}
                      onUnlockCandidate={actions.handleUnlockCandidate}
                      onAssignApplication={actions.handleAssignApplication}
                      onRejectCandidate={actions.handleRejectCandidate}
                      onCancelCandidate={actions.handleCancelCandidate}
                      onViewProfile={actions.handleViewProfile}
                      onViewAll={actions.handleViewAll}
                      onDownloadCv={actions.handleDownloadCV}
                    />
                  </CardContent>
                </Card>
              </div>

              <JobHighlights
                jobs={dashboard.jobsState.items}
                loading={dashboard.jobsState.loading}
                onOpenJobs={() => navigate("/company/jobs")}
              />
              <div className="flex justify-center">
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/company/jobs")}>
                  Alle Stellen ansehen
                </Button>
              </div>
            </div>

            <aside className="space-y-6 xl:col-span-4">
              <TodayTasksCard pipeline={dashboard.pipeline} />
              <CommunitySpotlight posts={dashboard.communityPosts} />
              <AdminShortcut />
            </aside>
          </div>
        </div>

        <DashboardModals
          showUpgradeModal={showUpgradeModal}
          setShowUpgradeModal={setShowUpgradeModal}
          showTokenPurchaseModal={showTokenPurchaseModal}
          setShowTokenPurchaseModal={setShowTokenPurchaseModal}
          successModal={successModal}
          setSuccessModal={setSuccessModal}
          companyId={companyId}
          selectedPlanId={company?.selected_plan_id}
        />
      </div>
    </>
  );
}
