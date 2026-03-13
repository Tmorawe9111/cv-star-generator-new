import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UnlockedCandidate } from "@/types/unlocked";
import type { ProcessStageValue, ProcessStageAction } from "@/types/unlocked";

export const ITEMS_PER_PAGE = 20;

export const PROCESS_STAGE_OPTIONS = [
  { value: "FREIGESCHALTET", label: "Freigeschaltet" },
  { value: "INTERVIEW_GEPLANT", label: "Interview geplant" },
  { value: "INTERVIEW_DURCHGEFÜHRT", label: "Interview durchgeführt" },
  { value: "ANGEBOT_GESENDET", label: "Angebot gesendet" },
  { value: "EINGESTELLT", label: "Eingestellt" },
  { value: "ABGESAGT", label: "Abgesagt" },
  { value: "ABGELEHNT", label: "Abgelehnt" },
  { value: "ON_HOLD", label: "On Hold" },
] as const;

export const PIPELINE_ORDER: ProcessStageValue[] = [
  "FREIGESCHALTET",
  "INTERVIEW_GEPLANT",
  "INTERVIEW_DURCHGEFÜHRT",
  "ANGEBOT_GESENDET",
  "EINGESTELLT",
];

export interface AvailableJob {
  id: string;
  title: string;
  is_active: boolean;
}

export interface UseUnlockedCandidatesOptions {
  companyId: string | null | undefined;
  role: string | null | undefined;
  assignedJobIds: string[] | undefined;
  assignedJobsLoading: boolean;
}

export interface UseUnlockedCandidatesResult {
  profiles: UnlockedCandidate[];
  recentlyViewed: UnlockedCandidate[];
  loading: boolean;
  availableJobs: AvailableJob[];
  loadUnlockedCandidates: () => Promise<void>;
  updateCandidateStage: (companyCandidateId: string | undefined, nextStage: ProcessStageValue) => Promise<void>;
  statusUpdatingId: string | null;
  buildProcessActions: (profile: UnlockedCandidate) => ProcessStageAction[];
}

function parseJsonField(field: unknown): unknown {
  if (field === null || field === undefined) return null;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  }
  return field;
}

