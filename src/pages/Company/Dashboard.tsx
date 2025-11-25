import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useRealtime } from "@/hooks/useRealtime";
import { StatsGrid, type DashboardCounts } from "@/components/recruiter-dashboard/StatsGrid";
import { PipelineTabs } from "@/components/recruiter-dashboard/PipelineTabs";
import {
  CandidateList,
  type CandidateListItem,
} from "@/components/recruiter-dashboard/CandidateList";
import { JobHighlights, type JobHighlightItem } from "@/components/recruiter-dashboard/JobHighlights";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { changeCandidateStatus } from "@/lib/api/candidates";
import type { ApplicationStatus } from "@/utils/applicationStatus";
import { setApplicationStatus } from "@/lib/api/applications";
import { TopRightQuickActions } from "@/components/company/TopRightQuickActions";
import { fetchPipelineSnapshot, type PipelineCandidateRow } from "@/lib/api/pipeline";
import { PlanSelector } from "@/components/Company/onboarding/PlanSelector";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { TokenPurchaseModalV2 } from "@/components/billing-v2/TokenPurchaseModalV2";
import { PurchaseSuccessModal } from "@/components/modals/PurchaseSuccessModal";
import { useSearchParams } from "react-router-dom";
import { getStripeSession } from "@/lib/api/stripe-session";
import { TOKEN_PACKS } from "@/lib/billing-v2/stripe-prices";
import type { PlanKey } from "@/lib/billing-v2/plans";

type ListState = {
  items: CandidateListItem[];
  loading: boolean;
  hasMore: boolean;
};

type JobState = {
  items: JobHighlightItem[];
  loading: boolean;
};

type CommunityPost = {
  id: string;
  title: string;
  topic: string | null;
};

