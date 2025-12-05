import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, CheckCircle2, UserCheck, Clock, Download, ChevronRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { unlockService } from "@/services/unlockService";
import { LinkedInProfileHeader } from "@/components/linkedin/LinkedInProfileHeader";
import { LinkedInProfileMain } from "@/components/linkedin/LinkedInProfileMain";
import { LinkedInProfileExperience } from "@/components/linkedin/LinkedInProfileExperience";
import { LinkedInProfileEducation } from "@/components/linkedin/LinkedInProfileEducation";
import { LinkedInProfileActivity } from "@/components/linkedin/LinkedInProfileActivity";
import { LinkedInProfileSidebar } from "@/components/linkedin/LinkedInProfileSidebar";
import { ValuesAndInterviewSection } from "@/components/recruiter/ValuesAndInterviewSection";
import { WeitereDokumenteSection } from "@/components/linkedin/right-rail/WeitereDokumenteSection";
import { ContactInfoCard } from "@/components/linkedin/right-rail/ContactInfoCard";
import { AdCard } from "@/components/linkedin/right-rail/AdCard";
import CandidateUnlockModal from "@/components/unlock/CandidateUnlockModal";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CandidateStatus, changeCandidateStatus } from "@/lib/api/candidates";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect, Option as MultiSelectOption } from "@/components/ui/multi-select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useUpdateEmploymentRequest, EmploymentRequest } from "@/hooks/useEmploymentRequests";

type CandidateNote = {
  id: string;
  content: string;
  createdAt: string;
  authorId?: string | null;
  authorName?: string | null;
};

type CandidateMeta = {
  id: string;
  status: CandidateStatus;
  stage?: string | null;
  origin?: string | null;
  interview_date?: string | null;
  notes?: string | null;
  linked_job_ids?: string[] | null;
  unlocked_at?: string | null;
  last_active_status?: CandidateStatus | null;
};

const STATUS_LABELS: Record<CandidateStatus, string> = {
  FREIGESCHALTET: "Freigeschaltet",
  INTERVIEW_GEPLANT: "Interview geplant",
  INTERVIEW_DURCHGEFÜHRT: "Interview durchgeführt",
  ABGESAGT: "Abgesagt",
  ANGEBOT_GESENDET: "Angebot gesendet",
  EINGESTELLT: "Eingestellt",
  ABGELEHNT: "Abgelehnt",
  ON_HOLD: "On Hold",
};

type ActionOption = {
  key: string;
  label: string;
  status: CandidateStatus;
  requiresDate?: "planned" | "completed";
  variant?: "primary" | "outline" | "destructive";
};

const normalizeNote = (value: unknown, index: number): CandidateNote | null => {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return {
      id: `legacy-${index}-${trimmed.length}`,
      content: trimmed,
      createdAt: "",
    };
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const contentRaw = record.content ?? record.note ?? record.text ?? record.body;
    const content = typeof contentRaw === "string" ? contentRaw.trim() : Array.isArray(contentRaw) ? contentRaw.join("\n") : String(contentRaw ?? "");
    if (!content) return null;

    const createdAtRaw = record.createdAt ?? record.created_at ?? record.timestamp ?? record.date;
    const createdAt = typeof createdAtRaw === "string" ? createdAtRaw : createdAtRaw ? String(createdAtRaw) : "";

    const authorIdRaw = record.authorId ?? record.author_id;
    const authorNameRaw = record.authorName ?? record.author ?? record.author_email ?? record.authorEmail;

    return {
      id: (typeof record.id === "string" && record.id) || `note-${index}-${content.length}`,
      content,
      createdAt,
      authorId: typeof authorIdRaw === "string" ? authorIdRaw : authorIdRaw ? String(authorIdRaw) : null,
      authorName: typeof authorNameRaw === "string" ? authorNameRaw : authorNameRaw ? String(authorNameRaw) : null,
    };
  }

  return null;
};

