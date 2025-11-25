import { supabase } from "@/integrations/supabase/client";

export interface PipelineProfileRow {
  id: string;
  vorname: string | null;
  nachname: string | null;
  ort: string | null;
  branche: string | null;
  headline: string | null;
  job_search_preferences: string[] | string | null;
  avatar_url?: string | null;
}

export interface PipelineCandidateRow {
  id: string;
  candidate_id: string;
  job_id?: string | null; // Derived from linked_job_ids[0]
  stage: string | null;
  status: string | null;
  source: string | null;
  match_score: number | null;
  linked_job_ids: string[] | null;
  unlocked_at: string | null;
  updated_at: string | null;
  interview_date: string | null;
  next_action_at: string | null;
  profiles: PipelineProfileRow | null;
}

export interface PipelineSnapshotTotals {
  totalApplications: number;
  newCount: number;
  unlockedCount: number;
  plannedCount: number;
  unlockedProfilesCount: number;
  hiresCount: number;
}

export interface PipelineSnapshot {
  limitPerStage: number;
  newCandidates: PipelineCandidateRow[];
  unlockedCandidates: PipelineCandidateRow[];
  plannedCandidates: PipelineCandidateRow[];
  totals: PipelineSnapshotTotals;
  jobStats: Record<
    string,
    {
      total: number;
      newCount: number;
      unlockedCount: number;
      plannedCount: number;
    }
  >;
}

const DEFAULT_LIMIT_PER_STAGE = 4;

const STATUS_GROUPS: Record<"new" | "unlocked" | "planned", string[]> = {
  new: ["BEWERBUNG_EINGEGANGEN", "NEW"],
  unlocked: ["FREIGESCHALTET"],
  planned: ["INTERVIEW_GEPLANT"],
};

const UNLOCKED_PROFILE_STATUSES = new Set([
  "FREIGESCHALTET",
  "INTERVIEW_GEPLANT",
  "INTERVIEW_DURCHGEFÜHRT",
  "ANGEBOT_GESENDET",
  "EINGESTELLT",
]);

const HIRE_STATUSES = new Set(["EINGESTELLT"]);

export async function fetchPipelineSnapshot(
  companyId: string,
  options: { limitPerStage?: number } = {},
): Promise<PipelineSnapshot> {
  const limitPerStage = options.limitPerStage ?? DEFAULT_LIMIT_PER_STAGE;

  const { data, error } = await supabase
    .from("company_candidates")
    .select(
      `id,
       candidate_id,
       stage,
       status,
       source,
       match_score,
       linked_job_ids,
       unlocked_at,
       updated_at,
       interview_date,
       next_action_at,
       profiles:candidate_id (
         id,
         vorname,
         nachname,
         ort,
         branche,
         headline,
         job_search_preferences,
         avatar_url
       )`
    )
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(120);

  if (error) {
    throw error;
  }

  const candidates = (data as PipelineCandidateRow[]) ?? [];

  // Derive job_id from linked_job_ids for each candidate
  const candidatesWithJobId = candidates.map(candidate => {
    const jobId = candidate.linked_job_ids && Array.isArray(candidate.linked_job_ids) && candidate.linked_job_ids.length > 0
      ? candidate.linked_job_ids[0]
      : null;
    return {
      ...candidate,
      job_id: jobId,
    };
  });

  // For applications (source='bewerbung'), if profile data is missing, fetch it using RPC
  // This ensures we always have profile data for applicants, even if they are invisible
  const candidatesWithMissingProfiles = candidatesWithJobId.filter(
    c => c.source === 'bewerbung' && !c.profiles
  );

  if (candidatesWithMissingProfiles.length > 0) {
    // Fetch profile data using RPC function that bypasses visibility restrictions for applications
    const candidateIds = candidatesWithMissingProfiles.map(c => c.candidate_id);
    
    const { data: profilesData, error: profilesError } = await supabase
      .rpc("get_profiles_for_applications", {
        p_company_id: companyId,
        p_profile_ids: candidateIds,
      });

    if (!profilesError && profilesData) {
      // Create a map of profile id to profile
      const profileMap = new Map<string, PipelineProfileRow>();
      
      profilesData.forEach((profile: any) => {
        if (profile.id) {
          profileMap.set(profile.id, profile);
        }
      });

      // Update candidates with missing profiles
      candidatesWithJobId.forEach(candidate => {
        if (candidate.source === 'bewerbung' && !candidate.profiles) {
          const profile = profileMap.get(candidate.candidate_id);
          if (profile) {
            candidate.profiles = profile;
          }
        }
      });
    }
  }

  const newCandidates: PipelineCandidateRow[] = [];
  const unlockedCandidates: PipelineCandidateRow[] = [];
  const plannedCandidates: PipelineCandidateRow[] = [];

  const jobStatsMap = new Map<
    string,
    {
      total: number;
      newCount: number;
      unlockedCount: number;
      plannedCount: number;
    }
  >();

  const touchJob = (jobId: string | null | undefined) => {
    if (!jobId) return undefined;
    if (!jobStatsMap.has(jobId)) {
      jobStatsMap.set(jobId, {
        total: 0,
        newCount: 0,
        unlockedCount: 0,
        plannedCount: 0,
      });
    }
    return jobStatsMap.get(jobId)!;
  };

  let unlockedProfilesCount = 0;
  let hiresCount = 0;

  candidatesWithJobId.forEach(candidate => {
    const status = candidate.status ?? "";
    const stage = candidate.stage ?? "";

    // Check for new applications: either status matches or stage is 'new' with source='bewerbung'
    const isNewApplication = STATUS_GROUPS.new.includes(status) || 
                            (stage === 'new' && candidate.source === 'bewerbung');

    if (isNewApplication) {
      newCandidates.push(candidate);
      const stats = touchJob(candidate.job_id);
      if (stats) {
        stats.newCount += 1;
        stats.total += 1;
      }
    }

    if (STATUS_GROUPS.unlocked.includes(status)) {
      unlockedCandidates.push(candidate);
      const stats = touchJob(candidate.job_id);
      if (stats) {
        stats.unlockedCount += 1;
        stats.total += 1;
      }
    }

    if (STATUS_GROUPS.planned.includes(status)) {
      plannedCandidates.push(candidate);
      const stats = touchJob(candidate.job_id);
      if (stats) {
        stats.plannedCount += 1;
        stats.total += 1;
      }
    }

    if (candidate.job_id) {
      const stats = touchJob(candidate.job_id);
      if (stats && !STATUS_GROUPS.new.includes(status) && !STATUS_GROUPS.unlocked.includes(status) && !STATUS_GROUPS.planned.includes(status)) {
        stats.total += 1;
      }
    }

    if (UNLOCKED_PROFILE_STATUSES.has(status)) {
      unlockedProfilesCount += 1;
    }

    if (HIRE_STATUSES.has(status)) {
      hiresCount += 1;
    }
  });

  return {
    limitPerStage,
    newCandidates: newCandidates.slice(0, limitPerStage),
    unlockedCandidates: unlockedCandidates.slice(0, limitPerStage),
    plannedCandidates: plannedCandidates.slice(0, limitPerStage),
    totals: {
      totalApplications: candidatesWithJobId.length,
      newCount: newCandidates.length,
      unlockedCount: unlockedCandidates.length,
      plannedCount: plannedCandidates.length,
      unlockedProfilesCount,
      hiresCount,
    },
    jobStats: Object.fromEntries(jobStatsMap.entries()),
  };
}
