import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { unlockService } from "@/services/unlockService";
import { CandidateStatus, changeCandidateStatus } from "@/lib/api/candidates";
import { useUpdateEmploymentRequest, type EmploymentRequest } from "@/hooks/useEmploymentRequests";
import type { Berufserfahrung, Schulbildung } from "@/types/profile";

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  FREIGESCHALTET: "Freigeschaltet",
  INTERVIEW_GEPLANT: "Interview geplant",
  INTERVIEW_DURCHGEFÜHRT: "Interview durchgeführt",
  ABGESAGT: "Abgesagt",
  ANGEBOT_GESENDET: "Angebot gesendet",
  EINGESTELLT: "Eingestellt",
  ABGELEHNT: "Abgelehnt",
  ON_HOLD: "On Hold",
};

export interface CandidateMeta {
  id: string;
  status: CandidateStatus;
  stage?: string | null;
  origin?: string | null;
  interview_date?: string | null;
  notes?: string | null;
  linked_job_ids?: string[] | null;
  unlocked_at?: string | null;
  last_active_status?: CandidateStatus | null;
}

export interface ProfileDisplay {
  id: string;
  vorname?: string | null;
  nachname?: string | null;
  full_name?: string | null;
  email?: string | null;
  telefon?: string | null;
  ort?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  cv_url?: string | null;
  berufserfahrung?: Berufserfahrung[] | null;
  schulbildung?: Schulbildung[] | null;
  [key: string]: unknown;
}

function parseJsonArray<T>(raw: unknown, guard: (v: unknown) => v is T): T[] {
  if (!raw) return [];
  try {
    let arr: unknown[] = [];
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? Object.values(parsed) : [];
    } else if (Array.isArray(raw)) {
      arr = raw;
    } else if (typeof raw === "object") {
      arr = Object.values(raw as Record<string, unknown>);
    }
    return arr.filter((v): v is T => guard(v));
  } catch {
    return [];
  }
}

function isBerufserfahrung(v: unknown): v is Berufserfahrung {
  return typeof v === "object" && v !== null;
}

function isSchulbildung(v: unknown): v is Schulbildung {
  return typeof v === "object" && v !== null;
}

export interface UseProfileViewOptions {
  candidateId: string | null | undefined;
  companyId: string | null | undefined;
  company: { id: string } | null;
}

export interface UseProfileViewResult {
  profile: ProfileDisplay | null;
  loading: boolean;
  isUnlocked: boolean;
  followStatus: "none" | "pending" | "accepted";
  following: boolean;
  applications: Array<{ id: string; created_at?: string; job_posts?: { title?: string } }>;
  unlockModalOpen: boolean;
  setUnlockModalOpen: (open: boolean) => void;
  candidateMeta: CandidateMeta | null;
  statusUpdating: boolean;
  plannedAt: string;
  setPlannedAt: (v: string) => void;
  completedAt: string;
  setCompletedAt: (v: string) => void;
  metaAccordionValue: string | null;
  setMetaAccordionValue: (v: string | null) => void;
  employmentRequest: EmploymentRequest | null;
  loadingEmploymentRequest: boolean;
  showInterviewModal: boolean;
  setShowInterviewModal: (v: boolean) => void;
  candidateWorksForCompany: boolean;
  interestRequestStatus: "none" | "pending" | "accepted" | "rejected";
  creatingInterestRequest: boolean;
  displayProfile: ProfileDisplay | null;
  formattedUnlockDate: string | null;
  currentStageLabel: string;
  candidateStatus: CandidateStatus;
  isOnHold: boolean;
  resumeStatus: CandidateStatus;
  loadProfile: () => Promise<void>;
  checkUnlockState: () => Promise<void>;
  loadCandidateMeta: () => Promise<void>;
  loadEmploymentRequest: () => Promise<void>;
  updateCandidateRecord: (payload: Record<string, unknown>) => Promise<void>;
  handleStatusChange: (
    nextStatus: CandidateStatus,
    meta?: Record<string, unknown>,
    options?: { silent?: boolean }
  ) => Promise<void>;
  handleToggleHold: () => Promise<void>;
  handleFollow: () => Promise<void>;
  handleDownloadCV: () => Promise<void>;
  handleCreateInterestRequest: () => Promise<void>;
  handleEmploymentRequestStatus: (status: "accepted" | "declined") => Promise<void>;
  getEmploymentRequestBadge: (status: string) => React.ReactNode;
  employmentRequestUpdating: boolean;
  toInputDateTime: (value?: string | null) => string;
}

