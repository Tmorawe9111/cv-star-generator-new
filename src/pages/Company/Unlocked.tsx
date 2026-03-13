import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyUserRole } from "@/hooks/useCompanyUserRole";
import { useAssignedJobIds } from "@/hooks/useAssignedJobIds";
import { useUnlockedCandidates } from "@/hooks/useUnlockedCandidates";
import { useUnlockedFilters, STAGE_FILTERS, ARCHIVED_FILTERS } from "@/hooks/useUnlockedFilters";
import { useUnlockedFiltering } from "@/hooks/useUnlockedFiltering";
import { useUnlockedExport } from "@/hooks/useUnlockedExport";
import { useEqualizeCards } from "@/components/unlocked/useEqualizeCards";
import { UnlockedModals } from "@/components/unlocked/UnlockedModals";
import { UnlockedHeader } from "@/components/unlocked/UnlockedHeader";
import { UnlockedBulkBar } from "@/components/unlocked/UnlockedBulkBar";
import { UnlockedContentCard } from "@/components/unlocked/UnlockedContentCard";
import type { UnlockedCandidate } from "@/types/unlocked";
import type { ViewMode } from "@/types/unlocked";

export default function CompanyUnlocked() {
  const { company } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: role } = useCompanyUserRole(company?.id);
  const { data: assignedJobIds, isLoading: assignedJobsLoading } = useAssignedJobIds(
    company?.id,
    role === "recruiter" || role === "viewer"
  );

  const initialStageFilters = (location.state as { initialStageFilters?: string[] })?.initialStageFilters;
  const filtersState = useUnlockedFilters({ initialStageFilters });
  const { filters, resetFilters, setSelectedStageFilters, setShowArchived, setSelectedJobId } = filtersState;

  const candidates = useUnlockedCandidates({
    companyId: company?.id,
    role,
    assignedJobIds,
    assignedJobsLoading,
  });

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const exportState = useUnlockedExport({ companyId: company?.id || "", filterKey });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeRecentTab, setActiveRecentTab] = useState<"unlocked" | "viewed">("unlocked");
  const [selectedProfile, setSelectedProfile] = useState<UnlockedCandidate | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [selectedCVUserId, setSelectedCVUserId] = useState<string | null>(null);
  const gridRef = useEqualizeCards();

  const filtering = useUnlockedFiltering({
    profiles: activeRecentTab === "unlocked" ? candidates.profiles : [],
    recentlyViewed: activeRecentTab === "viewed" ? candidates.recentlyViewed : [],
    filters,
    search,
    currentPage,
    itemsPerPage: 20,
  });

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    [...STAGE_FILTERS, ...ARCHIVED_FILTERS].forEach(({ key }) => {
      counts[key] = 0;
    });
    candidates.profiles.forEach((p) => {
      const key = (p.stage || p.status || "FREIGESCHALTET").toUpperCase();
      if (counts[key] !== undefined) counts[key] += 1;
    });
    return counts;
  }, [candidates.profiles]);

  const handlePreview = async (p: UnlockedCandidate) => {
    if (company && user) {
      try {
        await supabase.from("company_activity").insert({
          company_id: company.id,
          type: "profile_view",
          actor_user_id: user.id,
          payload: { profile_id: p.id },
        });
      } catch (e) {
        console.error("Failed to log profile view", e);
      }
    }
    navigate(`/company/profile/${p.id}`);
  };

  const handleOpenCv = (profileId: string) => {
    setSelectedCVUserId(profileId);
    setCvModalOpen(true);
  };

  const handleStageChange = async (newStage: string) => {
    if (!selectedProfile?.company_candidate_id || !company) return;
    const { error } = await supabase
      .from("company_candidates")
      .update({ stage: newStage })
      .eq("id", selectedProfile.company_candidate_id);
    if (!error) {
      toast.success("Status aktualisiert");
      setIsProfileModalOpen(false);
      await candidates.loadUnlockedCandidates();
    } else {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const currentProfiles = activeRecentTab === "unlocked" ? filtering.currentProfiles : filtering.currentRecentlyViewed;
  const totalPages = activeRecentTab === "unlocked" ? filtering.totalPages : filtering.totalPagesViewed;
  const isEmpty = activeRecentTab === "unlocked"
    ? filtering.filteredProfiles.length === 0
    : filtering.filteredRecentlyViewed.length === 0;

  return (
    <div className="mx-auto max-w-[1500px] p-4 md:p-6">
      <UnlockedHeader
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        stageCounts={stageCounts}
        availableJobs={candidates.availableJobs}
        filterHandlers={{
          setSelectedStageFilters: filtersState.setSelectedStageFilters,
          setShowArchived,
          setJobTitleFilter: filtersState.setJobTitleFilter,
          setIndustryFilter: filtersState.setIndustryFilter,
          setLocationFilter: filtersState.setLocationFilter,
          setAbschlussFilter: filtersState.setAbschlussFilter,
          setSearchKindFilters: filtersState.setSearchKindFilters,
          setUnlockedOnly: filtersState.setUnlockedOnly,
          setSelectedJobId,
        }}
        onResetFilters={resetFilters}
        onExportCsv={exportState.exportCsv}
      />

      <UnlockedBulkBar
        selectedCount={exportState.selectedCount}
        onClear={exportState.clearSelection}
        onExportCsv={exportState.exportCsv}
        onExportXlsx={exportState.exportXlsx}
        isExporting={exportState.isExporting}
      />

      <UnlockedContentCard
        loading={candidates.loading}
        isEmpty={isEmpty}
        search={search}
        activeTab={activeRecentTab}
        viewMode={viewMode}
        currentProfiles={currentProfiles}
        currentPage={currentPage}
        totalPages={totalPages}
        filters={filters}
        availableJobs={candidates.availableJobs}
        buildProcessActions={candidates.buildProcessActions}
        isSelected={exportState.isSelected}
        onToggleSelect={exportState.toggleSelection}
        onView={handlePreview}
        onDownload={handleOpenCv}
        onToggleFavorite={() => toast.success("Favorit-Funktion wird bald verfügbar sein")}
        onJobFilterClick={setSelectedJobId}
        onTabChange={(tab) => { setActiveRecentTab(tab); setCurrentPage(1); }}
        onPageChange={setCurrentPage}
        onNavigateToSearch={() => navigate("/unternehmen/kandidatensuche")}
        gridRef={gridRef}
      />

      <UnlockedModals
        isProfileModalOpen={isProfileModalOpen}
        selectedProfile={selectedProfile}
        cvModalOpen={cvModalOpen}
        selectedCVUserId={selectedCVUserId}
        onProfileModalClose={() => { setIsProfileModalOpen(false); setSelectedProfile(null); }}
        onCvModalOpenChange={setCvModalOpen}
        onStageChange={handleStageChange}
        onReload={candidates.loadUnlockedCandidates}
      />
    </div>
  );
}
