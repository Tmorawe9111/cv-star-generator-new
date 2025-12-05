import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, Info, Coins, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TokenDepletedModal } from "@/components/Company/TokenDepletedModal";
import { useCompany } from "@/hooks/useCompany";
import { ScheduleInterviewAfterQuestions } from "@/components/jobs/ScheduleInterviewAfterQuestions";

type UnlockType = "bewerbung" | "initiativ";
type ContextType = "application" | "match" | "none";

type Candidate = { 
  id: string; 
  user_id: string;
  full_name?: string | null;
  vorname?: string | null;
  nachname?: string | null;
};

type ApplicationContext = {
  id: string;
  job_id: string | null;
  job_title?: string | null;
  status?: string | null;
};

type Job = { id: string; title: string; is_active: boolean | null; status?: string | null };

export type CandidateUnlockModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate;
  companyId: string;
  contextApplication?: ApplicationContext | null;
  contextType?: ContextType;
  onSuccess?: () => void;
};

const StepBadge = ({ index, active, done }: { index: number; active: boolean; done: boolean }) => (
  <div className={`flex items-center gap-2 ${done ? "text-emerald-600" : active ? "text-primary" : "text-muted-foreground"}`}>
    <div className={`h-7 w-7 rounded-full border flex items-center justify-center text-sm font-medium ${
      done ? "border-emerald-600 bg-emerald-50" : active ? "border-primary bg-primary/10" : "border-border"
    }`}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : index}
    </div>
  </div>
);

