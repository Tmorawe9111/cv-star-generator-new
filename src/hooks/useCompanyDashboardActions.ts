import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { changeCandidateStatus } from "@/lib/api/candidates";
import { setApplicationStatus } from "@/lib/api/applications";
import type { ApplicationStatus } from "@/utils/applicationStatus";
import type { CandidateListItem } from "@/components/recruiter-dashboard/CandidateList";
import type { DashboardTab } from "@/types/dashboard";

export interface UseCompanyDashboardActionsOptions {
  companyId: string | null | undefined;
  loadDashboardSnapshot: () => Promise<void>;
}

export interface UseCompanyDashboardActionsResult {
  pendingActionId: string | null;
  handleUnlockCandidate: (candidate: CandidateListItem) => Promise<void>;
  handleAssignApplication: (candidate: CandidateListItem) => Promise<void>;
  handlePlanInterview: (
    candidate: CandidateListItem,
    plannedAtIso: string,
    interviewType: "vor_ort" | "online",
    locationAddress?: string,
    companyMessage?: string
  ) => Promise<void>;
  handleCompleteInterview: (candidate: CandidateListItem, completedAtIso?: string) => Promise<void>;
  handleCancelCandidate: (candidate: CandidateListItem) => Promise<void>;
  handleRejectCandidate: (candidate: CandidateListItem) => Promise<void>;
  handleViewProfile: (candidateId: string) => void;
  handleViewAll: (stage?: DashboardTab) => void;
  handleDownloadCV: (candidateId: string) => Promise<void>;
}