type JobRow = {
  id: string;
  title: string;
  city?: string | null; // From job_posts table
  location: string | null; // Mapped from city for compatibility
  status: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type JobPostRow = {
  id: string;
  title: string;
  location: string | null;
  status: string | null;
  is_active: boolean | null;
  applications_count: number | null;
  created_at: string | null;
};

const PAGE_SIZE = 10;
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

const INITIAL_LIST_STATE: ListState = {
  items: [],
  loading: false,
  hasMore: false,
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

const FEATURE_BILLING_V2 = import.meta.env.NEXT_PUBLIC_FEATURE_BILLING_V2 === "1";

type StageKey = "new" | "unlocked" | "planned";

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

function CommunitySpotlight({ posts }: { posts: CommunityPost[] }) {
  const spotlightPosts = posts.length
    ? posts.slice(0, 3).map(post => ({
        title: post.title,
        context: post.topic ?? "Community",
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

function formatSeeking(value: string[] | string | null | undefined) {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return value.join(", ");
  }
  return value;
}

function toCandidateItem(
  candidate: PipelineCandidateRow,
  job: JobRow | undefined,
): CandidateListItem {
  const profile = candidate.profiles;
  const badge = STAGE_BADGES[candidate.status ?? ""];
  
  // Check if this is from an application (source_need_id or linked_job_ids indicates application)
  const isFromApplication = candidate.source === "bewerbung" || (candidate.linked_job_ids && Array.isArray(candidate.linked_job_ids) && candidate.linked_job_ids.length > 0);
  
  // Check if unlocked (for applications, check unlocked_at; for others, check status)
  const isUnlocked = isFromApplication 
    ? !!candidate.unlocked_at 
    : (candidate.status && ["FREIGESCHALTET", "INTERVIEW_GEPLANT", "INTERVIEW_DURCHGEFÜHRT", "ANGEBOT_GESENDET", "EINGESTELLT"].includes(candidate.status));
  
  // Locked state: nur Vorname, unlocked: vollständiger Name
  const displayName = isUnlocked
    ? (profile
        ? `${profile.vorname ?? ""} ${profile.nachname ?? ""}`.trim() || "Unbekannt"
        : "Unbekannt")
    : (profile?.vorname ?? "Kandidat");

  return {
    id: candidate.id,
    candidateId: profile?.id ?? candidate.candidate_id,
    jobCandidateId: candidate.id,
    jobId: candidate.job_id ?? null,
    applicationId: isFromApplication ? candidate.id : null, // Use candidate.id as applicationId if from application
    name: displayName,
    city: profile?.ort ?? undefined,
    origin: candidate.source ?? undefined,
    completeness: candidate.match_score != null ? Math.min(100, Math.max(30, candidate.match_score)) : 65,
    headline: profile?.headline ?? profile?.branche ?? undefined,
    seeking: formatSeeking(profile?.job_search_preferences),
    plannedAt: candidate.status === "INTERVIEW_GEPLANT" 
      ? (candidate.interview_date ?? candidate.next_action_at ?? candidate.updated_at ?? undefined)
      : undefined,
    jobTitle: job?.title ?? undefined,
    badgeLabel: badge.label,
    badgeTone: badge.tone,
    avatarUrl: isUnlocked ? (profile?.avatar_url ?? undefined) : undefined, // Only show avatar if unlocked
    isUnlocked, // Pass unlock status to card
  };
}

function StageSection({
  title,
  subtitle,
  count,
  children,
  onViewAll,
}: {
  title: string;
  subtitle: string;
  count: number;
  children: ReactNode;
  onViewAll?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{count}</span>
          {onViewAll && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs whitespace-nowrap"
              onClick={onViewAll}
            >
              Alle anzeigen
            </Button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}


export default function CompanyDashboard() {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { company, refetch: refetchCompany } = useCompany();

  const [counts, setCounts] = useState<DashboardCounts>(DEFAULT_COUNTS);
  const [pipeline, setPipeline] = useState<PipelineCounts>(DEFAULT_PIPELINE);
  const [countsLoading, setCountsLoading] = useState(true);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<StageKey>(() => {
    if (typeof window !== "undefined") {
      const focus = sessionStorage.getItem("company-dashboard-focus");
      if (focus === "new" || focus === "unlocked" || focus === "planned") {
        sessionStorage.removeItem("company-dashboard-focus");
        return focus;
      }
    }
    return "new";
  });
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const [newList, setNewList] = useState<ListState>(INITIAL_LIST_STATE);
  const [unlockedList, setUnlockedList] = useState<ListState>(INITIAL_LIST_STATE);
  const [plannedList, setPlannedList] = useState<ListState>(INITIAL_LIST_STATE);

  const [jobsState, setJobsState] = useState<JobState>({ items: [], loading: true });
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTokenPurchaseModal, setShowTokenPurchaseModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    type: "tokens" | "plan";
    tokenAmount?: number;
    planKey?: PlanKey;
  }>({ open: false, type: "tokens" });

  const pipelineCardRef = useRef<HTMLDivElement | null>(null);

  const scrollToStage = useCallback((stage: StageKey) => {
    setActiveStage(stage);
    if (pipelineCardRef.current) {
      pipelineCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      sessionStorage.setItem("company-dashboard-focus", stage);
    }
  }, []);

  const handleStageChange = useCallback((stage: StageKey) => {
    setActiveStage(stage);
    if (pipelineCardRef.current) {
      pipelineCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Handle purchase success from URL
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !companyId) return;

    const handlePurchaseSuccess = async () => {
      try {
        // Get Stripe session details
        const session = await getStripeSession(sessionId);
        if (!session || session.payment_status !== "paid") {
          console.warn("Payment not completed or session not found");
          return;
        }

        const metadata = session.metadata || {};
        const kind = metadata.kind; // 'tokens' or 'plan'
        const packageId = metadata.packageId;
        const plan = metadata.plan as PlanKey | undefined;

        // Trigger token grant or plan activation
        if (kind === "tokens" && packageId) {
          const tokenAmount = TOKEN_PACKS[packageId as keyof typeof TOKEN_PACKS]?.amount || 0;
          
          // Directly add tokens (fallback if webhook didn't fire)
          if (tokenAmount > 0) {
            const { data: companyData } = await supabase
              .from("companies")
              .select("active_tokens")
              .eq("id", companyId)
              .single();

            const currentTokens = companyData?.active_tokens || 0;
            await supabase
              .from("companies")
              .update({ active_tokens: currentTokens + tokenAmount })
              .eq("id", companyId);
            
            // Refetch company data to update sidebar immediately
            await refetchCompany();
          }

          setSuccessModal({
            open: true,
            type: "tokens",
            tokenAmount,
          });
        } else if (kind === "plan" && plan) {
          // Get subscription from session
          const subscriptionId = session.subscription || session.metadata?.subscriptionId;
          
          if (subscriptionId) {
            // Activate subscription via RPC (fallback if webhook didn't fire)
            const interval = (metadata.interval || "month") as "month" | "year";
            
            // Get subscription details from Stripe to get period dates
            try {
              const { data: subscriptionData } = await supabase.functions.invoke('get-stripe-subscription', {
                body: { subscriptionId },
              });

              if (subscriptionData) {
                await supabase.rpc("activate_subscription", {
                  p_company_id: companyId,
                  p_stripe_subscription_id: subscriptionId,
                  p_stripe_customer_id: session.metadata?.customerId || "",
                  p_plan_key: plan,
                  p_interval: interval,
                  p_current_period_start: subscriptionData.current_period_start || new Date().toISOString(),
                  p_current_period_end: subscriptionData.current_period_end || new Date(Date.now() + (interval === "year" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
                });
                
                // Refetch company data to update sidebar immediately
                await refetchCompany();
              }
            } catch (error) {
              console.error("Error activating subscription:", error);
              // Continue to show success modal even if activation fails
            }
          }

          setSuccessModal({
            open: true,
            type: "plan",
            planKey: plan,
          });
        }

        // Remove session_id from URL
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("session_id");
        setSearchParams(newParams, { replace: true });
      } catch (error) {
        console.error("Error handling purchase success:", error);
      }
    };

    handlePurchaseSuccess();
  }, [searchParams, companyId, setSearchParams]);

  const loadDashboardSnapshot = useCallback(async () => {
    if (!companyId) {
      console.warn("Dashboard: No companyId available");
      return;
    }

    console.log("Dashboard: Loading snapshot for companyId:", companyId);
    setCountsLoading(true);
    setPipelineLoading(true);
    setNewList(prev => ({ ...prev, loading: true }));
    setUnlockedList(prev => ({ ...prev, loading: true }));
    setPlannedList(prev => ({ ...prev, loading: true }));
    setJobsState(prev => ({ ...prev, loading: true }));

    try {
      console.log("Dashboard: Starting to load pipeline snapshot...");
      const pipelineSnapshot = await fetchPipelineSnapshot(companyId, { limitPerStage: 6 });
      console.log("Dashboard: Pipeline snapshot loaded successfully", pipelineSnapshot);

      const jobIds = new Set(
        [
          ...pipelineSnapshot.newCandidates,
          ...pipelineSnapshot.unlockedCandidates,
          ...pipelineSnapshot.plannedCandidates,
        ]
          .map(candidate => candidate.job_id)
          .filter((id): id is string => Boolean(id)),
      );

      console.log("Dashboard: Fetching job posts and community posts...");
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

      if (jobResult.error) {
        console.error("Dashboard: Error fetching job_posts", jobResult.error);
        throw jobResult.error;
      }
      if (communityResult.error) {
        console.error("Dashboard: Error fetching community_posts", communityResult.error);
        // Don't throw for community posts, just log
        console.warn("Dashboard: Community posts unavailable", communityResult.error.message);
      }

      const jobPosts = (jobResult.data as JobRow[]) || [];
      console.log("Dashboard: Loaded job posts", jobPosts.length);

      const jobMap = new Map<string, JobRow>();
      jobPosts.forEach(job => jobMap.set(job.id, {
        ...job,
        location: job.city ?? null, // Map city to location for compatibility
      }));

      const newCandidates: CandidateListItem[] = pipelineSnapshot.newCandidates.map(candidate =>
        toCandidateItem(candidate, candidate.job_id ? jobMap.get(candidate.job_id) : undefined),
      );
      const unlockedCandidates: CandidateListItem[] = pipelineSnapshot.unlockedCandidates.map(candidate =>
        toCandidateItem(candidate, candidate.job_id ? jobMap.get(candidate.job_id) : undefined),
      );
      const plannedCandidates: CandidateListItem[] = pipelineSnapshot.plannedCandidates.map(candidate =>
        toCandidateItem(candidate, candidate.job_id ? jobMap.get(candidate.job_id) : undefined),
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

      // Use SQL functions for accurate, real-time metrics
      console.log("Dashboard: Calling RPC with companyId:", companyId);
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_company_dashboard_metrics', { p_company_id: companyId });
      
      if (metricsError) {
        console.error("Dashboard metrics RPC error:", metricsError);
        console.error("RPC error details:", JSON.stringify(metricsError, null, 2));
      }

      // Log metrics data for debugging
      if (metricsData) {
        console.log("Dashboard metrics from RPC (raw):", metricsData);
        console.log("Dashboard metrics from RPC (stringified):", JSON.stringify(metricsData, null, 2));
      } else {
        console.warn("No metrics data returned from RPC, using fallback");
      }

      // Parse metricsData if it's a string (sometimes Supabase returns JSONB as string)
      let parsedMetrics = metricsData;
      if (typeof metricsData === 'string') {
        try {
          parsedMetrics = JSON.parse(metricsData);
          console.log("Parsed metricsData from string:", parsedMetrics);
        } catch (e) {
          console.error("Failed to parse metricsData as JSON:", e);
        }
      }

      // Fallback to pipeline snapshot if RPC fails, otherwise use SQL metrics
      const metrics = parsedMetrics || {
        active_jobs: jobPosts.filter(job => {
          const status = (job.status ?? "").toLowerCase();
          return ACTIVE_JOB_STATUSES.has(status) && job.is_active !== false;
        }).length,
        applications_total: pipelineSnapshot.totals.totalApplications,
        interviews_planned: pipelineSnapshot.totals.plannedCount,
        hires_total: pipelineSnapshot.totals.hiresCount,
        unlocked_profiles: pipelineSnapshot.totals.unlockedProfilesCount,
        seats_used: 0,
      };

      console.log("Final metrics object being used:", metrics);

      const { count: seatsCount, error: seatsError } = await supabase
        .from("company_users")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .not("accepted_at", "is", null);
      if (seatsError) console.warn("company_users count unavailable", seatsError.message);
      
      // Use metrics.seats_used if available, otherwise fallback to count query
      const seatsUsed = metrics?.seats_used ?? seatsCount ?? company?.seats ?? 0;

      const finalCounts = {
        active_jobs: Number(metrics?.active_jobs) || 0,
        applications_total: Number(metrics?.applications_total) || 0,
        interviews_planned: Number(metrics?.interviews_planned) || 0,
        hires_total: Number(metrics?.hires_total) || 0,
        unlocked_profiles: Number(metrics?.unlocked_profiles) || 0,
        seats_used: Number(seatsUsed),
        seats_total: company?.seat_limit ?? 5,
      };

      console.log("Setting counts to:", finalCounts);

      setCounts(finalCounts);

      setPipeline({
        new_apps: pipelineSnapshot.totals.newCount,
        unlocked_and_plan: pipelineSnapshot.totals.unlockedCount,
        interviews_planned: pipelineSnapshot.totals.plannedCount,
      });

      setJobsState({
        items: jobPosts
          .filter(job => {
            const status = (job.status ?? "").toLowerCase();
            return ACTIVE_JOB_STATUSES.has(status) && job.is_active !== false;
          })
          .slice(0, 4)
          .map(job => ({
            job_id: job.id,
            title: job.title,
            location: job.location,
            created_at: job.created_at,
            applicants_count: pipelineSnapshot.jobStats[job.id]?.total ?? 0,
          })),
        loading: false,
      });

      if (!communityResult.error) {
        setCommunityPosts((communityResult.data as CommunityPost[]) || []);
      }
    } catch (error) {
      console.error("Dashboard konnte nicht geladen werden", error);
      console.error("Dashboard error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error,
      });
      toast.error("Dashboard-Daten konnten nicht geladen werden.");
      setJobsState(prev => ({ ...prev, loading: false }));
      setNewList(prev => ({ ...prev, loading: false }));
      setUnlockedList(prev => ({ ...prev, loading: false }));
      setPlannedList(prev => ({ ...prev, loading: false }));
    } finally {
      setCountsLoading(false);
      setPipelineLoading(false);
    }
  }, [company?.seat_limit, company?.seats, companyId]);

  useEffect(() => {
    if (companyId) {
      loadDashboardSnapshot();
    }
  }, [companyId, loadDashboardSnapshot]);

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
    [handleRealtimeUpdate],
  );

  useEffect(() => {
    const timer = setInterval(() => handleRealtimeUpdate(), 60_000);
    return () => clearInterval(timer);
  }, [handleRealtimeUpdate]);

  const handleUnlockCandidate = useCallback(
    async (candidate: CandidateListItem) => {
      if (!companyId) return;
      setPendingActionId(candidate.id);
      try {
        await changeCandidateStatus({
          companyCandidateId: candidate.jobCandidateId,
          nextStatus: "FREIGESCHALTET",
        });
        toast.success(`${candidate.name} wurde freigeschaltet.`);
        loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Freischalten fehlgeschlagen.");
      } finally {
        setPendingActionId(null);
      }
    },
    [companyId, loadDashboardSnapshot],
  );

  const updateApplicationStatus = useCallback(
    async (applicationId: string, newStatus: ApplicationStatus, successMessage: string) => {
      try {
        await setApplicationStatus({ applicationId, newStatus });
        toast.success(successMessage);
        loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Aktion fehlgeschlagen.");
      }
    },
    [loadDashboardSnapshot],
  );

  const handleAssignApplication = useCallback(
    async (candidate: CandidateListItem) => {
      if (!companyId || !candidate.candidateId) return;
      setPendingActionId(candidate.id);
      try {
        // Find application_id if not provided
        // candidate.candidateId is profiles.id, we need to find candidates.id first
        let applicationId = candidate.applicationId;
        let candidateData: { id: string } | null = null;
        
        if (!applicationId) {
          console.log("Finding application for candidate:", {
            candidateId: candidate.candidateId,
            companyId,
            jobId: candidate.jobId,
            origin: candidate.origin
          });

          // First, find candidates.id from profiles.id (candidate.candidateId)
          const { data: candidateDataResult, error: candidateError } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", candidate.candidateId)
            .maybeSingle();
          
          if (candidateError) {
            console.error("Error finding candidate:", candidateError);
            throw new Error("Candidate not found");
          }
          
          if (!candidateDataResult) {
            console.error("Candidate data not found for user_id:", candidate.candidateId);
            throw new Error("Candidate not found");
          }
          
          candidateData = candidateDataResult;
          console.log("Found candidate.id:", candidateData.id);

          // Now find applications.id using candidates.id and company_id
          // Try with job_id first if available, then without
          let appQuery = supabase
            .from("applications")
            .select("id, job_id, status, source")
            .eq("company_id", companyId)
            .eq("candidate_id", candidateData.id);
          
          if (candidate.jobId) {
            appQuery = appQuery.eq("job_id", candidate.jobId);
          }
          
          const { data: appData, error: appError } = await appQuery.maybeSingle();
          
          if (appError) {
            console.error("Error finding application:", appError);
            // Try without job_id filter if we had one
            if (candidate.jobId) {
              console.log("Retrying without job_id filter...");
              const { data: appDataRetry, error: appErrorRetry } = await supabase
                .from("applications")
                .select("id, job_id, status, source")
                .eq("company_id", companyId)
                .eq("candidate_id", candidateData.id)
                .maybeSingle();
              
              if (appErrorRetry) {
                console.error("Error finding application (retry):", appErrorRetry);
                // Don't throw yet, try unlock_candidate fallback
              } else if (appDataRetry) {
                console.log("Found application (without job_id):", appDataRetry);
                applicationId = appDataRetry.id;
              }
            }
          } else if (appData) {
            console.log("Found application:", appData);
            applicationId = appData.id;
          }
        }

        // If applicationId still not found, try using unlock_candidate RPC which creates application if needed
        // But first we need candidates.id (not profiles.id)
        if (!applicationId && candidate.origin === "bewerbung") {
          // If we don't have candidateData yet, find it
          if (!candidateData) {
            const { data: candidateDataResult, error: candidateError } = await supabase
              .from("candidates")
              .select("id")
              .eq("user_id", candidate.candidateId)
              .maybeSingle();
            
            if (candidateError || !candidateDataResult) {
              console.error("Cannot find candidate for unlock_candidate fallback");
              throw new Error("Candidate not found");
            }
            
            candidateData = candidateDataResult;
          }
          console.log("Application not found, trying unlock_candidate RPC...");
          try {
            const { data: unlockData, error: unlockError } = await supabase.rpc("unlock_candidate", {
              _company_id: companyId,
              _candidate_id: candidateData.id, // candidates.id, not profiles.id
              _job_id: candidate.jobId || null,
            });

            if (unlockError) {
              console.error("Error unlocking candidate:", unlockError);
              throw unlockError;
            }

            if (unlockData?.application_id) {
              applicationId = unlockData.application_id;
              console.log("Got application_id from unlock_candidate:", applicationId);
            } else {
              // unlock_candidate might have already set status to unlocked, try finding it again
              const { data: appDataRetry, error: appErrorRetry } = await supabase
                .from("applications")
                .select("id")
                .eq("company_id", companyId)
                .eq("candidate_id", candidateData.id)
                .maybeSingle();
              
              if (!appErrorRetry && appDataRetry) {
                applicationId = appDataRetry.id;
                console.log("Found application after unlock_candidate:", applicationId);
              } else {
                throw new Error("unlock_candidate did not create application");
              }
            }
          } catch (unlockErr) {
            console.error("Failed to unlock candidate:", unlockErr);
            throw new Error("Could not find or create application");
          }
        }

        if (!applicationId) {
          throw new Error("Application ID not found");
        }

        // If jobId exists, update job assignment
        if (candidate.jobId) {
          const { error: updateError } = await supabase.rpc(
            "update_candidate_job_assignment",
            {
              p_company_id: companyId,
              p_candidate_id: candidate.candidateId,
              p_linked_job_ids: [candidate.jobId] as any, // JSONB array
              p_notes: null,
            }
          );

          if (updateError) {
            console.error("Error updating job assignment:", updateError);
            // Continue anyway to update application status
          }
        }

        // Set application status to "unlocked" to move to next phase
        // Only if we didn't already unlock via unlock_candidate RPC
        if (applicationId) {
          await setApplicationStatus({ 
            applicationId: applicationId, 
            newStatus: "unlocked" 
          });
        }
        
        const jobTitleText = candidate.jobTitle ? ` für die Stelle "${candidate.jobTitle}"` : "";
        toast.success(`Bewerbung wurde${jobTitleText} angenommen und ist jetzt aktiv.`);
        loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Bewerbung konnte nicht angenommen werden.");
      } finally {
        setPendingActionId(null);
      }
    },
    [companyId, loadDashboardSnapshot],
  );

  const handlePlanInterview = useCallback(
    async (
      candidate: CandidateListItem,
      plannedAtIso: string,
      interviewType: "vor_ort" | "online",
      locationAddress?: string,
      companyMessage?: string,
    ) => {
      if (!candidate.jobCandidateId) return;
      setPendingActionId(candidate.id);
      try {
        const { createInterviewRequest } = await import("@/lib/api/interview-requests");
        await createInterviewRequest({
          companyCandidateId: candidate.jobCandidateId,
          interviewType,
          plannedAt: plannedAtIso,
          locationAddress,
          companyMessage,
        });
        toast.success("Interview-Anfrage wurde an den Kandidaten gesendet.");
        loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Interview-Anfrage konnte nicht gesendet werden.");
      } finally {
        setPendingActionId(null);
      }
    },
    [loadDashboardSnapshot],
  );

  const handleCompleteInterview = useCallback(
    async (candidate: CandidateListItem, completedAtIso?: string) => {
      if (!candidate.jobCandidateId) return;
      setPendingActionId(candidate.id);
      try {
        await changeCandidateStatus({
          companyCandidateId: candidate.jobCandidateId,
          nextStatus: "INTERVIEW_DURCHGEFÜHRT",
          meta: completedAtIso ? { interview_date: completedAtIso } : { interview_date: new Date().toISOString() },
        });
        toast.success("Interview dokumentiert.");
        loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Interview konnte nicht dokumentiert werden.");
      } finally {
        setPendingActionId(null);
      }
    },
    [loadDashboardSnapshot],
  );

  const handleCancelCandidate = useCallback(
    async (candidate: CandidateListItem) => {
      if (!candidate.jobCandidateId) return;
      setPendingActionId(candidate.id);
      try {
        await changeCandidateStatus({
          companyCandidateId: candidate.jobCandidateId,
          nextStatus: "ABGESAGT",
        });
        toast.success("Kandidat abgesagt.");
        loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Absage fehlgeschlagen.");
      } finally {
        setPendingActionId(null);
      }
    },
    [loadDashboardSnapshot],
  );

  const handleRejectCandidate = useCallback(
    async (candidate: CandidateListItem) => {
      if (!candidate.jobCandidateId) return;
      setPendingActionId(candidate.id);
      try {
        await changeCandidateStatus({
          companyCandidateId: candidate.jobCandidateId,
          nextStatus: "ABGELEHNT",
        });
        toast.success("Kandidat als unpassend markiert.");
        loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Aktion fehlgeschlagen.");
      } finally {
        setPendingActionId(null);
      }
    },
    [loadDashboardSnapshot],
  );

  const handleViewProfile = useCallback(
    (candidateId: string) => {
      navigate(`/company/profile/${candidateId}`, {
        state: {
          from: { pathname: "/company/dashboard", search: "" },
          label: "Dashboard",
        },
      });
    },
    [navigate],
  );

  const handleViewAll = useCallback(
    (stage?: "new" | "unlocked" | "planned") => {
      // Map stage to status filter
      let statusFilter: string[] = [];
      if (stage === "new") {
        statusFilter = ["BEWERBUNG_EINGEGANGEN", "NEW"];
      } else if (stage === "unlocked") {
        statusFilter = ["FREIGESCHALTET"];
      } else if (stage === "planned") {
        statusFilter = ["INTERVIEW_GEPLANT"];
      }

      navigate("/company/unlocked", {
        state: {
          from: { pathname: "/company/dashboard", search: "" },
          label: "Dashboard",
          initialStageFilters: statusFilter,
        },
      });
    },
    [navigate],
  );

  const handleDownloadCV = useCallback(
    async (candidateId: string) => {
      try {
        // Load full profile data
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", candidateId)
          .single();

        if (error || !profile) {
          toast.error("Profil nicht gefunden.");
          return;
        }

        // Check if profile is unlocked
        const { data: companyCandidate } = await supabase
          .from("company_candidates")
          .select("id, status")
          .eq("company_id", companyId)
          .eq("candidate_id", candidateId)
          .maybeSingle();

        const isUnlocked = companyCandidate && ["FREIGESCHALTET", "INTERVIEW_GEPLANT", "INTERVIEW_DURCHGEFÜHRT", "ANGEBOT_GESENDET", "EINGESTELLT"].includes(companyCandidate.status);

        if (!isUnlocked) {
          toast.error("Profil muss freigeschaltet sein, um den CV herunterzuladen.");
          return;
        }

        // Create temporary container for CV rendering
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "fixed";
        tempContainer.style.left = "-10000px";
        tempContainer.style.top = "0";
        tempContainer.style.width = "794px";
        tempContainer.style.height = "1123px";
        tempContainer.style.backgroundColor = "white";
        document.body.appendChild(tempContainer);

        // Import CV layouts dynamically
        const BerlinLayout = (await import("@/components/cv-layouts/BerlinLayout")).default;
        const MuenchenLayout = (await import("@/components/cv-layouts/MuenchenLayout")).default;
        const HamburgLayout = (await import("@/components/cv-layouts/HamburgLayout")).default;
        const KoelnLayout = (await import("@/components/cv-layouts/KoelnLayout")).default;
        const FrankfurtLayout = (await import("@/components/cv-layouts/FrankfurtLayout")).default;
        const DuesseldorfLayout = (await import("@/components/cv-layouts/DuesseldorfLayout")).default;
        const StuttgartLayout = (await import("@/components/cv-layouts/StuttgartLayout")).default;
        const DresdenLayout = (await import("@/components/cv-layouts/DresdenLayout")).default;
        const LeipzigLayout = (await import("@/components/cv-layouts/LeipzigLayout")).default;

        const layoutId = profile.layout || 1;
        let LayoutComponent = BerlinLayout;

        switch (layoutId) {
          case 2:
            LayoutComponent = MuenchenLayout;
            break;
          case 3:
            LayoutComponent = HamburgLayout;
            break;
          case 4:
            LayoutComponent = KoelnLayout;
            break;
          case 5:
            LayoutComponent = FrankfurtLayout;
            break;
          case 6:
            LayoutComponent = DuesseldorfLayout;
            break;
          case 7:
            LayoutComponent = StuttgartLayout;
            break;
          case 8:
            LayoutComponent = DresdenLayout;
            break;
          case 9:
            LayoutComponent = LeipzigLayout;
            break;
          default:
            LayoutComponent = BerlinLayout;
        }

        const getJobTitle = () => {
          if (profile.status === "azubi" && profile.ausbildungsberuf) {
            return `${profile.ausbildungsberuf} (Azubi)`;
          }
          if (profile.status === "schueler" && profile.schule) {
            return profile.schule;
          }
          if (profile.status === "ausgelernt" && profile.aktueller_beruf) {
            return profile.aktueller_beruf;
          }
          return profile.headline || profile.branche;
        };

        // Prepare CV data
        const cvData = {
          vorname: profile.vorname,
          nachname: profile.nachname,
          email: profile.email || "",
          telefon: profile.telefon || "",
          adresse: `${profile.ort || ""}, ${profile.plz || ""}`,
          geburtsdatum: profile.geburtsdatum || "",
          headline: getJobTitle(),
          uebermich: profile.headline || `${profile.status} in ${profile.branche}`,
          berufserfahrung: profile.berufserfahrung || [],
          ausbildung: profile.ausbildung || [],
          faehigkeiten: profile.faehigkeiten || [],
          sprachen: profile.sprachen || [],
          zertifikate: profile.zertifikate || [],
          layout: layoutId,
        };

        // Create and render CV element
        const React = await import("react");
        const ReactDOM = await import("react-dom/client");

        const cvElement = React.createElement(LayoutComponent, { data: cvData });
        const root = ReactDOM.createRoot(tempContainer);
        root.render(cvElement);

        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Find the CV preview element
        const cvPreviewElement = tempContainer.querySelector("[data-cv-preview]") as HTMLElement;
        if (!cvPreviewElement) {
          throw new Error("CV preview element not found");
        }

        // Generate filename and PDF
        const { generatePDF, generateCVFilename } = await import("@/lib/pdf-generator");
        const filename = generateCVFilename(profile.vorname, profile.nachname);

        // Generate PDF for download
        await generatePDF(cvPreviewElement, {
          filename,
          quality: 2,
          format: "a4",
          margin: 10,
        });

        // Clean up
        document.body.removeChild(tempContainer);
        root.unmount();

        toast.success("CV wird heruntergeladen");
      } catch (error) {
        console.error("Error downloading CV:", error);
        toast.error("Fehler beim Herunterladen des CVs");
      }
    },
    [companyId],
  );

  const renderStageList = (stage: StageKey) => {
    switch (stage) {
      case "new":
        return (
          <StageSection
            title="Neue Bewerbungen"
            subtitle="Frisch eingetroffen und noch unbearbeitet"
            count={pipeline.new_apps}
            onViewAll={() => handleViewAll("new")}
          >
            <CandidateList
              items={newList.items}
              loading={pipelineLoading || newList.loading}
              variant="new"
              primaryActionFactory={candidate => {
                // Check if this is an application that is already unlocked
                const isApplication = candidate.origin === "bewerbung" || candidate.applicationId;
                const isAlreadyUnlocked = candidate.isUnlocked;
                
                if (isApplication && isAlreadyUnlocked) {
                  // Show "Annehmen" button for already unlocked applications
                  return {
                    type: "instant",
                    label: "Annehmen",
                    loading: pendingActionId === candidate.id,
                    onConfirm: () => handleAssignApplication(candidate),
                    disabled: false,
                  };
                } else {
                  // Show unlock button for locked applications or non-applications
                  return {
                    type: "instant",
                    label: candidate.isUnlocked ? "Bereits freigeschaltet" : "Freischalten (1 Token)",
                    loading: pendingActionId === candidate.id,
                    onConfirm: () => handleUnlockCandidate(candidate),
                    disabled: candidate.isUnlocked,
                  };
                }
              }}
              rejectActionFactory={candidate => {
                const isApplication = candidate.origin === "bewerbung" || candidate.applicationId;
                return {
                  label: isApplication ? "Ablehnen" : "Unpassend",
                  variant: "outline",
                  loading: pendingActionId === candidate.id,
                  onClick: () => handleRejectCandidate(candidate),
                };
              }}
              onViewProfile={handleViewProfile}
              onDownloadCv={handleDownloadCV}
              hasMore={false}
            />
          </StageSection>
        );
      case "unlocked":
        return (
          <StageSection
            title="Freigeschaltet · Termin planen"
            subtitle="Profile mit Zugriff – jetzt Interviews terminieren"
            count={pipeline.unlocked_and_plan}
            onViewAll={() => handleViewAll("unlocked")}
          >
            <CandidateList
              items={unlockedList.items}
              loading={pipelineLoading || unlockedList.loading}
              variant="unlocked"
              primaryActionFactory={candidate => ({
                type: "plan",
                label: "Interview planen",
                loading: pendingActionId === candidate.id,
                onConfirm: (plannedAt, interviewType, locationAddress, companyMessage) => 
                  handlePlanInterview(candidate, plannedAt, interviewType, locationAddress, companyMessage),
              })}
              secondaryActionFactory={candidate => ({
                label: "Absagen",
                variant: "outline",
                loading: pendingActionId === candidate.id,
                onClick: () => handleCancelCandidate(candidate),
              })}
              rejectActionFactory={candidate => {
                const isApplication = candidate.origin === "bewerbung" || candidate.applicationId;
                return {
                  label: isApplication ? "Ablehnen" : "Unpassend",
                  variant: "outline",
                  loading: pendingActionId === candidate.id,
                  onClick: () => handleRejectCandidate(candidate),
                };
              }}
              onViewProfile={handleViewProfile}
              onDownloadCv={handleDownloadCV}
              hasMore={false}
            />
          </StageSection>
        );
      case "planned":
        return (
          <StageSection
            title="Geplante Interviews"
            subtitle="Termine stehen – Nachbereitung im Blick behalten"
            count={pipeline.interviews_planned}
            onViewAll={() => handleViewAll("planned")}
          >
            <CandidateList
              items={plannedList.items}
              loading={pipelineLoading || plannedList.loading}
              variant="planned"
              primaryActionFactory={candidate => ({
                type: "plan",
                label: "Interview planen",
                loading: pendingActionId === candidate.id,
                onConfirm: (plannedAt, interviewType, locationAddress, companyMessage) => 
                  handlePlanInterview(candidate, plannedAt, interviewType, locationAddress, companyMessage),
              })}
              secondaryActionFactory={candidate => ({
                label: "Absagen",
                variant: "outline",
                loading: pendingActionId === candidate.id,
                onClick: () => handleCancelCandidate(candidate),
              })}
              rejectActionFactory={candidate => {
                const isApplication = candidate.origin === "bewerbung" || candidate.applicationId;
                return {
                  label: isApplication ? "Ablehnen" : "Unpassend",
                  variant: "outline",
                  loading: pendingActionId === candidate.id,
                  onClick: () => handleRejectCandidate(candidate),
                };
              }}
              onViewProfile={handleViewProfile}
              onDownloadCv={handleDownloadCV}
              hasMore={false}
            />
          </StageSection>
        );
      default:
        return null;
    }
  };

  return (
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
                newApplicationsCount={pipeline.new_apps}
                onPostJob={() => navigate("/company/jobs/new")}
                onReviewApplications={() => scrollToStage("new")}
                onUpgradePlan={() => {
                  setShowUpgradeModal(true);
                }}
                onBuyTokens={() => {
                  setShowTokenPurchaseModal(true);
                }}
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
            <div ref={pipelineCardRef}>
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
                <CardContent className="space-y-6">
                  <PipelineTabs
                    activeTab={activeStage}
                    onTabChange={tab => handleStageChange(tab as StageKey)}
                    counts={pipelineLoading ? null : pipeline}
                  />
                  {renderStageList(activeStage)}
                </CardContent>
              </Card>
                </div>

            <JobHighlights
              jobs={jobsState.items}
              loading={jobsState.loading}
              onOpenJobs={() => navigate("/company/jobs")}
            />
            <div className="flex justify-center">
              <Button 
                variant="outline"
                className="rounded-full"
                onClick={() => navigate("/company/jobs")}
              >
                Alle Stellen ansehen
              </Button>
            </div>
          </div>

          <aside className="space-y-6 xl:col-span-4">
            <TodayTasksCard pipeline={pipeline} />
            <CommunitySpotlight posts={communityPosts} />
            <AdminShortcut />
          </aside>
        </div>
      </div>

      {/* Plan Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] p-6 overflow-hidden flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-center">Plan upgraden</h2>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Wählen Sie einen Plan, der zu Ihrem Unternehmen passt
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PlanSelector
              selectedPlanId={company?.selected_plan_id || undefined}
              embedded={true}
              showSalesButton={true}
              onContactSales={() => {
                window.open("https://calendly.com/bevisiblle-sales", "_blank");
                setShowUpgradeModal(false);
              }}
              onNext={() => {
                setShowUpgradeModal(false);
              }}
              onSkip={() => {
                setShowUpgradeModal(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Purchase Modal */}
      {companyId && (
        <TokenPurchaseModalV2
          open={showTokenPurchaseModal}
          onClose={() => setShowTokenPurchaseModal(false)}
          companyId={companyId}
        />
      )}

      {/* Purchase Success Modal */}
      <PurchaseSuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, type: "tokens" })}
        type={successModal.type}
        tokenAmount={successModal.tokenAmount}
        planKey={successModal.planKey}
      />
    </div>
  );
}