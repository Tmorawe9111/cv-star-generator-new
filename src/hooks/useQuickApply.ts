import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { useTrackInteraction } from "./useTrackInteraction";
import { trackJobApplication } from "@/lib/telemetry";

export function useQuickApply(jobId: string, jobMetadata?: { branche?: string; berufsfeld?: string; region?: string; company?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { track } = useTrackInteraction();

  const { data: hasApplied, isLoading } = useQuery({
    queryKey: ["application-status", jobId, user?.id],
    enabled: !!user?.id && !!jobId,
    queryFn: async () => {
      // New canonical model: applications.candidate_id = profiles.id (= auth.uid())
      const { data, error } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("candidate_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
  });

  const { data: profileStatus, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile-status", jobId, user?.id],
    enabled: !!user?.id && !!jobId,
    queryFn: async () => {
      // Profil prüfen (profiles Tabelle, nicht candidate_profiles!)
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, vorname, nachname, email, cv_url")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;
      
      const missing: string[] = [];
      const missingFields: string[] = [];
      
      if (!profile) {
        missing.push("Profil muss erstellt werden");
        return {
          hasProfile: false,
          profileId: null,
          missingFields: missing,
          missingDocuments: [],
          profile: null
        };
      }

      // Prüfe grundlegende Profildaten
      if (!profile.vorname) missingFields.push("Vorname");
      if (!profile.nachname) missingFields.push("Nachname");
      if (!profile.email) missingFields.push("E-Mail");
      if (!profile.cv_url) missingFields.push("Lebenslauf");

      if (missingFields.length > 0) {
        missing.push(`Profildaten unvollständig: ${missingFields.join(", ")}`);
      }

      // Job-Details laden um erforderliche Dokumente zu prüfen
      const { data: job, error: jobError } = await supabase
        .from("job_posts")
        .select("required_documents")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      const missingDocuments: string[] = [];

      // Nur prüfen wenn Dokumente erforderlich sind
      if (job?.required_documents && Array.isArray(job.required_documents) && job.required_documents.length > 0) {
        // Benutzer-Dokumente laden
        const { data: userDocs, error: docsError } = await supabase
          .from("user_documents")
          .select("document_type")
          .eq("user_id", user!.id);

        if (docsError) throw docsError;

        const uploadedDocTypes = userDocs?.map(d => d.document_type) || [];

        // Prüfe welche erforderlichen Dokumente fehlen
        for (const reqDoc of job.required_documents) {
          const docType = typeof reqDoc === 'string' ? reqDoc : (reqDoc as any).type;
          const docLabel = typeof reqDoc === 'string' ? reqDoc : ((reqDoc as any).label || (reqDoc as any).type);
          
          if (!uploadedDocTypes.includes(docType)) {
            missingDocuments.push(docLabel);
          }
        }

        if (missingDocuments.length > 0) {
          missing.push("Erforderliche Dokumente fehlen");
        }
      }
      
      return {
        hasProfile: true,
        profileId: profile.id,
        missingFields: missing,
        missingDocuments,
        profile
      };
    },
  });

  const applyToJob = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Nicht eingeloggt");

      // Prüfe ob erforderliche Dokumente fehlen
      if (profileStatus?.missingDocuments && profileStatus.missingDocuments.length > 0) {
        const docList = profileStatus.missingDocuments.join(", ");
        throw new Error(`Bitte lade folgende Dokumente hoch: ${docList}`);
      }

      // Get job details
      const { data: job, error: jobError } = await supabase
        .from("job_posts")
        .select("company_id")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      // Get or create candidate entry for this company
      const { data: existingCandidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", job.company_id)
        .maybeSingle();

      let candidateId: string;

      if (existingCandidate) {
        candidateId = existingCandidate.id;
      } else {
        // ✅ Create minimal candidate link only (no snapshot fields; profiles is source of truth)
        const { data: newCandidate, error: candidateError } = await supabase
          .from("candidates")
          .insert({
            company_id: job.company_id,
            user_id: user.id,
          })
          .select("id")
          .single();

        // If a race condition caused a unique conflict, refetch
        if (candidateError) {
          const msg = (candidateError as any)?.message || "";
          const code = (candidateError as any)?.code || "";
          if (code === "23505" || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
            const { data: existingAfter } = await supabase
              .from("candidates")
              .select("id")
              .eq("user_id", user.id)
              .eq("company_id", job.company_id)
              .maybeSingle();
            if (existingAfter?.id) {
              candidateId = existingAfter.id;
            } else {
              throw candidateError;
            }
          } else {
            throw candidateError;
          }
        } else {
          candidateId = newCandidate.id;
        }
      }

      // Prevent duplicate applications for same job
      // Canonical: applications.candidate_id = profiles.id (= auth.uid()).
      // For safety during migration, also check legacy rows where candidate_id referenced candidates.id.
      const candidateIdsToCheck = [user.id, candidateId].filter(Boolean);
      const { data: existingApplication } = await supabase
        .from("applications")
        .select("id, status")
        .eq("company_id", job.company_id)
        .eq("job_id", jobId)
        .in("candidate_id", candidateIdsToCheck as any)
        .maybeSingle();

      if (existingApplication) {
        throw new Error("Du hast dich bereits auf diese Stelle beworben.");
      }

      // Create application
      const { error: appError } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          company_id: job.company_id,
          candidate_id: user.id,
          status: "new",
          source: "applied",
        });

      if (appError) throw appError;
      
      // Track application for personalization (strongest signal!)
      track('apply', 'job', jobId, jobMetadata || {});
      
      // Track for analytics
      trackJobApplication(jobId, job.company_id, user.id, jobMetadata || {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-status", jobId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-applications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["applications-count", jobId] });
      toast.success("Bewerbung erfolgreich versendet!");
    },
    onError: (error: Error) => {
      console.error("Application error:", error);
      if (error.message.includes("Bitte lade folgende Dokumente hoch")) {
        toast.error(error.message);
      } else if (error.message.includes("Profildaten unvollständig")) {
        toast.error(error.message);
      } else {
        toast.error(`Fehler beim Bewerben: ${error.message}`);
      }
    },
  });

  return {
    hasApplied: hasApplied ?? false,
    isLoading: isLoading || isLoadingProfile,
    applyToJob: applyToJob.mutate,
    isApplying: applyToJob.isPending,
    canApply: (profileStatus?.hasProfile && (!profileStatus?.missingDocuments || profileStatus.missingDocuments.length === 0)) ?? false,
    profileStatus,
  };
}
