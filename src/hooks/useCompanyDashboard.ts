import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { fetchPipelineSnapshot } from "@/lib/api/pipeline";
import type { CompanyUserRole } from "@/hooks/useCompanyUserRole";
import type {
  DashboardTab,
  DashboardMetrics,
  PipelineCounts,
  ListState,
  JobState,
  JobHighlightItem,
  CommunityPost,
} from "@/types/dashboard";
import type { CandidateListItem } from "@/components/recruiter-dashboard/CandidateList";
import type { PipelineCandidateRow } from "@/lib/api/pipeline";

const ACTIVE_JOB_STATUSES = new Set(["active", "aktiv", "published", "live"]);
const STAGE_BADGES: Record<string, { label: string; tone: "info" | "accent" }> = {
  BEWERBUNG_EINGEGANGEN: { label: "Bewerbung", tone: "info" },
  NEW: { label: "Bewerbung", tone: "info" },
  FREIGESCHALTET: { label: "Freigeschaltet", tone: "accent" },
  INTERVIEW_GEPLANT: { label: "Interview geplant", tone: "accent" },
  OFFER: { label: "Angebot", tone: "accent" },
  EINGESTELLT: { label: "Eingestellt", tone: "accent" },
  ABGELEHNT: { label: "Abgelehnt", tone: "info" },
  ARCHIVIERT: { label: "Archiviert", tone: "info" },
  ABGESAGT: { label: "Abgesagt", tone: "info" },
  INTERVIEW_DURCHGEFÜHRT: { label: "Interview durchgeführt", tone: "accent" },
};

function formatSeeking(value: string[] | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return value.join(", ");
  }
  return value;
}

function toCandidateItem(
  candidate: PipelineCandidateRow,
  job: { id: string; title: string; city?: string | null; location?: string | null } | undefined,
  companyId: string
): CandidateListItem {
  const profile = candidate.profiles;
  const badge = STAGE_BADGES[candidate.status ?? ""];
  const isFromApplication =
    candidate.source === "bewerbung" ||
    (candidate.linked_job_ids &&
      Array.isArray(candidate.linked_job_ids) &&
      candidate.linked_job_ids.length > 0);
  const isUnlocked = isFromApplication
    ? !!candidate.unlocked_at
    : !!(
        candidate.status &&
        [
          "FREIGESCHALTET",
          "INTERVIEW_GEPLANT",
          "INTERVIEW_DURCHGEFÜHRT",
          "ANGEBOT_GESENDET",
          "EINGESTELLT",
        ].includes(candidate.status)
      );
  const displayName = isUnlocked
    ? (profile ? `${profile.vorname ?? ""} ${profile.nachname ?? ""}`.trim() || "Unbekannt" : "Unbekannt")
    : (profile?.vorname ?? "Kandidat");

  return {
    id: candidate.id,
    candidateId: profile?.id ?? candidate.candidate_id,
    jobCandidateId: candidate.id,
    jobId: candidate.job_id ?? null,
    applicationId: isFromApplication ? candidate.id : null,
    name: displayName,
    city: profile?.ort ?? undefined,
    origin: candidate.source ?? undefined,
    completeness: candidate.match_score != null ? Math.min(100, Math.max(30, candidate.match_score)) : 65,
    headline: profile?.headline ?? profile?.branche ?? undefined,
    seeking: formatSeeking(profile?.job_search_preferences),
    appliedAt: isFromApplication ? (candidate.created_at ?? candidate.updated_at ?? null) : null,
    plannedAt:
      candidate.status === "INTERVIEW_GEPLANT"
        ? (candidate.interview_date ?? candidate.next_action_at ?? candidate.updated_at ?? undefined)
        : undefined,
    jobTitle: job?.title ?? undefined,
    badgeLabel: badge.label,
    badgeTone: badge.tone,
    avatarUrl: isUnlocked ? (profile?.avatar_url ?? undefined) : undefined,
    isUnlocked,
    companyId,
  };
}

export interface UseCompanyDashboardOptions {
  companyId: string | null | undefined;
  company: { seat_limit?: number; seats?: number } | null;
  role: CompanyUserRole | null | undefined;
  assignedJobIds: string[] | undefined;
  assignedJobsLoading: boolean;
}

export interface UseCompanyDashboardResult {
  counts: {
    active_jobs: number;
    applications_total: number;
    interviews_planned: number;
    hires_total: number;
    unlocked_profiles: number;
    seats_used: number;
    seats_total: number;
  };
  pipeline: PipelineCounts;
  countsLoading: boolean;
  pipelineLoading: boolean;
  activeStage: DashboardTab;
  setActiveStage: (stage: DashboardTab) => void;
  newList: ListState<CandidateListItem>;
  unlockedList: ListState<CandidateListItem>;
  plannedList: ListState<CandidateListItem>;
  jobsState: JobState;
  communityPosts: CommunityPost[];
  scrollToStage: (stage: DashboardTab) => void;
  loadDashboardSnapshot: () => Promise<void>;
  pipelineCardRef: React.RefObject<HTMLDivElement | null>;
}