export function useUnlockedCandidates({
  companyId,
  role,
  assignedJobIds,
  assignedJobsLoading,
}: UseUnlockedCandidatesOptions): UseUnlockedCandidatesResult {
  const [profiles, setProfiles] = useState<UnlockedCandidate[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<UnlockedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const updateCandidateStage = useCallback(
    async (companyCandidateId: string | undefined, nextStage: ProcessStageValue) => {
      if (!companyCandidateId) return;
      try {
        setStatusUpdatingId(companyCandidateId);
        let meta: Record<string, unknown> = {};
        if (nextStage === "INTERVIEW_DURCHGEFÜHRT") {
          meta = { interview_date: new Date().toISOString() };
        }
        const { error } = await supabase.rpc("change_candidate_status", {
          p_company_candidate_id: companyCandidateId,
          p_next_status: nextStage,
          p_meta: meta,
          p_silent: false,
        });
        if (error) throw error;
        setProfiles((prev) =>
          prev.map((p) =>
            p.company_candidate_id === companyCandidateId
              ? { ...p, stage: nextStage, status: nextStage }
              : p
          )
        );
        toast.success("Status aktualisiert");
      } catch (error) {
        console.error("Stage update failed", error);
        toast.error("Status konnte nicht aktualisiert werden");
      } finally {
        setStatusUpdatingId(null);
      }
    },
    []
  );

  const buildProcessActions = useCallback(
    (profile: UnlockedCandidate): ProcessStageAction[] => {
      const currentStage = (profile.stage || "FREIGESCHALTET").toUpperCase() as ProcessStageValue;
      const currentIndex = PIPELINE_ORDER.indexOf(currentStage);
      const nextStage =
        currentIndex >= 0 && currentIndex < PIPELINE_ORDER.length - 1
          ? PIPELINE_ORDER[currentIndex + 1]
          : null;
      if (!nextStage) return [];
      const nextStageConfig = PROCESS_STAGE_OPTIONS.find((opt) => opt.value === nextStage);
      return nextStageConfig
        ? [
            {
              key: `${profile.id}-${nextStageConfig.value}`,
              label: nextStageConfig.label,
              onClick: () => updateCandidateStage(profile.company_candidate_id, nextStageConfig.value),
              variant: "primary" as const,
              disabled: statusUpdatingId === profile.company_candidate_id,
            },
          ]
        : [];
    },
    [updateCandidateStage, statusUpdatingId]
  );

  const loadUnlockedCandidates = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const { data: ccRows, error: ccErr } = await supabase
        .from("company_candidates")
        .select(
          `
          id,
          candidate_id,
          stage,
          status,
          unlocked_at,
          match_score,
          source,
          notes,
          linked_job_ids,
          interview_date,
          profiles:candidate_id (
            id,
            vorname,
            nachname,
            email,
            telefon,
            avatar_url,
            ort,
            plz,
            branche,
            status,
            headline,
            faehigkeiten,
            job_search_preferences,
            has_drivers_license,
            cv_url,
            geplanter_abschluss,
            schulbildung,
            available_from,
            visibility_mode
          )
        `
        )
        .eq("company_id", companyId)
        .not("unlocked_at", "is", null)
        .order("unlocked_at", { ascending: false });

      if (ccErr) throw ccErr;

      const allJobIds = new Set<string>();
      (ccRows || []).forEach((cc: Record<string, unknown>) => {
        const linked = cc.linked_job_ids;
        if (Array.isArray(linked)) {
          linked.forEach((id: string) => allJobIds.add(id));
        }
      });

      let jobTitleMap = new Map<string, string>();
      if (allJobIds.size > 0) {
        const { data: jobTitles } = await supabase
          .from("job_posts")
          .select("id, title")
          .in("id", Array.from(allJobIds));
        jobTitleMap = new Map(
          (jobTitles || []).map((j: { id: string; title: string }) => [j.id, j.title])
        );
      }

      const profilesData = (ccRows || [])
        .filter((cc: Record<string, unknown>) => !!cc.profiles)
        .filter((cc: Record<string, unknown>) => {
          if (role !== "recruiter" && role !== "viewer") return true;
          if (!assignedJobIds || assignedJobIds.length === 0) return true;
          const linked = Array.isArray(cc.linked_job_ids) ? cc.linked_job_ids : [];
          return linked.some((id: string) => assignedJobIds.includes(id));
        })
        .map((cc: Record<string, unknown>) => {
          const p = cc.profiles as Record<string, unknown>;
          const linkedIds = (cc.linked_job_ids as string[]) || [];
          return {
            ...p,
            stage: (cc.status || cc.stage) as string,
            company_candidate_id: cc.id,
            unlocked_at: cc.unlocked_at,
            unlock_source: cc.source,
            unlock_notes: cc.notes,
            interview_date: cc.interview_date,
            linkedJobTitles: linkedIds.map((id: string) => ({
              id,
              title: jobTitleMap.get(id) || "Unbekannte Stelle",
            })),
            plz: (p.plz as string) ?? "",
            match_score: cc.match_score,
            schulbildung: parseJsonField(p.schulbildung),
          } as UnlockedCandidate;
        });

      setProfiles(profilesData);
    } catch (e) {
      console.error("Error loading unlocked profiles", e);
    } finally {
      setLoading(false);
    }
  }, [companyId, role, assignedJobIds]);

  useEffect(() => {
    if (!companyId) return;
    if ((role === "recruiter" || role === "viewer") && assignedJobsLoading) return;
    loadUnlockedCandidates();
  }, [loadUnlockedCandidates, companyId, role, assignedJobsLoading]);

  useEffect(() => {
    if (!companyId) return;

    const loadJobs = async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: allJobs } = await supabase
        .from("job_posts")
        .select("id, title, is_active, created_at, updated_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (allJobs) {
        const filteredJobs = allJobs.filter((job) => {
          if (job.is_active) return true;
          if (!job.is_active && job.updated_at) {
            return new Date(job.updated_at) >= threeMonthsAgo;
          }
          return false;
        });

        setAvailableJobs(
          filteredJobs.map((job) => ({
            id: job.id,
            title: job.title,
            is_active: job.is_active ?? false,
          }))
        );
      }
    };

    loadJobs();
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`company-candidates-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "company_candidates",
          filter: `company_id=eq.${companyId}`,
        },
        () => loadUnlockedCandidates()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, loadUnlockedCandidates]);

  useEffect(() => {
    if (!companyId) return;

    const loadViews = async () => {
      try {
        const { data: views } = await supabase
          .from("company_activity")
          .select("payload")
          .eq("company_id", companyId)
          .eq("type", "profile_view")
          .order("created_at", { ascending: false })
          .limit(24);

        const ids = Array.from(
          new Set(
            (views || []).map((v: { payload?: { profile_id?: string } }) => v.payload?.profile_id).filter(Boolean)
          )
        ) as string[];

        if (ids.length) {
          const { data: viewProfiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", ids)
            .limit(12);
          setRecentlyViewed((viewProfiles || []) as UnlockedCandidate[]);
        } else {
          setRecentlyViewed([]);
        }
      } catch (e) {
        console.error("Error loading recently viewed profiles", e);
      }
    };

    loadViews();
  }, [companyId]);

  return {
    profiles,
    recentlyViewed,
    loading,
    availableJobs,
    loadUnlockedCandidates,
    updateCandidateStage,
    statusUpdatingId,
    buildProcessActions,
  };
}