export default function CandidateUnlockModal(props: CandidateUnlockModalProps) {
  const {
    open,
    onOpenChange,
    candidate,
    companyId,
    contextApplication,
    contextType = "none",
    onSuccess,
  } = props;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [unlockType, setUnlockType] = useState<UnlockType>(contextApplication ? "bewerbung" : "initiativ");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(contextApplication?.job_id ?? null);
  const [notes, setNotes] = useState("");
  const [alreadyUnlocked, setAlreadyUnlocked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showTokenDepletedModal, setShowTokenDepletedModal] = useState(false);
  const { company } = useCompany();
  const [nextAction, setNextAction] = useState<"send_questions" | "direct_interview" | "later">("later");
  const [hasJobQuestions, setHasJobQuestions] = useState(false);
  const [companyCandidateId, setCompanyCandidateId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  useEffect(() => {
    if (jobsLoading) return;
    if (!selectedJobId) return;
    if (jobs.some((job) => job.id === selectedJobId)) return;
    setSelectedJobId(null);
  }, [jobs, jobsLoading, selectedJobId]);

  const candidateName = candidate.full_name || 
    (candidate.vorname && candidate.nachname ? `${candidate.vorname} ${candidate.nachname}` : null) ||
    candidate.vorname || 
    "Kandidat";

  const tokenCost = useMemo(() => {
    if (alreadyUnlocked) return 0; // No cost for job assignment
    if (contextType === "match") return 3;
    if (unlockType === "bewerbung") return 1;
    return 2; // initiativ
  }, [unlockType, contextType, alreadyUnlocked]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Nicht angemeldet");
        setCurrentUserId(user.id);

        // Check if already unlocked - use user_id as candidate_id in company_candidates
        const { data: existing } = await supabase
          .from("company_candidates")
          .select("id, unlocked_at, linked_job_ids, notes")
          .eq("company_id", companyId)
          .eq("candidate_id", candidate.user_id)
          .not("unlocked_at", "is", null)
          .maybeSingle();
        
        console.log("🔍 Checking unlock status:", {
          companyId,
          candidateId: candidate.id,
          userId: candidate.user_id,
          existing: existing ? "Already unlocked ✅" : "Not unlocked yet"
        });

        if (existing) {
          setAlreadyUnlocked(true);
          // Pre-populate linked jobs and notes
          const linkedJobIds = Array.isArray(existing.linked_job_ids) 
            ? existing.linked_job_ids 
            : [];
          if (linkedJobIds.length > 0 && typeof linkedJobIds[0] === 'string') {
            setSelectedJobId(linkedJobIds[0]);
          }
          if (typeof existing.notes === 'string') {
            setNotes(existing.notes);
          }
          // Skip to job assignment step
          setStep(2);
        }

        // Fetch active jobs
        setJobsLoading(true);

        const { data: jobsList, error: jobsError } = await supabase
          .from("job_posts")
          .select("id, title, is_active, status")
          .eq("company_id", companyId)
          .order("title", { ascending: true });

        if (jobsError) throw jobsError;
        
        const ACTIVE_STATUS = new Set([
          "published",
          "active",
          "aktiv",
          "online",
          "live",
          "running",
          "visible",
          "open",
        ]);

        let filteredJobs =
          jobsList?.filter((job) => {
            if (!job) return false;
            if (job.is_active === true) return true;
            if (job.is_active === false) return false;
            const normalizedStatus = typeof job.status === "string" ? job.status.toLowerCase() : "";
            return normalizedStatus && ACTIVE_STATUS.has(normalizedStatus);
          }) ?? [];

        // Fallback: try legacy jobs table when nothing returned
        if (filteredJobs.length === 0) {
          const { data: legacyJobs, error: legacyError } = await supabase
            .from("jobs")
            .select("id, title, status, is_active")
            .eq("company_id", companyId)
            .order("title", { ascending: true });

          if (!legacyError) {
            filteredJobs =
              legacyJobs?.filter((job) => {
                if (!job) return false;
                if (job.is_active === true) return true;
                const normalizedStatus = typeof job.status === "string" ? job.status.toLowerCase() : "";
                return normalizedStatus && ACTIVE_STATUS.has(normalizedStatus);
              }) ?? [];
          }
        }

        console.log("🔍 Loaded jobs:", filteredJobs.length, filteredJobs);
        setJobs(filteredJobs);

        if (!jobsList?.length && filteredJobs.length === 0) {
          console.log("⚠️ No active jobs found, defaulting to initiativ");
          setUnlockType("initiativ");
          setSelectedJobId(null);
        }
      } catch (e: any) {
        toast.error(e.message || "Fehler beim Laden");
      } finally {
        setJobsLoading(false);
      }
    })();
  }, [open, companyId, candidate.id]);

  function resetState() {
    setStep(1);
    setLoading(false);
    setUnlockType(contextApplication ? "bewerbung" : "initiativ");
    setSelectedJobId(contextApplication?.job_id ?? null);
    setNotes("");
    setAlreadyUnlocked(false);
    setNextAction("later");
    setHasJobQuestions(false);
    setCompanyCandidateId(null);
    setApplicationId(null);
    setShowInterviewModal(false);
  }
  function handleOpenChange(next: boolean) {
    if (!next) resetState();
    onOpenChange(next);
  }

  async function handleConfirm() {
    if (!currentUserId) return;
    
    setLoading(true);
    let tokenDeducted = false;

    try {
      // If already unlocked, just update job assignment without token deduction
      if (alreadyUnlocked) {
        const linkedJobIds = selectedJobId ? [selectedJobId] : [];
        
        const { error: updateError } = await supabase.rpc(
          "update_candidate_job_assignment",
          {
            p_company_id: companyId,
            p_candidate_id: candidate.id,
            p_linked_job_ids: linkedJobIds,
            p_notes: notes.trim() || null,
          }
        );

        if (updateError) {
          toast.error(`Fehler: ${updateError.message}`);
          return;
        }

        toast.success("Job-Zuordnung erfolgreich aktualisiert");
        onSuccess?.();
        handleOpenChange(false);
        return;
      }

      // Final check for duplicate (new unlocks only) - use user_id
      const { data: existing } = await supabase
        .from("company_candidates")
        .select("id")
        .eq("company_id", companyId)
        .eq("candidate_id", candidate.user_id)
        .not("unlocked_at", "is", null)
        .maybeSingle();

      if (existing) {
        setAlreadyUnlocked(true);
        toast.error("Kandidat ist bereits freigeschaltet");
        setLoading(false);
        return;
      }

      const relatedJobId = unlockType === "bewerbung" 
        ? (selectedJobId || contextApplication?.job_id || null)
        : (selectedJobId || null);

      // Check if company has enough tokens before attempting unlock
      if (company && (company.active_tokens === null || company.active_tokens < tokenCost)) {
        setShowTokenDepletedModal(true);
        setLoading(false);
        return;
      }

      // Deduct tokens using the new RPC function (single call) - use user_id
      const { data: tokenResult, error: tokenError } = await supabase.rpc("use_company_token", {
        p_company_id: companyId,
        p_profile_id: candidate.user_id,
        p_token_cost: tokenCost,
        p_reason: unlockType === "bewerbung" ? "unlock_application" : "unlock_initiative"
      });

      const result = tokenResult as any;
      if (tokenError || !result?.success) {
        const errorMsg = result?.error || tokenError?.message || "Unbekannter Fehler";
        // If error is about insufficient tokens, show token depleted modal
        if (errorMsg.includes("Nicht genügend Tokens") || errorMsg.includes("tokens")) {
          setShowTokenDepletedModal(true);
          setLoading(false);
          return;
        }
        throw new Error(errorMsg);
      }
      
      tokenDeducted = true;

      // Reject original application if job changed
      if (contextApplication?.id && contextApplication.job_id && 
          relatedJobId && relatedJobId !== contextApplication.job_id) {
        
        await supabase
          .from("applications")
          .update({
            status: "rejected",
            company_response_at: new Date().toISOString(),
            rejection_reason: "Für andere Position berücksichtigt"
          })
          .eq("id", contextApplication.id);

        // Notify candidate about reassignment - use user_id
        await supabase.rpc("create_notification", {
          p_recipient_type: "profile",
          p_recipient_id: candidate.user_id,
          p_type: "candidate_message",
          p_title: "Update zu deiner Bewerbung 💡",
          p_body: `Deine Bewerbung auf "${contextApplication.job_title}" wurde leider nicht angenommen. Das Unternehmen hat jedoch dein Profil positiv bewertet und möchte dich gerne für eine andere Stelle oder initiativ in Betracht ziehen.`,
          p_actor_type: "company",
          p_actor_id: companyId,
          p_payload: {
            application_id: contextApplication.id,
            original_job_id: contextApplication.job_id,
            new_job_id: relatedJobId
          },
          p_group_key: `app_reassign_${contextApplication.id}`,
          p_priority: 6
        });
      } else if (unlockType === "initiativ") {
        // Notify candidate about initiativ unlock - use user_id
        await supabase.rpc("create_notification", {
          p_recipient_type: "profile",
          p_recipient_id: candidate.user_id,
          p_type: "company_unlocked_you",
          p_title: "Dein Profil wurde freigeschaltet 🎉",
          p_body: "Ein Unternehmen hat dein Profil auf BeVisiblle freigeschaltet, weil es dich interessant findet – auch ohne konkrete Bewerbung. Du kannst dich jetzt direkt austauschen oder dich für passende Stellen im Unternehmensprofil bewerben.",
          p_actor_type: "company",
          p_actor_id: companyId,
          p_payload: { job_id: relatedJobId },
          p_group_key: null,
          p_priority: 5
        });
      } else if (unlockType === "bewerbung") {
        // Notify about standard unlock - use user_id
        // Include application_id and job_id in payload for interview questions
        // Only send if job has interview questions (optional feature)
        const jobIdForNotification = selectedJobId || contextApplication?.job_id;
        
        // Check if job has interview questions (optional - only notify if questions exist)
        let hasInterviewQuestions = false;
        if (jobIdForNotification) {
          const { data: questions } = await supabase
            .from('company_interview_questions')
            .select('id')
            .eq('role_id', jobIdForNotification)
            .limit(1);
          hasInterviewQuestions = (questions?.length || 0) > 0;
        }

        // Only send notification with interview questions link if questions exist
        // Otherwise, send standard unlock notification
        await supabase.rpc("create_notification", {
          p_recipient_type: "profile",
          p_recipient_id: candidate.user_id,
          p_type: "company_unlocked_you",
          p_title: "Dein Profil wurde freigeschaltet ✅",
          p_body: hasInterviewQuestions
            ? "Das Unternehmen, bei dem du dich beworben hast, hat dein Profil freigeschaltet. Bitte beantworte die Interviewfragen, um dich auf das Gespräch vorzubereiten."
            : "Das Unternehmen, bei dem du dich beworben hast, hat dein Profil freigeschaltet. Du bist jetzt für das Recruiting-Team sichtbar und kannst direkt kontaktiert werden, wenn du in die engere Auswahl kommst.",
          p_actor_type: "company",
          p_actor_id: companyId,
          p_payload: { 
            application_id: contextApplication?.id,
            job_id: jobIdForNotification,
            has_interview_questions: hasInterviewQuestions
          },
          p_group_key: null,
          p_priority: 5
        });
      }

      // Use RPC function to unlock profile (bypasses RLS) - use user_id directly
      const linkedJobIds = selectedJobId ? [selectedJobId] : [];
      
      const { error: unlockError } = await supabase.rpc("unlock_candidate_profile", {
        p_company_id: companyId,
        p_candidate_id: candidate.user_id, // CRITICAL: Use user_id directly
        p_source: unlockType,
        p_unlock_type: unlockType, // 'bewerbung', 'initiativ', 'match', 'community', 'search'
        p_notes: notes.trim() || null,
        p_unlocked_by_user_id: currentUserId,
        p_linked_job_ids: linkedJobIds // ✅ Pass array directly as JSONB
      });

      if (unlockError) {
        throw new Error(unlockError.message || "Fehler beim Freischalten");
      }

      // Track analytics in company_activity
      await supabase.from("company_activity").insert({
        company_id: companyId,
        actor_user_id: currentUserId,
        type: "candidate_unlocked",
        payload: {
          candidate_id: candidate.id,
          unlock_type: unlockType,
          context_type: contextType,
          job_id: relatedJobId,
          token_cost: tokenCost,
          application_id: contextApplication?.id
        }
      });

      // Get company_candidate_id for interview planning
      const { data: companyCandidate } = await supabase
        .from("company_candidates")
        .select("id")
        .eq("company_id", companyId)
        .eq("candidate_id", candidate.user_id)
        .maybeSingle();

      if (companyCandidate) {
        setCompanyCandidateId(companyCandidate.id);
      }

      // Get application_id if exists
      if (contextApplication?.id) {
        setApplicationId(contextApplication.id);
      } else if (relatedJobId) {
        // Try to find application by job_id and candidate_id
        const { data: candidateData } = await supabase
          .from("candidates")
          .select("id")
          .eq("user_id", candidate.user_id)
          .eq("company_id", companyId)
          .maybeSingle();

        if (candidateData) {
          const { data: appData } = await supabase
            .from("applications")
            .select("id")
            .eq("job_id", relatedJobId)
            .eq("candidate_id", candidateData.id)
            .maybeSingle();

          if (appData) {
            setApplicationId(appData.id);
          }
        }
      }

      // Check if job has interview questions
      if (relatedJobId) {
        const { data: questions } = await supabase
          .from('company_interview_questions')
          .select('id')
          .eq('role_id', relatedJobId)
          .limit(1);
        
        setHasJobQuestions((questions?.length || 0) > 0);
      }

      // Success - go to step 4 (next action selection)
      toast.success("Kandidat erfolgreich freigeschaltet");
      setStep(4);

    } catch (e: any) {
      // Rollback tokens if deducted - get current balance and add back
      if (tokenDeducted) {
        try {
          const { data: wallet } = await supabase
            .from("company_token_wallets")
            .select("balance")
            .eq("company_id", companyId)
            .single();
          
          if (wallet) {
            await supabase
              .from("company_token_wallets")
              .update({ balance: wallet.balance + tokenCost })
              .eq("company_id", companyId);
            
            toast.error(`${e.message} - Tokens wurden zurückerstattet`);
          } else {
            toast.error(`${e.message} - Token-Rollback fehlgeschlagen`);
          }
        } catch {
          toast.error(`${e.message} - KRITISCH: Token-Rollback fehlgeschlagen!`);
        }
      } else {
        toast.error(e.message || "Fehler beim Freischalten");
      }
    } finally {
      setLoading(false);
    }
  }

  const jobSelect = (
    <div className="space-y-2">
      <Label>
        Stelle (optional)
        {!jobsLoading && jobs.length === 0 && (
          <span className="ml-2 text-xs text-amber-600 font-normal">
            ⚠️ Keine aktiven Stellen vorhanden
          </span>
        )}
      </Label>
      {jobsLoading ? (
        <div className="rounded-md border border-muted p-3 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Stellen werden geladen...</span>
        </div>
      ) : jobs.length > 0 ? (
        <>
          <Select onValueChange={(v) => setSelectedJobId(v === "none" ? null : v)} value={selectedJobId || "none"}>
            <SelectTrigger>
              <SelectValue placeholder="Stelle wählen (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine bestimmte Stelle (Initiativ)</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contextApplication?.job_title && (
            <p className="text-xs text-muted-foreground">
              Kontext: <span className="font-medium">{contextApplication.job_title}</span>
              {selectedJobId && contextApplication.job_id && selectedJobId !== contextApplication.job_id && (
                <span className="ml-2 text-amber-600">(abweichend von Bewerbung)</span>
              )}
            </p>
          )}
        </>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium mb-1">Keine aktiven Stellenanzeigen</p>
          <p className="text-xs text-amber-700">
            Sie können den Kandidaten trotzdem initiativ freischalten. Erstellen Sie eine Stellenanzeige, um Jobs zuzuordnen.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {alreadyUnlocked ? "Job-Zuordnung bearbeiten" : "Kandidat freischalten"}
          </DialogTitle>
          <DialogDescription>
            {alreadyUnlocked 
              ? `Bearbeiten Sie die Job-Zuordnung für ${candidateName}`
              : `${candidateName} freischalten für ${tokenCost} Token${tokenCost !== 1 ? "s" : ""}`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps - Hide for already unlocked */}
        {!alreadyUnlocked && (
          <div className="flex items-center gap-4 mb-4">
            <StepBadge index={1} active={step === 1} done={step > 1} />
            <div className={`h-[2px] grow ${step > 1 ? "bg-emerald-600" : "bg-border"}`} />
            <StepBadge index={2} active={step === 2} done={step > 2} />
            <div className={`h-[2px] grow ${step > 2 ? "bg-emerald-600" : "bg-border"}`} />
            <StepBadge index={3} active={step === 3} done={step > 3} />
            <div className={`h-[2px] grow ${step > 3 ? "bg-emerald-600" : "bg-border"}`} />
            <StepBadge index={4} active={step === 4} done={false} />
          </div>
        )}

        {/* Info Banner for already unlocked */}
        {alreadyUnlocked && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ✓ Kandidat bereits freigeschaltet - Sie können die Job-Zuordnung anpassen
            </p>
          </div>
        )}

        <div className="min-h-[220px]">
          {!alreadyUnlocked && step === 1 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-lg border p-4">
                <Label className="mb-2 block">Freischaltungsgrund</Label>
                <RadioGroup value={unlockType} onValueChange={(v) => setUnlockType(v as UnlockType)} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem id="bewerbung" value="bewerbung" disabled={!contextApplication} />
                    <div className="grid gap-1 flex-1">
                      <Label htmlFor="bewerbung" className={!contextApplication ? "opacity-50" : ""}>
                        Basierend auf Bewerbung
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {contextApplication 
                          ? "Freischaltung mit Bewerbungskontext (1 Token)"
                          : "Nicht verfügbar: Kein Bewerbungskontext"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RadioGroupItem id="initiativ" value="initiativ" />
                    <div className="grid gap-1 flex-1">
                      <Label htmlFor="initiativ">Initiativ (ohne Bewerbung)</Label>
                      <p className="text-xs text-muted-foreground">
                        Optional Stelle auswählen oder komplett initiativ (2 Tokens)
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <Coins className="h-4 w-4" />
                <span>
                  Kosten: <strong>{tokenCost} Token{tokenCost !== 1 && "s"}</strong>
                  {contextType === "match" && " (Match-Freischaltung)"}
                </span>
              </div>
            </motion.div>
          )}

          {(alreadyUnlocked || step === 2) && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {jobSelect}
              <div className="space-y-2">
                <Label>Interne Notiz (optional)</Label>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Warum ist der Kandidat interessant? Für welche Rolle?"
                  rows={3}
                />
              </div>
              {contextApplication?.job_id && selectedJobId && selectedJobId !== contextApplication.job_id && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
                  ⚠️ Die ursprüngliche Bewerbung wird als <strong>abgelehnt</strong> markiert
                </div>
              )}
            </motion.div>
          )}

          {!alreadyUnlocked && step === 3 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Kandidat:</span>{" "}
                  <span className="font-medium">{candidateName}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Art:</span>{" "}
                  <span className="font-medium">{unlockType === "bewerbung" ? "Bewerbung" : "Initiativ"}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Stelle:</span>{" "}
                  {selectedJobId ? (
                    <span className="font-medium">{jobs.find(j => j.id === selectedJobId)?.title || "(gewählt)"}</span>
                  ) : (
                    <span className="font-medium">Keine (Initiativ)</span>
                  )}
                </div>
                {notes.trim() && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notiz:</span> {notes.trim()}
                  </div>
                )}
                <div className="text-sm pt-2 border-t flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-600" />
                  <span>
                    <strong>{tokenCost} Token{tokenCost !== 1 && "s"}</strong> werden abgezogen
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {!alreadyUnlocked && step === 4 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Was möchten Sie als Nächstes tun?</h3>
                  <p className="text-sm text-muted-foreground">
                    Sie haben {candidateName} erfolgreich freigeschaltet. Wählen Sie die nächste Aktion:
                  </p>
                </div>

                <RadioGroup 
                  value={nextAction} 
                  onValueChange={(v) => setNextAction(v as typeof nextAction)}
                  className="space-y-3"
                >
                  {hasJobQuestions && selectedJobId && (
                    <div className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="send_questions" id="send_questions" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="send_questions" className="cursor-pointer font-medium flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Interview-Fragen senden
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Der Kandidat beantwortet die spezifischen Fragen für diese Stelle. Danach können Sie ein Interview planen.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="direct_interview" id="direct_interview" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="direct_interview" className="cursor-pointer font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Direkt Interview einladen
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Die allgemeinen Profil-Fragen passen bereits. Planen Sie direkt einen Interview-Termin.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="later" id="later" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="later" className="cursor-pointer font-medium">
                        Später entscheiden
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sie können später im Profil des Kandidaten eine Aktion wählen.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Abbrechen
          </Button>

          {alreadyUnlocked ? (
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? "Wird gespeichert..." : "Job-Zuordnung speichern"}
            </Button>
          ) : (
            <>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  Zurück
                </Button>
              )}

              {step < 3 && (
                <Button onClick={() => setStep(step + 1)} disabled={loading}>
                  Weiter
                </Button>
              )}

              {step === 3 && (
                <Button onClick={handleConfirm} disabled={loading}>
                  {loading ? "Wird freigeschaltet..." : "Freischalten"}
                </Button>
              )}

              {step === 4 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleOpenChange(false);
                      onSuccess?.();
                    }}
                  >
                    Überspringen
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (nextAction === "send_questions") {
                        // Send notification with link to interview questions
                        const jobIdForNotification = selectedJobId || contextApplication?.job_id;
                        if (jobIdForNotification) {
                          await supabase.rpc("create_notification", {
                            p_recipient_type: "profile",
                            p_recipient_id: candidate.user_id,
                            p_type: "company_unlocked_you",
                            p_title: "Interviewfragen beantworten 📝",
                            p_body: "Das Unternehmen hat Sie freigeschaltet und möchte, dass Sie die Interviewfragen für diese Stelle beantworten.",
                            p_actor_type: "company",
                            p_actor_id: companyId,
                            p_payload: { 
                              application_id: applicationId || null,
                              job_id: jobIdForNotification,
                              has_interview_questions: true,
                              action: "answer_questions"
                            },
                            p_group_key: null,
                            p_priority: 5
                          });
                          toast.success("Interview-Fragen wurden an den Kandidaten gesendet.");
                        } else {
                          toast.error("Keine Stelle ausgewählt. Bitte wählen Sie eine Stelle aus.");
                          return;
                        }
                        handleOpenChange(false);
                        onSuccess?.();
                      } else if (nextAction === "direct_interview") {
                        // Open interview scheduling modal
                        // We need at least companyCandidateId - applicationId and jobId are optional
                        if (companyCandidateId) {
                          setShowInterviewModal(true);
                        } else {
                          toast.error("Fehler: Kandidat-ID nicht gefunden. Bitte versuchen Sie es später im Profil.");
                          handleOpenChange(false);
                          onSuccess?.();
                        }
                      } else {
                        // Later - just close
                        handleOpenChange(false);
                        onSuccess?.();
                      }
                    }}
                  >
                    {nextAction === "send_questions" && "Fragen senden"}
                    {nextAction === "direct_interview" && "Interview planen"}
                    {nextAction === "later" && "Fertig"}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <TokenDepletedModal
        open={showTokenDepletedModal}
        onOpenChange={setShowTokenDepletedModal}
        companyId={companyId}
        context="unlock"
      />

      {/* Interview Scheduling Modal */}
      {showInterviewModal && companyCandidateId && (
        <ScheduleInterviewAfterQuestions
          open={showInterviewModal}
          onOpenChange={(open) => {
            setShowInterviewModal(open);
            if (!open) {
              handleOpenChange(false);
              onSuccess?.();
            }
          }}
          applicationId={applicationId || ""}
          jobId={selectedJobId || ""}
          companyId={companyId}
          candidateName={candidateName}
          companyCandidateId={companyCandidateId}
          onComplete={() => {
            setShowInterviewModal(false);
            handleOpenChange(false);
            onSuccess?.();
          }}
        />
      )}
    </Dialog>
  );
}
