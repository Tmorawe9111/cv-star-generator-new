import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useRPC } from "@/hooks/useRPC";
import { useRealtime } from "@/hooks/useRealtime";
import { StatsGrid, type DashboardCounts } from "@/components/recruiter-dashboard/StatsGrid";
import { PipelineTabs, type PipelineCounts } from "@/components/recruiter-dashboard/PipelineTabs";
import {
  CandidateList,
  type CandidateListItem,
} from "@/components/recruiter-dashboard/CandidateList";
import { JobHighlights, type JobHighlightItem } from "@/components/recruiter-dashboard/JobHighlights";
import { TopRightQuickActions } from "@/components/company/TopRightQuickActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight } from "lucide-react";

type ListState = {
  items: CandidateListItem[];
  loading: boolean;
  offset: number;
  hasMore: boolean;
};

type JobState = {
  items: JobHighlightItem[];
  loading: boolean;
};

type NewApplicationRow = {
  application_id: string;
  job_candidate_id?: string | null;
  candidate_id: string;
  name: string;
  city?: string | null;
  completeness?: number | null;
  origin?: string | null;
  headline?: string | null;
  seeking?: string | null;
};

type UnlockedRow = {
  job_candidate_id: string;
  candidate_id: string;
  name: string;
  city?: string | null;
  origin?: string | null;
  completeness?: number | null;
  headline?: string | null;
  seeking?: string | null;
};

type PlannedRow = {
  job_candidate_id: string;
  candidate_id: string;
  name: string;
  city?: string | null;
  planned_at?: string | null;
  completeness?: number | null;
  headline?: string | null;
  seeking?: string | null;
};

const PAGE_SIZE = 10;

const INITIAL_LIST_STATE: ListState = {
  items: [],
  loading: false,
  offset: 0,
  hasMore: true,
};

const INITIAL_JOB_STATE: JobState = {
  items: [],
  loading: false,
};