export function useCompanyDashboardActions({
  companyId,
  loadDashboardSnapshot,
}: UseCompanyDashboardActionsOptions): UseCompanyDashboardActionsResult {
  const navigate = useNavigate();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const handleUnlockCandidate = useCallback(
    async (candidate: CandidateListItem) => {
      if (!companyId) return;
      setPendingActionId(candidate.id);
      try {
        await changeCandidateStatus({
          companyCandidateId: candidate.jobCandidateId!,
          nextStatus: "FREIGESCHALTET",
        });
        toast.success(`${candidate.name} wurde freigeschaltet.`);
        await loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Freischalten fehlgeschlagen.");
      } finally {
        setPendingActionId(null);
      }
    },
    [companyId, loadDashboardSnapshot]
  );

  const handleAssignApplication = useCallback(
    async (candidate: CandidateListItem) => {
      if (!companyId || !candidate.candidateId) return;
      setPendingActionId(candidate.id);
      try {
        let applicationId = candidate.applicationId;
        let candidateData: { id: string } | null = null;

        if (!applicationId) {
          const { data: candidateDataResult, error: candidateError } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", candidate.candidateId)
            .eq("company_id", companyId)
            .maybeSingle();

          if (candidateError || !candidateDataResult) throw new Error("Candidate not found");
          candidateData = candidateDataResult;

          let appQuery = supabase
            .from("applications")
            .select("id, job_id, status, source")
            .eq("company_id", companyId)
            .eq("candidate_id", candidateData.id);
          if (candidate.jobId) appQuery = appQuery.eq("job_id", candidate.jobId);

          const { data: appData, error: appError } = await appQuery.maybeSingle();
          if (!appError && appData) applicationId = appData.id;
          else if (candidate.jobId) {
            const { data: retry } = await supabase
              .from("applications")
              .select("id")
              .eq("company_id", companyId)
              .eq("candidate_id", candidateData.id)
              .maybeSingle();
            if (retry) applicationId = retry.id;
          }
        }

        if (!applicationId && candidate.origin === "bewerbung") {
          if (!candidateData) {
            const { data: cd, error: ce } = await supabase
              .from("candidates")
              .select("id")
              .eq("user_id", candidate.candidateId)
              .eq("company_id", companyId)
              .maybeSingle();
            if (ce || !cd) throw new Error("Candidate not found");
            candidateData = cd;
          }
          const { data: unlockData, error: unlockError } = await supabase.rpc("unlock_candidate", {
            _company_id: companyId,
            _candidate_id: candidateData!.id,
            _job_id: candidate.jobId || null,
          });
          if (unlockError) throw unlockError;
          if (unlockData?.application_id) applicationId = unlockData.application_id;
          else {
            const { data: retry } = await supabase
              .from("applications")
              .select("id")
              .eq("company_id", companyId)
              .eq("candidate_id", candidateData!.id)
              .maybeSingle();
            if (!retry) throw new Error("unlock_candidate did not create application");
            applicationId = retry.id;
          }
        }

        if (!applicationId) throw new Error("Application ID not found");

        if (candidate.jobId) {
          await supabase.rpc("update_candidate_job_assignment", {
            p_company_id: companyId,
            p_candidate_id: candidate.candidateId,
            p_linked_job_ids: [candidate.jobId],
            p_notes: null,
          });
        }

        await setApplicationStatus({ applicationId, newStatus: "unlocked" as ApplicationStatus });
        const jobTitleText = candidate.jobTitle ? ` für die Stelle "${candidate.jobTitle}"` : "";
        toast.success(`Bewerbung wurde${jobTitleText} angenommen und ist jetzt aktiv.`);
        await loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Bewerbung konnte nicht angenommen werden.");
      } finally {
        setPendingActionId(null);
      }
    },
    [companyId, loadDashboardSnapshot]
  );

  const handlePlanInterview = useCallback(
    async (
      candidate: CandidateListItem,
      plannedAtIso: string,
      interviewType: "vor_ort" | "online",
      locationAddress?: string,
      companyMessage?: string
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
        await loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Interview-Anfrage konnte nicht gesendet werden.");
      } finally {
        setPendingActionId(null);
      }
    },
    [loadDashboardSnapshot]
  );

  const handleCompleteInterview = useCallback(
    async (candidate: CandidateListItem, completedAtIso?: string) => {
      if (!candidate.jobCandidateId) return;
      setPendingActionId(candidate.id);
      try {
        await changeCandidateStatus({
          companyCandidateId: candidate.jobCandidateId,
          nextStatus: "INTERVIEW_DURCHGEFÜHRT",
          meta: { interview_date: completedAtIso ?? new Date().toISOString() },
        });
        toast.success("Interview dokumentiert.");
        await loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Interview konnte nicht dokumentiert werden.");
      } finally {
        setPendingActionId(null);
      }
    },
    [loadDashboardSnapshot]
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
        await loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Absage fehlgeschlagen.");
      } finally {
        setPendingActionId(null);
      }
    },
    [loadDashboardSnapshot]
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
        await loadDashboardSnapshot();
      } catch (error) {
        console.error(error);
        toast.error("Aktion fehlgeschlagen.");
      } finally {
        setPendingActionId(null);
      }
    },
    [loadDashboardSnapshot]
  );

  const handleViewProfile = useCallback(
    (candidateId: string) => {
      navigate("/company/profile/" + candidateId, {
        state: { from: { pathname: "/company/dashboard", search: "" }, label: "Dashboard" },
      });
    },
    [navigate]
  );

  const handleViewAll = useCallback(
    (stage?: DashboardTab) => {
      const statusFilter =
        stage === "new"
          ? ["BEWERBUNG_EINGEGANGEN", "NEW"]
          : stage === "unlocked"
            ? ["FREIGESCHALTET"]
            : stage === "planned"
              ? ["INTERVIEW_GEPLANT"]
              : [];
      navigate("/company/unlocked", {
        state: {
          from: { pathname: "/company/dashboard", search: "" },
          label: "Dashboard",
          initialStageFilters: statusFilter,
        },
      });
    },
    [navigate]
  );

  const handleDownloadCV = useCallback(
    async (candidateId: string) => {
      if (!companyId) return;
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", candidateId)
          .single();
        if (error || !profile) {
          toast.error("Profil nicht gefunden.");
          return;
        }
        const { data: companyCandidate } = await supabase
          .from("company_candidates")
          .select("id, status")
          .eq("company_id", companyId)
          .eq("candidate_id", candidateId)
          .maybeSingle();
        const isUnlocked =
          companyCandidate &&
          ["FREIGESCHALTET", "INTERVIEW_GEPLANT", "INTERVIEW_DURCHGEFÜHRT", "ANGEBOT_GESENDET", "EINGESTELLT"].includes(
            companyCandidate.status
          );
        if (!isUnlocked) {
          toast.error("Profil muss freigeschaltet sein, um den CV herunterzuladen.");
          return;
        }
        const tempContainer = document.createElement("div");
        tempContainer.style.cssText =
          "position:fixed;left:-10000px;top:0;width:794px;height:1123px;background:white";
        document.body.appendChild(tempContainer);
        const BerlinLayout = (await import("@/components/cv-layouts/BerlinLayout")).default;
        const layouts = await Promise.all([
          import("@/components/cv-layouts/MuenchenLayout"),
          import("@/components/cv-layouts/HamburgLayout"),
          import("@/components/cv-layouts/KoelnLayout"),
          import("@/components/cv-layouts/FrankfurtLayout"),
          import("@/components/cv-layouts/DuesseldorfLayout"),
          import("@/components/cv-layouts/StuttgartLayout"),
          import("@/components/cv-layouts/DresdenLayout"),
          import("@/components/cv-layouts/LeipzigLayout"),
        ]);
        const layoutMap: Record<number, (props: { data: Record<string, unknown> }) => React.ReactElement> = {
          1: BerlinLayout,
          2: layouts[0].default,
          3: layouts[1].default,
          4: layouts[2].default,
          5: layouts[3].default,
          6: layouts[4].default,
          7: layouts[5].default,
          8: layouts[6].default,
          9: layouts[7].default,
        };
        const layoutId = profile.layout || 1;
        const LayoutComponent = layoutMap[layoutId] ?? BerlinLayout;
        const getJobTitle = () => {
          if (profile.status === "azubi" && profile.ausbildungsberuf) return `${profile.ausbildungsberuf} (Azubi)`;
          if (profile.status === "schueler" && profile.schule) return profile.schule;
          if (profile.status === "ausgelernt" && profile.aktueller_beruf) return profile.aktueller_beruf;
          return profile.headline || profile.branche;
        };
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
        const React = await import("react");
        const ReactDOM = await import("react-dom/client");
        const root = ReactDOM.createRoot(tempContainer);
        root.render(React.createElement(LayoutComponent, { data: cvData }));
        await new Promise((r) => setTimeout(r, 1000));
        const cvPreviewElement = tempContainer.querySelector("[data-cv-preview]") as HTMLElement;
        if (!cvPreviewElement) throw new Error("CV preview element not found");
        const { generatePDF, generateCVFilename } = await import("@/lib/pdf-generator");
        await generatePDF(cvPreviewElement, {
          filename: generateCVFilename(profile.vorname, profile.nachname),
          quality: 2,
          format: "a4",
          margin: 10,
        });
        document.body.removeChild(tempContainer);
        root.unmount();
        toast.success("CV wird heruntergeladen");
      } catch (error) {
        console.error("Error downloading CV:", error);
        toast.error("Fehler beim Herunterladen des CVs");
      }
    },
    [companyId]
  );

  return {
    pendingActionId,
    handleUnlockCandidate,
    handleAssignApplication,
    handlePlanInterview,
    handleCompleteInterview,
    handleCancelCandidate,
    handleRejectCandidate,
    handleViewProfile,
    handleViewAll,
    handleDownloadCV,
  };
}