export function useProfileView({
  candidateId: id,
  companyId,
  company,
}: UseProfileViewOptions): UseProfileViewResult {
  const queryClient = useQueryClient();
  const updateEmploymentRequest = useUpdateEmploymentRequest();

  const [profile, setProfile] = useState<ProfileDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [followStatus, setFollowStatus] = useState<"none" | "pending" | "accepted">("none");
  const [following, setFollowing] = useState(false);
  const [applications, setApplications] = useState<
    Array<{ id: string; created_at?: string; job_posts?: { title?: string } }>
  >([]);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [candidateMeta, setCandidateMeta] = useState<CandidateMeta | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [plannedAt, setPlannedAt] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [metaAccordionValue, setMetaAccordionValue] = useState<string | null>(null);
  const [employmentRequest, setEmploymentRequest] = useState<EmploymentRequest | null>(null);
  const [loadingEmploymentRequest, setLoadingEmploymentRequest] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [candidateWorksForCompany, setCandidateWorksForCompany] = useState(false);
  const [interestRequestStatus, setInterestRequestStatus] = useState<
    "none" | "pending" | "accepted" | "rejected"
  >("none");
  const [creatingInterestRequest, setCreatingInterestRequest] = useState(false);

  const candidateStatus: CandidateStatus = candidateMeta?.status ?? "FREIGESCHALTET";
  const isOnHold = candidateStatus === "ON_HOLD";
  const resumeStatus: CandidateStatus = candidateMeta?.last_active_status ?? "FREIGESCHALTET";

  const toInputDateTime = useCallback((value?: string | null) => {
    if (!value) return "";
    try {
      return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
    } catch {
      return "";
    }
  }, []);

  const loadEmploymentRequest = useCallback(async () => {
    if (!company?.id || !id) return;
    try {
      setLoadingEmploymentRequest(true);
      const { data, error } = await supabase
        .from("company_employment_requests")
        .select("id, user_id, company_id, status, created_at, confirmed_by")
        .eq("company_id", company.id)
        .eq("user_id", id)
        .maybeSingle();
      if (error) throw error;
      setEmploymentRequest((data as EmploymentRequest) ?? null);
    } catch (error) {
      console.error("Error loading employment request:", error);
    } finally {
      setLoadingEmploymentRequest(false);
    }
  }, [company?.id, id]);

  const handleEmploymentRequestStatus = useCallback(
    async (nextStatus: "accepted" | "declined") => {
      if (!employmentRequest) return;
      try {
        await updateEmploymentRequest.mutateAsync({
          requestId: employmentRequest.id,
          status: nextStatus,
        });
        await loadEmploymentRequest();
      } catch (error) {
        console.error("Error updating employment request from profile view:", error);
      }
    },
    [employmentRequest, loadEmploymentRequest, updateEmploymentRequest]
  );

  const getEmploymentRequestBadge = useCallback((status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Wartend
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="gap-1 bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Angenommen
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3 w-3" />
            Abgelehnt
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  const formattedUnlockDate = candidateMeta?.unlocked_at
    ? (() => {
        try {
          return format(new Date(candidateMeta.unlocked_at), "dd.MM.yyyy", { locale: de });
        } catch {
          return candidateMeta.unlocked_at;
        }
      })()
    : null;

  const currentStageLabel = STATUS_LABELS[candidateStatus];

  const updateCandidateRecord = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!company?.id || !id) throw new Error("Missing company or candidate id");
      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from("company_candidates")
        .update({
          ...payload,
          updated_at: timestamp,
          last_touched_at: timestamp,
        })
        .eq("company_id", company.id)
        .eq("candidate_id", id);
      if (error) throw error;
    },
    [company?.id, id]
  );

  const loadCandidateMeta = useCallback(async () => {
    if (!company?.id || !id) return;
    try {
      const { data, error } = await supabase
        .from("company_candidates")
        .select(
          "id, status, stage, origin, interview_date, last_active_status, notes, linked_job_ids, unlocked_at"
        )
        .eq("company_id", company.id)
        .eq("candidate_id", id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const statusValue = (data.status as CandidateStatus) ?? "FREIGESCHALTET";
        const lastActive = data.last_active_status as CandidateStatus | null;
        setCandidateMeta({
          id: data.id,
          status: statusValue,
          stage: data.stage,
          origin: data.origin,
          interview_date: data.interview_date,
          notes: data.notes,
          linked_job_ids: data.linked_job_ids as string[] | null,
          unlocked_at: data.unlocked_at,
          last_active_status: lastActive,
        });
      } else {
        setCandidateMeta(null);
      }
    } catch (error) {
      console.error("Error loading candidate meta:", error);
    }
  }, [company?.id, id]);

  const handleStatusChange = useCallback(
    async (
      nextStatus: CandidateStatus,
      meta: Record<string, unknown> = {},
      options: { silent?: boolean } = {}
    ) => {
      if (!candidateMeta?.id) return;
      setStatusUpdating(true);
      try {
        await changeCandidateStatus({
          companyCandidateId: candidateMeta.id,
          nextStatus,
          meta,
          silent: options.silent ?? false,
        });
        await loadCandidateMeta();
        toast.success(`Status: ${STATUS_LABELS[nextStatus]}`);
      } catch (error: unknown) {
        console.error("Error changing status", error);
        toast.error(
          (error as { message?: string })?.message || "Status konnte nicht aktualisiert werden"
        );
      } finally {
        setStatusUpdating(false);
      }
    },
    [candidateMeta?.id, loadCandidateMeta]
  );

  const handleToggleHold = useCallback(async () => {
    if (statusUpdating || !candidateMeta?.id) return;
    if (isOnHold) {
      await handleStatusChange(resumeStatus);
    } else {
      await handleStatusChange("ON_HOLD");
    }
  }, [statusUpdating, candidateMeta?.id, isOnHold, resumeStatus, handleStatusChange]);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      if (data) {
        let berufserfahrung: Berufserfahrung[] = [];
        let schulbildung: Schulbildung[] = [];
        try {
          berufserfahrung = parseJsonArray(data.berufserfahrung, isBerufserfahrung) as Berufserfahrung[];
        } catch {
          berufserfahrung = Array.isArray(data.berufserfahrung) ? (data.berufserfahrung as Berufserfahrung[]) : [];
        }
        try {
          schulbildung = parseJsonArray(data.schulbildung, isSchulbildung) as Schulbildung[];
        } catch {
          schulbildung = Array.isArray(data.schulbildung) ? (data.schulbildung as Schulbildung[]) : [];
        }
        setProfile({
          ...data,
          berufserfahrung: berufserfahrung.length > 0 ? berufserfahrung : (data.berufserfahrung ?? []),
          schulbildung: schulbildung.length > 0 ? schulbildung : (data.schulbildung ?? []),
        } as ProfileDisplay);
      } else {
        setProfile(null);
      }
    } catch (error: unknown) {
      console.error("Error loading profile:", error);
      toast.error("Fehler beim Laden des Profils");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkUnlockState = useCallback(async () => {
    if (!id || !company?.id) return;
    const state = await unlockService.checkUnlockState(id);
    const unlockedViaTokens = state?.basic_unlocked ?? false;
    const { data: companyCandidate } = await supabase
      .from("company_candidates")
      .select("unlocked_at")
      .eq("company_id", company.id)
      .eq("candidate_id", id)
      .not("unlocked_at", "is", null)
      .maybeSingle();
    const unlockedViaCompanyCandidates = !!companyCandidate?.unlocked_at;
    setIsUnlocked(unlockedViaTokens || unlockedViaCompanyCandidates);
  }, [id, company?.id]);

  const checkFollowState = useCallback(async () => {
    if (!id || !company) return;
    try {
      const { data, error } = await supabase
        .from("company_follows")
        .select("status")
        .eq("company_id", company.id)
        .eq("candidate_id", id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFollowStatus(data.status as "none" | "pending" | "accepted");
      }
    } catch (error) {
      console.error("Error checking follow state:", error);
    }
  }, [id, company]);

  const loadApplications = useCallback(async () => {
    if (!id || !company) return;
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          job_posts (
            id,
            title,
            location
          )
        `
        )
        .eq("candidate_id", id)
        .eq("company_id", company.id);
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  }, [id, company]);

  const handleFollow = useCallback(async () => {
    if (!id || !company) return;
    setFollowing(true);
    try {
      if (followStatus === "accepted") {
        const { error } = await supabase
          .from("company_follows")
          .delete()
          .eq("company_id", company.id)
          .eq("candidate_id", id);
        if (error) throw error;
        setFollowStatus("none");
        toast.success("Nicht mehr gefolgt");
      } else if (followStatus === "none") {
        const { error } = await supabase
          .from("company_follows")
          .insert({
            company_id: company.id,
            candidate_id: id,
            status: "pending",
          });
        if (error) throw error;
        setFollowStatus("pending");
        toast.success("Follow-Anfrage gesendet");
      }
    } catch (error: unknown) {
      console.error("Error following:", error);
      toast.error("Fehler beim Folgen");
    } finally {
      setFollowing(false);
    }
  }, [id, company, followStatus]);

  const handleDownloadCV = useCallback(async () => {
    if (!profile?.cv_url) return;
    try {
      const link = document.createElement("a");
      link.href = profile.cv_url;
      link.download = `CV_${profile.vorname}_${profile.nachname}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CV wird heruntergeladen");
    } catch (error) {
      console.error("Error downloading CV:", error);
      toast.error("Fehler beim Download");
    }
  }, [profile?.cv_url, profile?.vorname, profile?.nachname]);

  const handleCreateInterestRequest = useCallback(async () => {
    if (!company?.id || !id || creatingInterestRequest) return;
    setCreatingInterestRequest(true);
    try {
      const { data, error } = await supabase.rpc("create_company_interest_request", {
        p_company_id: company.id,
        p_candidate_id: id,
      });
      if (error) throw error;
      if (data?.success) {
        setInterestRequestStatus("pending");
        toast.success("Interesse-Anfrage wurde gesendet. Der Kandidat wird benachrichtigt.");
        queryClient.invalidateQueries({ queryKey: ["company-interests"] });
      } else {
        toast.error((data as { message?: string })?.message || "Fehler beim Erstellen der Anfrage");
      }
    } catch (error: unknown) {
      console.error("Error creating interest request:", error);
      toast.error((error as { message?: string })?.message || "Fehler beim Erstellen der Anfrage");
    } finally {
      setCreatingInterestRequest(false);
    }
  }, [company?.id, id, creatingInterestRequest, queryClient]);

  useEffect(() => {
    if (!id || !company) return;
    loadProfile();
    checkUnlockState();
    checkFollowState();
    loadApplications();
    loadCandidateMeta();
  }, [id, company, loadProfile, checkUnlockState, checkFollowState, loadApplications, loadCandidateMeta]);

  useEffect(() => {
    if (!candidateMeta) {
      setPlannedAt("");
      setCompletedAt("");
      return;
    }
    if (candidateMeta.status === "INTERVIEW_GEPLANT") {
      const inputValue = toInputDateTime(candidateMeta.interview_date);
      setPlannedAt(inputValue);
      setCompletedAt(inputValue);
    } else {
      setPlannedAt("");
      setCompletedAt(candidateMeta.interview_date ? toInputDateTime(candidateMeta.interview_date) : "");
    }
  }, [candidateMeta, toInputDateTime]);

  useEffect(() => {
    loadEmploymentRequest();
  }, [loadEmploymentRequest]);

  useEffect(() => {
    if (!id || !company?.id) return;
    const checkCandidateEmployment = async () => {
      try {
        const { data: employmentData } = await supabase
          .from("company_employment_requests")
          .select("status")
          .eq("user_id", id)
          .eq("company_id", company.id)
          .eq("status", "accepted")
          .maybeSingle();
        const worksForCompany = !!employmentData;
        setCandidateWorksForCompany(worksForCompany);
        if (worksForCompany) {
          const { data: interestData } = await supabase
            .from("company_interest_requests")
            .select("status")
            .eq("company_id", company.id)
            .eq("candidate_id", id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (interestData) {
            setInterestRequestStatus(interestData.status as "pending" | "accepted" | "rejected");
          }
        }
      } catch (error) {
        console.error("Error checking candidate employment:", error);
      }
    };
    checkCandidateEmployment();
  }, [id, company?.id]);

  const displayProfile: ProfileDisplay | null = isUnlocked
    ? profile
    : profile
      ? {
          ...profile,
          nachname: profile.nachname ? `${profile.nachname[0]}.` : "",
          email: null,
          telefon: null,
        }
      : null;

  return {
    profile,
    loading,
    isUnlocked,
    followStatus,
    following,
    applications,
    unlockModalOpen,
    setUnlockModalOpen,
    candidateMeta,
    statusUpdating,
    plannedAt,
    setPlannedAt,
    completedAt,
    setCompletedAt,
    metaAccordionValue,
    setMetaAccordionValue,
    employmentRequest,
    loadingEmploymentRequest,
    showInterviewModal,
    setShowInterviewModal,
    candidateWorksForCompany,
    interestRequestStatus,
    creatingInterestRequest,
    displayProfile,
    formattedUnlockDate,
    currentStageLabel,
    candidateStatus,
    isOnHold,
    resumeStatus,
    loadProfile,
    checkUnlockState,
    loadCandidateMeta,
    loadEmploymentRequest,
    updateCandidateRecord,
    handleStatusChange,
    handleToggleHold,
    handleFollow,
    handleDownloadCV,
    handleCreateInterestRequest,
    handleEmploymentRequestStatus,
    getEmploymentRequestBadge,
    toInputDateTime,
    employmentRequestUpdating: updateEmploymentRequest.isPending,
  };
}