const parseCandidateNotes = (raw: unknown): CandidateNote[] => {
  if (!raw) return [];

  let base: unknown[] = [];

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        base = parsed;
      } else if (parsed && typeof parsed === "object") {
        base = Object.values(parsed as Record<string, unknown>);
      } else {
        base = [trimmed];
      }
    } catch {
      base = trimmed
        .split(/\n{2,}/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  } else if (Array.isArray(raw)) {
    base = raw;
  } else if (typeof raw === "object") {
    base = Object.values(raw as Record<string, unknown>);
  }

  return base
    .map((entry, index) => normalizeNote(entry, index))
    .filter((note): note is CandidateNote => !!note)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
};

const createNoteId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}`;
};

export default function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { company } = useCompany();
  const { user } = useAuth();
  const updateEmploymentRequest = useUpdateEmploymentRequest();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [following, setFollowing] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [candidateMeta, setCandidateMeta] = useState<CandidateMeta | null>(null);
  const [linkedJobs, setLinkedJobs] = useState<Array<{ id: string; title: string; city?: string | null }>>([]);
  const [jobOptions, setJobOptions] = useState<MultiSelectOption[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [updatingJobs, setUpdatingJobs] = useState(false);
  const [plannedAt, setPlannedAt] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [metaAccordionValue, setMetaAccordionValue] = useState<string | null>(null);
  const [employmentRequest, setEmploymentRequest] = useState<EmploymentRequest | null>(null);
  const [loadingEmploymentRequest, setLoadingEmploymentRequest] = useState(false);

  const navigationState = location.state as
    | {
        from?: { pathname: string; search?: string };
        label?: string;
      }
    | undefined;
  const backPath = navigationState?.from
    ? `${navigationState.from.pathname}${navigationState.from.search ?? ""}`
    : "/company/search";
  const backLabel = navigationState?.label ?? "Kandidatensuche";
  const candidateStatus: CandidateStatus = candidateMeta?.status ?? "FREIGESCHALTET";
  const isOnHold = candidateStatus === "ON_HOLD";
  const resumeStatus: CandidateStatus = candidateMeta?.last_active_status ?? "FREIGESCHALTET";
  const toInputDateTime = (value?: string | null) => {
    if (!value) return "";
    try {
      return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
    } catch {
      return "";
    }
  };

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
    [employmentRequest, loadEmploymentRequest, updateEmploymentRequest],
  );

  const getEmploymentRequestBadge = (status: string) => {
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
  };

  const formattedUnlockDate = useMemo(() => {
    if (!candidateMeta?.unlocked_at) return null;
    try {
      return format(new Date(candidateMeta.unlocked_at), "dd.MM.yyyy", { locale: de });
    } catch (error) {
      console.error("Error formatting unlock date:", error);
      return candidateMeta.unlocked_at;
    }
  }, [candidateMeta?.unlocked_at]);

  const currentStageLabel = STATUS_LABELS[candidateStatus];

  const notesList = useMemo(() => parseCandidateNotes(candidateMeta?.notes ?? null), [candidateMeta?.notes]);
  const jobBadgeData = useMemo(() => {
    if (selectedJobIds.length === 0) return [] as Array<{ id: string; label: string }>;
    return selectedJobIds.map((jobId) => {
      const linked = linkedJobs.find((job) => job.id === jobId);
      if (linked) {
        return {
          id: jobId,
          label: linked.city ? `${linked.title} · ${linked.city}` : linked.title,
        };
      }
      const option = jobOptions.find((opt) => opt.value === jobId);
      return {
        id: jobId,
        label: option?.label ?? jobId,
      };
    });
  }, [selectedJobIds, linkedJobs, jobOptions]);

  const summaryJobsCount = jobBadgeData.length;
  const summaryNotesCount = notesList.length;

  const formatNoteDate = useCallback((value: string) => {
    if (!value) return "Datum unbekannt";
    try {
      return format(new Date(value), "dd.MM.yyyy HH:mm", { locale: de });
    } catch {
      return value;
    }
  }, []);

  const loadCandidateMeta = useCallback(async () => {
    if (!company?.id || !id) return;
    try {
      const { data, error } = await supabase
        .from("company_candidates")
        .select("id, status, stage, origin, interview_date, last_active_status, notes, linked_job_ids, unlocked_at")
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

      const jobIds = Array.isArray(data?.linked_job_ids)
        ? (data?.linked_job_ids as unknown[])
            .map((value) => {
              if (typeof value === "string") return value;
              if (typeof value === "number") return String(value);
              if (value && typeof value === "object" && "id" in (value as Record<string, unknown>)) {
                const possibleId = (value as Record<string, unknown>).id;
                return typeof possibleId === "string" ? possibleId : possibleId ? String(possibleId) : null;
              }
              return null;
            })
            .filter((entry): entry is string => !!entry)
        : [];

      setSelectedJobIds(jobIds);

      if (jobIds.length > 0) {
        const { data: jobDetails, error: jobsError } = await supabase
          .from("job_posts")
          .select("id, title, city")
          .in("id", jobIds);

        if (jobsError) throw jobsError;
        setLinkedJobs(jobDetails || []);
      } else {
        setLinkedJobs([]);
      }
    } catch (error) {
      console.error("Error loading candidate meta:", error);
      setLinkedJobs([]);
      setSelectedJobIds([]);
    }
  }, [company?.id, id]);

  const updateCandidateRecord = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!company?.id || !id) {
        throw new Error("Missing company or candidate id");
      }

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

      if (error) {
        throw error;
      }
    },
    [company?.id, id]
  );

  const loadJobs = useCallback(async () => {
    if (!company?.id) return;

    setJobsLoading(true);
    try {
      const { data, error } = await supabase
        .from("job_posts")
        .select("id, title, city, is_active, status")
        .eq("company_id", company.id)
        .order("title", { ascending: true });

      if (error) throw error;

      const activeJobs = (data || []).filter((job) => {
        if (!job) return false;
        if (job.is_active === true) return true;
        const status = typeof job.status === "string" ? job.status.toLowerCase() : "";
        return status === "published" || status === "active" || status === "online";
      });

      setJobOptions(
        activeJobs.map((job) => ({
          value: job.id,
          label: job.city ? `${job.title} · ${job.city}` : job.title,
        }))
      );
    } catch (error) {
      console.error("Error loading job options:", error);
      toast.error("Aktive Stellen konnten nicht geladen werden");
    } finally {
      setJobsLoading(false);
    }
  }, [company?.id]);

  const handleStatusChange = async (
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
    } catch (error: any) {
      console.error("Error changing status", error);
      toast.error(error?.message || "Status konnte nicht aktualisiert werden");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleToggleHold = async () => {
    if (statusUpdating || !candidateMeta?.id) return;
    if (isOnHold) {
      await handleStatusChange(resumeStatus);
    } else {
      await handleStatusChange("ON_HOLD");
    }
  };

  const availableActions = useMemo<ActionOption[]>(() => {
    switch (candidateStatus) {
      case "FREIGESCHALTET":
        return [
          {
            key: "plan",
            label: "Interview planen",
            status: "INTERVIEW_GEPLANT",
            requiresDate: "planned",
            variant: "primary",
          },
          {
            key: "reject",
            label: "Unpassend",
            status: "ABGELEHNT",
            variant: "destructive",
          },
        ];
      case "INTERVIEW_GEPLANT":
        return [
          {
            key: "conducted",
            label: "Interview hat stattgefunden",
            status: "INTERVIEW_DURCHGEFÜHRT",
            requiresDate: "completed",
            variant: "primary",
          },
          {
            key: "cancel",
            label: "Absagen",
            status: "ABGESAGT",
            variant: "destructive",
          },
        ];
      case "INTERVIEW_DURCHGEFÜHRT":
        return [
          {
            key: "offer",
            label: "Angebot senden",
            status: "ANGEBOT_GESENDET",
            variant: "primary",
          },
          {
            key: "decline",
            label: "Unpassend",
            status: "ABGELEHNT",
            variant: "destructive",
          },
        ];
      case "ANGEBOT_GESENDET":
        return [
          {
            key: "hire",
            label: "Eingestellt",
            status: "EINGESTELLT",
            variant: "primary",
          },
          {
            key: "reject",
            label: "Abgelehnt",
            status: "ABGELEHNT",
            variant: "destructive",
          },
        ];
      case "ON_HOLD":
        return [
          {
            key: "resume",
            label: `Fortsetzen (${STATUS_LABELS[resumeStatus]})`,
            status: resumeStatus,
            variant: "primary",
          },
          {
            key: "reject",
            label: "Unpassend",
            status: "ABGELEHNT",
            variant: "destructive",
          },
        ];
      default:
        return [];
    }
  }, [candidateStatus, resumeStatus]);

  const runAction = async (action: ActionOption) => {
    if (statusUpdating) return;

    if (action.requiresDate === "planned") {
      if (!plannedAt) {
        toast.error("Bitte Interviewtermin auswählen.");
        return;
      }
      await handleStatusChange(action.status, {
        planned_at: new Date(plannedAt).toISOString(),
      });
      if (!completedAt) {
        setCompletedAt(plannedAt);
      }
      return;
    }

    if (action.requiresDate === "completed") {
      const value = completedAt || plannedAt;
      if (!value) {
        toast.error("Bitte Datum und Uhrzeit des Interviews angeben.");
        return;
      }
      await handleStatusChange(action.status, {
        interview_date: new Date(value).toISOString(),
      });
      return;
    }

    await handleStatusChange(action.status);
  };

  const isActionDisabled = (action: ActionOption) => {
    if (statusUpdating) return true;
    if (action.requiresDate === "planned") {
      return !plannedAt;
    }
    if (action.requiresDate === "completed") {
      return !(completedAt || plannedAt);
    }
    return false;
  };

  const renderActionButtons = (placement: "main" | "notes") => {
    if (availableActions.length === 0) {
      return placement === "main" ? (
        <p className="mt-3 text-sm text-muted-foreground">Keine weiteren Aktionen notwendig.</p>
      ) : null;
    }

    return (
      <div className={`${placement === "main" ? "mt-4" : "mt-2"} flex flex-wrap gap-2`}>
        {availableActions.map((action) => {
          let variant: "default" | "outline" | "destructive" = "outline";
          if (action.variant === "destructive") variant = "destructive";
          else if (action.variant === "primary") variant = "default";

          return (
            <Button
              key={`${placement}-${action.key}`}
              size="sm"
              variant={variant}
              onClick={() => runAction(action)}
              disabled={isActionDisabled(action)}
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  };

  const handleJobAssignmentChange = async (values: string[]) => {
    setSelectedJobIds(values);
    setUpdatingJobs(true);
    try {
      await updateCandidateRecord({ linked_job_ids: values });
      await loadCandidateMeta();
      toast.success("Stellenzuordnung aktualisiert");
    } catch (error) {
      console.error("Error updating job assignment:", error);
      toast.error("Stellenzuordnung konnte nicht gespeichert werden");
    } finally {
      setUpdatingJobs(false);
    }
  };

  const handleAddNote = async () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;

    setAddingNote(true);
    try {
      const newEntry: CandidateNote = {
        id: createNoteId(),
        content: trimmed,
        createdAt: new Date().toISOString(),
        authorId: user?.id ?? null,
        authorName: (user?.user_metadata?.name as string | undefined) || user?.email || user?.id || null,
      };

      const updatedNotes = [newEntry, ...notesList];
      await updateCandidateRecord({ notes: JSON.stringify(updatedNotes) });
      setCandidateMeta((prev) => (prev ? { ...prev, notes: JSON.stringify(updatedNotes) } : prev));
      setNewNote("");
      toast.success("Notiz hinzugefügt");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Notiz konnte nicht gespeichert werden");
    } finally {
      setAddingNote(false);
    }
  };

  useEffect(() => {
    if (!id || !company) return;
    loadProfile();
    checkUnlockState();
    checkFollowState();
    loadApplications();
    loadCandidateMeta();
  }, [id, company, loadCandidateMeta]);

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
      if (candidateMeta.interview_date) {
        setCompletedAt(toInputDateTime(candidateMeta.interview_date));
      } else {
        setCompletedAt("");
      }
    }
  }, [candidateMeta]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadEmploymentRequest();
  }, [loadEmploymentRequest]);

  useEffect(() => {
    if (linkedJobs.length === 0) return;
    setJobOptions((prev) => {
      const missing = linkedJobs
        .filter((job) => job.id && !prev.some((option) => option.value === job.id))
        .map((job) => ({
          value: job.id,
          label: job.city ? `${job.title} · ${job.city}` : job.title,
        }));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
  }, [linkedJobs]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Fehler beim Laden des Profils');
    } finally {
      setLoading(false);
    }
  };

  const checkUnlockState = async () => {
    if (!id) return;
    const state = await unlockService.checkUnlockState(id);
    setIsUnlocked(state?.basic_unlocked || false);
  };

  const checkFollowState = async () => {
    if (!id || !company) return;
    try {
      const { data, error } = await supabase
        .from('company_follows')
        .select('status')
        .eq('company_id', company.id)
        .eq('candidate_id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFollowStatus(data.status as any);
      }
    } catch (error) {
      console.error('Error checking follow state:', error);
    }
  };

  const loadApplications = async () => {
    if (!id || !company) return;
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job_posts (
            id,
            title,
            location
          )
        `)
        .eq('candidate_id', id)
        .eq('company_id', company.id);

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };


  const handleFollow = async () => {
    if (!id || !company) return;
    setFollowing(true);
    try {
      if (followStatus === 'accepted') {
        // Unfollow
        const { error } = await supabase
          .from('company_follows')
          .delete()
          .eq('company_id', company.id)
          .eq('candidate_id', id);

        if (error) throw error;
        setFollowStatus('none');
        toast.success('Nicht mehr gefolgt');
      } else if (followStatus === 'none') {
        // Follow
        const { error } = await supabase
          .from('company_follows')
          .insert({
            company_id: company.id,
            candidate_id: id,
            status: 'pending'
          });

        if (error) throw error;
        setFollowStatus('pending');
        toast.success('Follow-Anfrage gesendet');
      }
    } catch (error: any) {
      console.error('Error following:', error);
      toast.error('Fehler beim Folgen');
    } finally {
      setFollowing(false);
    }
  };

  const handleDownloadCV = async () => {
    if (!profile?.cv_url) return;
    
    try {
      const link = document.createElement('a');
      link.href = profile.cv_url;
      link.download = `CV_${profile.vorname}_${profile.nachname}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CV wird heruntergeladen');
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Fehler beim Download');
    }
  };

  // Mask data if not unlocked
  const displayProfile = isUnlocked ? profile : profile ? {
    ...profile,
    nachname: profile.nachname ? `${profile.nachname[0]}.` : '',
    email: null,
    telefon: null,
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-muted-foreground">Profil nicht gefunden</p>
        <Button onClick={() => navigate(backPath)}>
          Zurück zu {backLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {backLabel}
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">
            {profile?.vorname || profile?.full_name || "Profil"}
          </span>
        </nav>

        {isUnlocked && (
          <Accordion
            type="single"
            collapsible
            value={metaAccordionValue ?? undefined}
            onValueChange={(value) => setMetaAccordionValue(value ?? null)}
            className="mb-6 rounded-lg border bg-card"
          >
            <AccordionItem value="meta">
              <AccordionTrigger className="flex flex-col items-start gap-1 px-4 py-4 text-left">
                <span className="text-sm font-medium text-foreground">Recruiting-Aktivitäten</span>
                <span className="text-xs text-muted-foreground">
                  Status: {currentStageLabel}
                  {formattedUnlockDate ? ` • Freigeschaltet am ${formattedUnlockDate}` : ""}
                  {` • Stellen: ${summaryJobsCount}`}
                  {` • Notizen: ${summaryNotesCount}`}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Aktueller Status</p>
                      <p className="text-lg font-semibold text-foreground">{currentStageLabel}</p>
                      {isOnHold && (
                        <Badge variant="outline" className="text-xs">
                          Vorher: {STATUS_LABELS[resumeStatus]}
                        </Badge>
                      )}
                      {candidateMeta?.origin && (
                        <p className="text-sm text-muted-foreground">
                          Herkunft: {candidateMeta.origin === "BEWERBER" ? "Bewerbung" : candidateMeta.origin}
                        </p>
                      )}
                      {candidateMeta?.interview_date && (
                        <p className="text-sm text-muted-foreground">
                          Interviewtermin: {format(new Date(candidateMeta.interview_date), "dd.MM.yyyy HH:mm", { locale: de })}
                        </p>
                      )}
                      {formattedUnlockDate && (
                        <p className="text-xs text-muted-foreground">Freigeschaltet am {formattedUnlockDate}</p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          size="sm"
                          variant={isOnHold ? "secondary" : "outline"}
                          onClick={handleToggleHold}
                          disabled={statusUpdating}
                        >
                          {isOnHold ? "On Hold aufheben" : "On Hold"}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-card p-4 lg:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Nächste Aktion</p>

                      {candidateStatus === "FREIGESCHALTET" && (
                        <div className="mt-3 space-y-2">
                          <Label htmlFor="planned-at">Interviewtermin (optional)</Label>
                          <Input
                            id="planned-at"
                            type="datetime-local"
                            value={plannedAt}
                            onChange={(event) => setPlannedAt(event.target.value)}
                            disabled={statusUpdating}
                          />
                          <p className="text-xs text-muted-foreground">
                            Termin kann später angepasst werden. Ohne Angabe wird nur der Status geändert.
                          </p>
                        </div>
                      )}

                      {candidateStatus === "INTERVIEW_GEPLANT" && (
                        <div className="mt-3 space-y-2">
                          <Label htmlFor="completed-at">Interviewdatum</Label>
                          <Input
                            id="completed-at"
                            type="datetime-local"
                            value={completedAt}
                            onChange={(event) => setCompletedAt(event.target.value)}
                            disabled={statusUpdating}
                          />
                          <p className="text-xs text-muted-foreground">
                            Pflichtfeld: tatsächliches Datum des Interviews.
                          </p>
                        </div>
                      )}

                      {renderActionButtons("main")}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border bg-card p-4 space-y-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Stellenzuordnung</p>
                      <MultiSelect
                        options={jobOptions}
                        selected={selectedJobIds}
                        onChange={handleJobAssignmentChange}
                        placeholder={jobsLoading ? "Stellen werden geladen..." : "Stellen auswählen"}
                      />
                      {jobsLoading && (
                        <p className="text-xs text-muted-foreground">Aktive Stellen werden geladen ...</p>
                      )}
                      {!jobsLoading && jobBadgeData.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {jobBadgeData.map((job) => (
                            <Badge key={job.id} variant="secondary" className="px-2 py-1 text-xs">
                              {job.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {!jobsLoading && jobBadgeData.length === 0 && (
                        <p className="text-xs text-muted-foreground">Noch keiner Stelle zugeordnet.</p>
                      )}
                      {updatingJobs && (
                        <p className="text-xs text-muted-foreground">Speichere Zuordnung ...</p>
                      )}
                    </div>

                    <div className="rounded-lg border bg-card p-4 space-y-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Notizen</p>
                      {summaryNotesCount === 0 ? (
                        <p className="text-sm text-muted-foreground">Noch keine Notizen hinterlegt.</p>
                      ) : (
                        <div className="max-h-64 space-y-3 overflow-auto pr-1">
                          {notesList.map((note) => (
                            <div key={note.id} className="rounded-md border bg-muted/40 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span>{formatNoteDate(note.createdAt)}</span>
                                {note.authorName && <span>{note.authorName}</span>}
                              </div>
                              <p className="mt-2 whitespace-pre-line text-sm text-foreground">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <Textarea
                        value={newNote}
                        onChange={(event) => setNewNote(event.target.value)}
                        placeholder="Neue Notiz hinzufügen..."
                        rows={3}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {renderActionButtons("notes")}
                        <Button
                          size="sm"
                          onClick={handleAddNote}
                          disabled={addingNote || !newNote.trim()}
                        >
                          {addingNote ? "Speichere..." : "Notiz hinzufügen"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(backPath)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zu {backLabel}
          </Button>
          
          {/* Follow Button - only show if unlocked */}
          {isUnlocked && (
            <Button
              variant={followStatus === 'accepted' ? 'secondary' : 'outline'}
              onClick={handleFollow}
              disabled={following || followStatus === 'pending'}
              className="gap-2"
            >
              {followStatus === 'pending' ? (
                <>
                  <Clock className="h-4 w-4" />
                  Ausstehend
                </>
              ) : followStatus === 'accepted' ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  Gefolgt
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Folgen
                </>
              )}
            </Button>
          )}
        </div>

        {/* Application Status Banner */}
        {applications.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">
                Hat sich beworben auf: {applications[0].job_posts?.title || 'Ihre Stelle'}
              </p>
              <p className="text-sm text-green-700">
                Bewerbung vom {new Date(applications[0].created_at).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        )}

        {/* Unlock Section if not unlocked */}
        {!isUnlocked && (
          <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Profil nicht freigeschaltet</h3>
                  <p className="text-sm text-yellow-700">
                    Schalten Sie das Profil frei, um vollständige Kontaktdaten und Dokumente zu sehen
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setUnlockModalOpen(true)}
                size="lg"
                className="flex-shrink-0"
              >
                <Lock className="h-4 w-4 mr-2" />
                Profil freischalten
              </Button>
            </div>
          </div>
        )}

        {/* 2-Column Layout - Same as UserProfile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            <LinkedInProfileHeader
              profile={displayProfile}
              isEditing={false}
              onProfileUpdate={() => {}}
            />
            
            <LinkedInProfileMain
              profile={displayProfile}
              isEditing={false}
              onProfileUpdate={() => {}}
              readOnly={true}
            />

            {/* Weitere Dokumente - only when unlocked, directly after CV */}
            {isUnlocked && (
              <WeitereDokumenteSection
                userId={id || ''}
                readOnly={true}
                openWidget={() => {}}
                refreshTrigger={0}
              />
            )}
            
            <LinkedInProfileExperience
              experiences={displayProfile?.berufserfahrung || []}
              isEditing={false}
              onExperiencesUpdate={() => {}}
            />
            
            <LinkedInProfileEducation
              education={displayProfile?.schulbildung || []}
              isEditing={false}
              onEducationUpdate={() => {}}
            />
            
            {/* Activity only if follow is accepted */}
            {followStatus === 'accepted' && (
              <LinkedInProfileActivity profile={displayProfile} />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-20 space-y-4">
              {(loadingEmploymentRequest || employmentRequest) && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Beschäftigungsanfrage
                    </p>
                    {employmentRequest && getEmploymentRequestBadge(employmentRequest.status)}
                  </div>
                  {loadingEmploymentRequest ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Anfrage wird geladen ...
                    </div>
                  ) : employmentRequest ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Eingegangen am{" "}
                        {format(new Date(employmentRequest.created_at), "dd.MM.yyyy", { locale: de })}
                      </p>
                      {employmentRequest.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleEmploymentRequestStatus("accepted")}
                            disabled={updateEmploymentRequest.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Annehmen
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEmploymentRequestStatus("declined")}
                            disabled={updateEmploymentRequest.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Ablehnen
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Diese Anfrage wurde{" "}
                          {employmentRequest.status === "accepted" ? "bereits angenommen." : "bereits abgelehnt."}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine offene Anfrage.</p>
                  )}
                </div>
              )}
              {/* Contact Info Card - only when unlocked */}
              {isUnlocked && (
                <ContactInfoCard
                  email={profile?.email || profile?.telefon}
                  phone={profile?.telefon}
                  location={profile?.ort}
                  website={profile?.website}
                />
              )}

              <LinkedInProfileSidebar
                profile={displayProfile}
                isEditing={false}
                onProfileUpdate={() => {}}
                onEditingChange={() => {}}
                readOnly={true}
                showCVSection={isUnlocked}
                showLanguagesAndSkills={true}
                showLicenseAndStats={true}
                showValuesAndInterview={isUnlocked}
                profileId={id || ''}
              />

              {/* Werbung */}
              <AdCard />
            </div>
          </div>
        </div>

        {/* Unlock Modal */}
        {profile && (
          <CandidateUnlockModal
            open={unlockModalOpen}
            onOpenChange={setUnlockModalOpen}
            candidate={{
              id: profile.id,
              user_id: profile.user_id,
              full_name: profile.full_name,
              vorname: profile.vorname,
              nachname: profile.nachname,
            }}
            companyId={company?.id || ""}
            contextApplication={null}
            contextType="none"
            onSuccess={async () => {
              setIsUnlocked(true);
              await loadProfile();
              await checkUnlockState();
              await loadCandidateMeta();
              toast.success("Profil freigeschaltet!");
              setUnlockModalOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