const DEFAULT_COUNTS = {
  active_jobs: 0,
  applications_total: 0,
  interviews_planned: 0,
  hires_total: 0,
  unlocked_profiles: 0,
  seats_used: 0,
  seats_total: 0,
};

const DEFAULT_PIPELINE: PipelineCounts = {
  new_apps: 0,
  unlocked_and_plan: 0,
  interviews_planned: 0,
};

const INITIAL_LIST_STATE: ListState<CandidateListItem> = {
  items: [],
  loading: false,
  hasMore: false,
};

export function useCompanyDashboard({
  companyId,
  company,
  role,
  assignedJobIds,
  assignedJobsLoading,
}: UseCompanyDashboardOptions): UseCompanyDashboardResult {
  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const [pipeline, setPipeline] = useState<PipelineCounts>(DEFAULT_PIPELINE);
  const [countsLoading, setCountsLoading] = useState(true);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<DashboardTab>(() => {
    if (typeof window !== "undefined") {
      const focus = sessionStorage.getItem("company-dashboard-focus");
      if (focus === "new" || focus === "unlocked" || focus === "planned") {
        sessionStorage.removeItem("company-dashboard-focus");
        return focus;
      }
    }
    return "new";
  });
  const [newList, setNewList] = useState<ListState<CandidateListItem>>(INITIAL_LIST_STATE);
  const [unlockedList, setUnlockedList] = useState<ListState<CandidateListItem>>(INITIAL_LIST_STATE);
  const [plannedList, setPlannedList] = useState<ListState<CandidateListItem>>(INITIAL_LIST_STATE);
  const [jobsState, setJobsState] = useState<JobState>({ items: [], loading: true });
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const pipelineCardRef = useRef<HTMLDivElement | null>(null);

  const loadDashboardSnapshot = useCallback(async () => {
    if (!companyId) return;

    setCountsLoading(true);
    setPipelineLoading(true);
    setNewList((prev) => ({ ...prev, loading: true }));
    setUnlockedList((prev) => ({ ...prev, loading: true }));
    setPlannedList((prev) => ({ ...prev, loading: true }));
    setJobsState((prev) => ({ ...prev, loading: true }));

    try {
      const pipelineSnapshot = await fetchPipelineSnapshot(companyId, {
        limitPerStage: 4,
        scopedJobIds: assignedJobIds ?? [],
        role,
      });

      const jobIds = new Set(
        [
          ...pipelineSnapshot.newCandidates,
          ...pipelineSnapshot.unlockedCandidates,
          ...pipelineSnapshot.plannedCandidates,
        ]
          .map((c) => c.job_id)
          .filter((id): id is string => Boolean(id))
      );

      const [jobResult, communityResult] = await Promise.all([
        supabase
          .from("job_posts")
          .select("id, title, city, status, is_active, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
        supabase
          .from("posts")
          .select("id, content, created_at")
          .eq("company_id", companyId)
          .eq("author_type", "company")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (jobResult.error) throw jobResult.error;

      const jobPosts = (jobResult.data as Array<{ id: string; title: string; city?: string | null; status?: string | null; is_active?: boolean | null; created_at?: string | null }>) || [];
      const jobMap = new Map<string, { id: string; title: string; city?: string | null; location: string | null }>();
      jobPosts.forEach((job) =>
        jobMap.set(job.id, { ...job, location: job.city ?? null })
      );

      const newCandidates: CandidateListItem[] = pipelineSnapshot.newCandidates.map((c) =>
        toCandidateItem(c, c.job_id ? jobMap.get(c.job_id) : undefined, companyId)
      );
      const unlockedCandidates: CandidateListItem[] = pipelineSnapshot.unlockedCandidates.map((c) =>
        toCandidateItem(c, c.job_id ? jobMap.get(c.job_id) : undefined, companyId)
      );
      const plannedCandidates: CandidateListItem[] = pipelineSnapshot.plannedCandidates.map((c) =>
        toCandidateItem(c, c.job_id ? jobMap.get(c.job_id) : undefined, companyId)
      );

      setNewList({
        items: newCandidates,
        loading: false,
        hasMore: pipelineSnapshot.totals.newCount > pipelineSnapshot.limitPerStage,
      });
      setUnlockedList({
        items: unlockedCandidates,
        loading: false,
        hasMore: pipelineSnapshot.totals.unlockedCount > pipelineSnapshot.limitPerStage,
      });
      setPlannedList({
        items: plannedCandidates,
        loading: false,
        hasMore: pipelineSnapshot.totals.plannedCount > pipelineSnapshot.limitPerStage,
      });

      const { data: metricsData, error: metricsError } = await supabase.rpc(
        "get_company_dashboard_metrics",
        { p_company_id: companyId }
      );

      let parsedMetrics = metricsData as DashboardMetrics | null;
      if (typeof metricsData === "string") {
        try {
          parsedMetrics = JSON.parse(metricsData) as DashboardMetrics;
        } catch {
          parsedMetrics = null;
        }
      }

      const metrics =
        parsedMetrics ||
        ({
          active_jobs: jobPosts.filter((j) => {
            const s = (j.status ?? "").toLowerCase();
            return ACTIVE_JOB_STATUSES.has(s) && j.is_active !== false;
          }).length,
          applications_total: pipelineSnapshot.totals.totalApplications,
          interviews_planned: pipelineSnapshot.totals.plannedCount,
          hires_total: pipelineSnapshot.totals.hiresCount,
          unlocked_profiles: pipelineSnapshot.totals.unlockedProfilesCount,
          seats_used: 0,
        } as DashboardMetrics);

      const { count: seatsCount } = await supabase
        .from("company_users")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .not("accepted_at", "is", null);

      const seatsUsed = metrics?.seats_used ?? seatsCount ?? company?.seats ?? 0;

      setCounts({
        active_jobs: Number(metrics?.active_jobs) || 0,
        applications_total: Number(metrics?.applications_total) || 0,
        interviews_planned: Number(metrics?.interviews_planned) || 0,
        hires_total: Number(metrics?.hires_total) || 0,
        unlocked_profiles: Number(metrics?.unlocked_profiles) || 0,
        seats_used: Number(seatsUsed),
        seats_total: company?.seat_limit ?? 5,
      });

      setPipeline({
        new_apps: pipelineSnapshot.totals.newCount,
        unlocked_and_plan: pipelineSnapshot.totals.unlockedCount,
        interviews_planned: pipelineSnapshot.totals.plannedCount,
      });

      setJobsState({
        items: jobPosts
          .filter((j) => {
            const s = (j.status ?? "").toLowerCase();
            return ACTIVE_JOB_STATUSES.has(s) && j.is_active !== false;
          })
          .slice(0, 4)
          .map((job) => ({
            job_id: job.id,
            title: job.title,
            location: job.city ?? null,
            created_at: job.created_at,
            applicants_count: pipelineSnapshot.jobStats[job.id]?.total ?? 0,
          })) as JobHighlightItem[],
        loading: false,
      });

      if (!communityResult.error && communityResult.data) {
        const raw = communityResult.data as Array<{ id: string; content?: string; title?: string; topic?: string | null }>;
        setCommunityPosts(
          raw.map((p) => ({
            id: p.id,
            title: p.title ?? (p.content ?? "").slice(0, 80),
            topic: p.topic ?? null,
          }))
        );
      }
    } catch (error) {
      console.error("Dashboard load error", error);
      toast.error("Dashboard-Daten konnten nicht geladen werden.");
      setJobsState((prev) => ({ ...prev, loading: false }));
      setNewList((prev) => ({ ...prev, loading: false }));
      setUnlockedList((prev) => ({ ...prev, loading: false }));
      setPlannedList((prev) => ({ ...prev, loading: false }));
    } finally {
      setCountsLoading(false);
      setPipelineLoading(false);
    }
  }, [companyId, company?.seat_limit, company?.seats, assignedJobIds, role]);

  useEffect(() => {
    if (!companyId) return;
    if ((role === "recruiter" || role === "viewer") && assignedJobsLoading) return;
    loadDashboardSnapshot();
  }, [companyId, loadDashboardSnapshot, role, assignedJobsLoading]);

  const handleRealtimeUpdate = useCallback(() => {
    loadDashboardSnapshot();
  }, [loadDashboardSnapshot]);

  useRealtime(
    companyId ? `dashboard-realtime-${companyId}` : "dashboard-realtime",
    companyId
      ? [
          { table: "applications", filter: `company_id=eq.${companyId}` },
          { table: "job_posts", filter: `company_id=eq.${companyId}` },
          { table: "company_candidates", filter: `company_id=eq.${companyId}` },
          { table: "company_users", filter: `company_id=eq.${companyId}` },
        ]
      : [],
    handleRealtimeUpdate,
    [handleRealtimeUpdate]
  );

  useEffect(() => {
    const timer = setInterval(handleRealtimeUpdate, 60_000);
    return () => clearInterval(timer);
  }, [handleRealtimeUpdate]);

  const scrollToStage = useCallback((stage: DashboardTab) => {
    setActiveStage(stage);
    if (pipelineCardRef.current) {
      pipelineCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      sessionStorage.setItem("company-dashboard-focus", stage);
    }
  }, []);

  return {
    counts,
    pipeline,
    countsLoading,
    pipelineLoading,
    activeStage,
    setActiveStage,
    newList,
    unlockedList,
    plannedList,
    jobsState,
    communityPosts,
    scrollToStage,
    loadDashboardSnapshot,
    pipelineCardRef,
  };
}