const DEFAULT_COUNTS: DashboardCounts = {
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

function mapNewApplication(row: NewApplicationRow): CandidateListItem {
  return {
    id: row.job_candidate_id ?? row.application_id,
    candidateId: row.candidate_id,
    jobCandidateId: row.job_candidate_id ?? null,
    name: row.name,
    city: row.city,
    completeness: row.completeness,
    headline: row.headline,
    seeking: row.seeking,
    origin: row.origin ?? "bewerbung",
    badgeLabel: "Bewerbung",
    badgeTone: "info",
  };
}

function mapUnlockedCandidate(row: UnlockedRow): CandidateListItem {
  return {
    id: row.job_candidate_id,
    candidateId: row.candidate_id,
    jobCandidateId: row.job_candidate_id,
    name: row.name,
    city: row.city,
    completeness: row.completeness,
    headline: row.headline,
    seeking: row.seeking,
    origin: row.origin,
    badgeLabel: "Freigeschaltet",
    badgeTone: "accent",
  };
}

function mapPlannedInterview(row: PlannedRow): CandidateListItem {
  return {
    id: row.job_candidate_id,
    candidateId: row.candidate_id,
    jobCandidateId: row.job_candidate_id,
    name: row.name,
    city: row.city,
    completeness: row.completeness,
    headline: row.headline,
    plannedAt: row.planned_at ?? null,
    seeking: row.seeking,
    badgeLabel: "Interview geplant",
    badgeTone: "accent",
  };
}

async function fetchDashboardCounts(companyId: string): Promise<DashboardCounts> {
  const { data, error } = await supabase.rpc("dashboard_counts", { p_company: companyId });
  if (error) throw error;
  return data ?? DEFAULT_COUNTS;
}

async function fetchPipelineCounts(companyId: string): Promise<PipelineCounts> {
  const { data, error } = await supabase.rpc("pipeline_counts", { p_company: companyId });
  if (error) throw error;
  return data ?? DEFAULT_PIPELINE;
}

async function fetchNewApplications(companyId: string, limit: number, offset: number) {
  const { data, error } = await supabase.rpc("list_new_applications", {
    p_company: companyId,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data as NewApplicationRow[]) ?? [];
}

async function fetchUnlockedCandidates(companyId: string, limit: number, offset: number) {
  const { data, error } = await supabase.rpc("list_unlocked", {
    p_company: companyId,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data as UnlockedRow[]) ?? [];
}

async function fetchPlannedInterviews(companyId: string, limit: number, offset: number) {
  const { data, error } = await supabase.rpc("list_planned_interviews", {
    p_company: companyId,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data as PlannedRow[]) ?? [];
}

async function fetchJobHighlights(companyId: string, limit: number) {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `id, title, location, created_at, applicants_count`
    )
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (
    data?.map(job => ({
      job_id: job.id,
      title: job.title,
      location: job.location,
      created_at: job.created_at,
      applicants_count: job.applicants_count ?? 0,
    })) ?? []
  );
}

function TodayTasksCard({ pipeline }: { pipeline: PipelineCounts }) {
  const todoItems = [
    {
      title: `${pipeline.new_apps} neue Bewerbungen prüfen`,
      subtitle: "Pipeline · Eingegangen",
      highlight: pipeline.new_apps > 0,
    },
    {
      title: `${pipeline.unlocked_and_plan} Interviews terminieren`,
      subtitle: "Freigeschaltet",
      highlight: pipeline.unlocked_and_plan > 0,
    },
    {
      title: `${pipeline.interviews_planned} Interviews diese Woche`,
      subtitle: "Kalender",
      highlight: pipeline.interviews_planned > 0,
    },
  ];

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <Activity className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Heute wichtig</span>
        </div>
        <CardTitle className="text-lg">Ihre nächsten Schritte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {todoItems.map(item => (
          <div
            key={item.title}
            className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div>
              <p className={item.highlight ? "font-semibold text-slate-900" : "text-slate-700"}>
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-primary">
              Öffnen
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CommunitySpotlight({ posts }: { posts: JobHighlightItem[] }) {
  const spotlightPosts = posts.length
    ? posts.slice(0, 3).map(post => ({
        title: post.title,
        context: post.location ?? "Deutschland",
      }))
    : [
        {
          title: "3 neue Diskussionen zum Arbeitgeber-Branding",
          context: "Community Forum",
        },
        {
          title: "Best Practices: Onboarding für Azubis",
          context: "HR-Netzwerk",
        },
        {
          title: "Erfahrungsbericht: Erfolgreiche Messekontakte",
          context: "Recruiter-Stammtisch",
        },
      ];

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community</p>
        <CardTitle className="text-lg">Aus Ihrer Branche</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {spotlightPosts.map(post => (
          <div key={post.title} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-800">{post.title}</p>
            <p className="text-xs text-muted-foreground">{post.context}</p>
          </div>
        ))}
        <div className="pt-2 text-right">
          <Button variant="outline" size="sm" className="rounded-full">
            Zur Community
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminShortcut() {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Adminbereich</p>
          <h3 className="text-lg font-semibold text-slate-900">Sitze, Rollen & Standorte verwalten</h3>
          <p className="text-sm text-muted-foreground">
            Steuern Sie, wer Zugriff auf welche Standorte hat, laden Sie Teammitglieder ein und behalten Sie Berechtigungen im Griff.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary">3 Sitze belegt</Badge>
          <Badge variant="outline">2 Standorte aktiv</Badge>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-full">Adminbereich öffnen</Button>
          <Button variant="outline" className="rounded-full">Standorte zuweisen</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CompanyDashboard() {
  const companyId = useCompanyId();
  const { company } = useCompany();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [counts, setCounts] = useState<DashboardCounts>(DEFAULT_COUNTS);
  const [pipeline, setPipeline] = useState<PipelineCounts>(DEFAULT_PIPELINE);
  const [activeTab, setActiveTab] = useState<"new" | "unlocked" | "planned">("new");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [newList, setNewList] = useState<ListState>(INITIAL_LIST_STATE);
  const [unlockedList, setUnlockedList] = useState<ListState>(INITIAL_LIST_STATE);
  const [plannedList, setPlannedList] = useState<ListState>(INITIAL_LIST_STATE);
  const [jobsState, setJobsState] = useState<JobState>(INITIAL_JOB_STATE);

  const {
    data: countsData,
    isLoading: countsLoading,
    refetch: refetchCounts,
  } = useRPC<DashboardCounts>(
    ["dashboard-counts", companyId],
    () => fetchDashboardCounts(companyId!),
    { enabled: Boolean(companyId) },
  );

  const {
    data: pipelineData,
    isLoading: pipelineLoading,
    refetch: refetchPipeline,
  } = useRPC<PipelineCounts>(
    ["pipeline-counts", companyId],
    () => fetchPipelineCounts(companyId!),
    { enabled: Boolean(companyId) },
  );

  useEffect(() => {
    if (countsData) setCounts(countsData);
  }, [countsData]);

  useEffect(() => {
    if (pipelineData) setPipeline(pipelineData);
  }, [pipelineData]);

  const adjustCountsDelta = useCallback((delta: Partial<Record<keyof DashboardCounts, number>>) => {
    setCounts(prev => {
      const next = { ...prev };
      (Object.keys(delta) as (keyof DashboardCounts)[]).forEach(key => {
        const change = delta[key] ?? 0;
        next[key] = Math.max(0, (next[key] ?? 0) + change);
      });
      return next;
    });
  }, []);

  const adjustPipelineDelta = useCallback((delta: Partial<Record<keyof PipelineCounts, number>>) => {
    setPipeline(prev => {
      const next = { ...prev };
      (Object.keys(delta) as (keyof PipelineCounts)[]).forEach(key => {
        const change = delta[key] ?? 0;
        next[key] = Math.max(0, (next[key] ?? 0) + change);
      });
      return next;
    });
  }, []);

  const loadNewApplications = useCallback(
    async (reset = false) => {
      if (!companyId) return;
      setNewList(prev => ({ ...prev, loading: true }));
      try {
        const offset = reset ? 0 : newList.offset;
        const rows = await fetchNewApplications(companyId, PAGE_SIZE, offset);
        const mapped = rows.map(mapNewApplication);
        setNewList(prev => {
          const base = reset ? [] : prev.items;
          return {
            items: [...base, ...mapped],
            loading: false,
            hasMore: mapped.length === PAGE_SIZE,
            offset: (reset ? 0 : prev.offset) + mapped.length,
          };
        });
      } catch (error) {
        console.error(error);
        toast.error("Neue Bewerbungen konnten nicht geladen werden.");
        setNewList(prev => ({ ...prev, loading: false }));
      }
    },
    [companyId, newList.offset],
  );

  const loadUnlockedCandidates = useCallback(
    async (reset = false) => {
      if (!companyId) return;
      setUnlockedList(prev => ({ ...prev, loading: true }));
      try {
        const offset = reset ? 0 : unlockedList.offset;
        const rows = await fetchUnlockedCandidates(companyId, PAGE_SIZE, offset);
        const mapped = rows.map(mapUnlockedCandidate);
        setUnlockedList(prev => {
          const base = reset ? [] : prev.items;
          return {
            items: [...base, ...mapped],
            loading: false,
            hasMore: mapped.length === PAGE_SIZE,
            offset: (reset ? 0 : prev.offset) + mapped.length,
          };
        });
      } catch (error) {
        console.error(error);
        toast.error("Freigeschaltete Profile konnten nicht geladen werden.");
        setUnlockedList(prev => ({ ...prev, loading: false }));
      }
    },
    [companyId, unlockedList.offset],
  );

  const loadPlannedInterviews = useCallback(
    async (reset = false) => {
      if (!companyId) return;
      setPlannedList(prev => ({ ...prev, loading: true }));
      try {
        const offset = reset ? 0 : plannedList.offset;
        const rows = await fetchPlannedInterviews(companyId, PAGE_SIZE, offset);
        const mapped = rows.map(mapPlannedInterview);
        setPlannedList(prev => {
          const base = reset ? [] : prev.items;
          return {
            items: [...base, ...mapped],
            loading: false,
            hasMore: mapped.length === PAGE_SIZE,
            offset: (reset ? 0 : prev.offset) + mapped.length,
          };
        });
      } catch (error) {
        console.error(error);
        toast.error("Geplante Interviews konnten nicht geladen werden.");
        setPlannedList(prev => ({ ...prev, loading: false }));
      }
    },
    [companyId, plannedList.offset],
  );

  const loadJobHighlights = useCallback(
    async () => {
      if (!companyId) return;
      setJobsState(prev => ({ ...prev, loading: true }));
      try {
        const jobs = await fetchJobHighlights(companyId, 8);
        setJobsState({ items: jobs, loading: false });
      } catch (error) {
        console.error(error);
        toast.error("Job-Highlights konnten nicht geladen werden.");
        setJobsState(prev => ({ ...prev, loading: false }));
      }
    },
    [companyId],
  );

  const refreshAll = useCallback(() => {
    refetchCounts();
    refetchPipeline();
    loadNewApplications(true);
    loadUnlockedCandidates(true);
    loadPlannedInterviews(true);
    loadJobHighlights();
    queryClient.invalidateQueries({ queryKey: ["dashboard-counts", companyId] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-counts", companyId] });
  }, [
    companyId,
    loadJobHighlights,
    loadNewApplications,
    loadPlannedInterviews,
    loadUnlockedCandidates,
    queryClient,
    refetchCounts,
    refetchPipeline,
  ]);

  useEffect(() => {
    if (!companyId) return;
    loadNewApplications(true);
    loadUnlockedCandidates(true);
    loadPlannedInterviews(true);
    loadJobHighlights();
  }, [companyId, loadJobHighlights, loadNewApplications, loadPlannedInterviews, loadUnlockedCandidates]);

  const handleRealtimeUpdate = useCallback(() => {
    refetchCounts();
    refetchPipeline();
    if (activeTab === "new") loadNewApplications(true);
    if (activeTab === "unlocked") loadUnlockedCandidates(true);
    if (activeTab === "planned") loadPlannedInterviews(true);
    loadJobHighlights();
  }, [activeTab, loadJobHighlights, loadNewApplications, loadPlannedInterviews, loadUnlockedCandidates, refetchCounts, refetchPipeline]);

  useRealtime(
    companyId ? `dashboard-realtime-${companyId}` : "dashboard-realtime",
    companyId
      ? [
          { table: "applications", filter: `company_id=eq.${companyId}` },
          { table: "job_candidates", filter: `company_id=eq.${companyId}` },
          { table: "interviews", filter: `company_id=eq.${companyId}` },
          { table: "jobs", filter: `company_id=eq.${companyId}` },
          { table: "company_seats", filter: `company_id=eq.${companyId}` },
        ]
      : [],
    handleRealtimeUpdate,
    [handleRealtimeUpdate],
  );

  useEffect(() => {
    const timer = setInterval(() => handleRealtimeUpdate(), 60_000);
    return () => clearInterval(timer);
  }, [handleRealtimeUpdate]);

  const handleActionError = useCallback(
    (error: unknown, message: string) => {
      console.error(error);
      toast.error(message);
      refreshAll();
    },
    [refreshAll],
  );

  const handleUnlockCandidate = useCallback(
    async (candidate: CandidateListItem) => {
      if (!candidate.jobCandidateId) return toast.error("Freischalten nicht möglich.");
      setPendingActionId(candidate.id);
      setNewList(prev => ({ ...prev, items: prev.items.filter(item => item.id !== candidate.id) }));
      setUnlockedList(prev => ({
        ...prev,
        items: [
          { ...candidate, badgeLabel: "Freigeschaltet", badgeTone: "accent" },
          ...prev.items,
        ],
      }));
      adjustPipelineDelta({ new_apps: -1, unlocked_and_plan: 1 });
      adjustCountsDelta({ unlocked_profiles: 1 });

      try {
        await supabase.rpc("change_candidate_status", {
          p_job_candidate_id: candidate.jobCandidateId,
          p_next_status: "FREIGESCHALTET",
          p_meta: {},
          p_silent: false,
        });
        toast.success(`${candidate.name} wurde freigeschaltet.`);
      } catch (error) {
        handleActionError(error, "Freischalten fehlgeschlagen.");
      } finally {
        setPendingActionId(null);
      }
    },
    [adjustCountsDelta, adjustPipelineDelta, handleActionError],
  );

  const handlePlanInterview = useCallback(
    async (candidate: CandidateListItem, plannedAtIso: string) => {
      if (!candidate.jobCandidateId) return toast.error("Interview kann nicht geplant werden.");
      setPendingActionId(candidate.id);
      setUnlockedList(prev => ({ ...prev, items: prev.items.filter(item => item.id !== candidate.id) }));
      setPlannedList(prev => ({
        ...prev,
        items: [{ ...candidate, plannedAt: plannedAtIso, badgeLabel: "Interview geplant" }, ...prev.items],
      }));
      adjustPipelineDelta({ unlocked_and_plan: -1, interviews_planned: 1 });
      adjustCountsDelta({ interviews_planned: 1 });

      try {
        await supabase.rpc("change_candidate_status", {
          p_job_candidate_id: candidate.jobCandidateId,
          p_next_status: "INTERVIEW_GEPLANT",
          p_meta: { planned_at: plannedAtIso },
          p_silent: false,
        });
        toast.success(`Interview mit ${candidate.name} geplant.`);
      } catch (error) {
        handleActionError(error, "Interview konnte nicht geplant werden.");
      } finally {
        setPendingActionId(null);
      }
    },
    [adjustCountsDelta, adjustPipelineDelta, handleActionError],
  );

  const handleCompleteInterview = useCallback(
    async (candidate: CandidateListItem, completedAtIso: string) => {
      if (!candidate.jobCandidateId) return toast.error("Interview konnte nicht dokumentiert werden.");
      setPendingActionId(candidate.id);
      setPlannedList(prev => ({ ...prev, items: prev.items.filter(item => item.id !== candidate.id) }));
      adjustPipelineDelta({ interviews_planned: -1 });
      adjustCountsDelta({ interviews_planned: -1 });

      try {
        await supabase.rpc("change_candidate_status", {
          p_job_candidate_id: candidate.jobCandidateId,
          p_next_status: "INTERVIEW_DURCHGEFÜHRT",
          p_meta: { completed_at: completedAtIso },
          p_silent: false,
        });
        toast.success(`Interview mit ${candidate.name} dokumentiert.`);
      } catch (error) {
        handleActionError(error, "Interview konnte nicht dokumentiert werden.");
      } finally {
        setPendingActionId(null);
      }
    },
    [adjustCountsDelta, adjustPipelineDelta, handleActionError],
  );

  const handleCancelCandidate = useCallback(
    async (candidate: CandidateListItem, source: "unlocked" | "planned") => {
      if (!candidate.jobCandidateId) return toast.error("Aktion nicht möglich.");
      setPendingActionId(candidate.id);
      if (source === "unlocked") {
        setUnlockedList(prev => ({ ...prev, items: prev.items.filter(item => item.id !== candidate.id) }));
        adjustPipelineDelta({ unlocked_and_plan: -1 });
        adjustCountsDelta({ unlocked_profiles: -1 });
      } else {
        setPlannedList(prev => ({ ...prev, items: prev.items.filter(item => item.id !== candidate.id) }));
        adjustPipelineDelta({ interviews_planned: -1 });
        adjustCountsDelta({ interviews_planned: -1 });
      }

      try {
        await supabase.rpc("change_candidate_status", {
          p_job_candidate_id: candidate.jobCandidateId,
          p_next_status: "ABGESAGT",
          p_meta: {},
          p_silent: false,
        });
        toast.success(`${candidate.name} wurde abgesagt.`);
      } catch (error) {
        handleActionError(error, "Absage fehlgeschlagen.");
      } finally {
        setPendingActionId(null);
      }
    },
    [adjustCountsDelta, adjustPipelineDelta, handleActionError],
  );

  const handleRejectCandidate = useCallback(
    async (candidate: CandidateListItem, source: "new" | "unlocked" | "planned") => {
      if (!candidate.jobCandidateId) return toast.error("Aktion nicht möglich.");
      setPendingActionId(candidate.id);
      if (source === "new") {
        setNewList(prev => ({ ...prev, items: prev.items.filter(item => item.id !== candidate.id) }));
        adjustPipelineDelta({ new_apps: -1 });
      } else if (source === "unlocked") {
        setUnlockedList(prev => ({ ...prev, items: prev.items.filter(item => item.id !== candidate.id) }));
        adjustPipelineDelta({ unlocked_and_plan: -1 });
        adjustCountsDelta({ unlocked_profiles: -1 });
      } else {
        setPlannedList(prev => ({ ...prev, items: prev.items.filter(item => item.id !== candidate.id) }));
        adjustPipelineDelta({ interviews_planned: -1 });
        adjustCountsDelta({ interviews_planned: -1 });
      }

      try {
        await supabase.rpc("change_candidate_status", {
          p_job_candidate_id: candidate.jobCandidateId,
          p_next_status: "ABGELEHNT",
          p_meta: {},
          p_silent: false,
        });
        toast.success(`${candidate.name} wurde als unpassend markiert.`);
      } catch (error) {
        handleActionError(error, "Aktion fehlgeschlagen.");
      } finally {
        setPendingActionId(null);
      }
    },
    [adjustCountsDelta, adjustPipelineDelta, handleActionError],
  );

  const applicationsBadge = pipeline.new_apps ?? 0;

  const currentListState = useMemo(() => {
    if (activeTab === "new") return newList;
    if (activeTab === "unlocked") return unlockedList;
    return plannedList;
  }, [activeTab, newList, plannedList, unlockedList]);

  const renderCandidateList = () => {
    if (activeTab === "new") {
      return (
        <CandidateList
          items={newList.items}
          loading={newList.loading}
          variant="new"
          primaryActionFactory={candidate => ({
            type: "instant",
            label: "Freischalten",
            loading: pendingActionId === candidate.id,
            onConfirm: () => handleUnlockCandidate(candidate),
          })}
          rejectActionFactory={candidate => ({
            label: "Unpassend",
            variant: "outline",
            loading: pendingActionId === candidate.id,
            onClick: () => handleRejectCandidate(candidate, "new"),
          })}
          onLoadMore={newList.hasMore ? () => loadNewApplications(false) : undefined}
          hasMore={newList.hasMore}
        />
      );
    }

    if (activeTab === "unlocked") {
      return (
        <CandidateList
          items={unlockedList.items}
          loading={unlockedList.loading}
          variant="unlocked"
          primaryActionFactory={candidate => ({
            type: "plan",
            label: "Interview planen",
            loading: pendingActionId === candidate.id,
            onConfirm: plannedAt => plannedAt && handlePlanInterview(candidate, plannedAt),
          })}
          secondaryActionFactory={candidate => ({
            label: "Absagen",
            variant: "outline",
            loading: pendingActionId === candidate.id,
            onClick: () => handleCancelCandidate(candidate, "unlocked"),
          })}
          rejectActionFactory={candidate => ({
            label: "Unpassend",
            variant: "outline",
            loading: pendingActionId === candidate.id,
            onClick: () => handleRejectCandidate(candidate, "unlocked"),
          })}
          onLoadMore={unlockedList.hasMore ? () => loadUnlockedCandidates(false) : undefined}
          hasMore={unlockedList.hasMore}
        />
      );
    }

    return (
      <CandidateList
        items={plannedList.items}
        loading={plannedList.loading}
        variant="planned"
        primaryActionFactory={candidate => ({
          type: "complete",
          label: "Interview durchgeführt",
          loading: pendingActionId === candidate.id,
          onConfirm: completedAt => completedAt && handleCompleteInterview(candidate, completedAt),
        })}
        secondaryActionFactory={candidate => ({
          label: "Absagen",
          variant: "outline",
          loading: pendingActionId === candidate.id,
          onClick: () => handleCancelCandidate(candidate, "planned"),
        })}
        rejectActionFactory={candidate => ({
          label: "Unpassend",
          variant: "outline",
          loading: pendingActionId === candidate.id,
          onClick: () => handleRejectCandidate(candidate, "planned"),
        })}
        onLoadMore={plannedList.hasMore ? () => loadPlannedInterviews(false) : undefined}
        hasMore={plannedList.hasMore}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8ff]">
      <div className="flex w-full flex-col gap-6 px-4 pb-12 pt-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="sticky top-0 z-40 bg-[#f6f8ff]/95 backdrop-blur">
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
                newApplicationsCount={applicationsBadge}
                onPostJob={() => navigate("/company/jobs/new")}
                onReviewApplications={() => setActiveTab("new")}
                onUpgradePlan={() => navigate("/company/billing/upgrade")}
                onBuyTokens={() => navigate("/company/billing/tokens")}
              />
            </div>
          </div>
        </div>

        <StatsGrid
          counts={counts}
          loading={countsLoading}
          onManageSeats={() => navigate("/company/settings/team")}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Talente im Prozess
                </p>
                <CardTitle className="text-lg">Neue Bewerbungen, freigeschaltete Profile und Interviews</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Direkt eingegangene Bewerbungen warten auf Ihre Entscheidung.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <PipelineTabs
                  activeTab={activeTab}
                  onTabChange={tab => setActiveTab(tab)}
                  counts={pipelineLoading ? null : pipeline}
                />
                <div>{renderCandidateList()}</div>
                {currentListState.loading && currentListState.items.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground">Aktualisiere…</p>
                )}
              </CardContent>
            </Card>

            <JobHighlights
              jobs={jobsState.items}
              loading={jobsState.loading}
              onOpenJobs={() => navigate("/company/jobs")}
            />
          </div>

          <aside className="space-y-6 xl:col-span-4">
            <TodayTasksCard pipeline={pipeline} />
            <CommunitySpotlight posts={jobsState.items} />
            <AdminShortcut />
          </aside>
        </div>
      </div>
    </div>
  );
}