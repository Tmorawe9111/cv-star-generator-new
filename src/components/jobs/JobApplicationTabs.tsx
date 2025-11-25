import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { setApplicationStatus } from "@/lib/api/applications";
import type { ApplicationStatus } from "@/utils/applicationStatus";
import { MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import CandidateProfilePreviewModal from "@/components/candidate/CandidateProfilePreviewModal";
import { sanitizePreviewProfile } from "@/utils/sanitizePreviewProfile";
import { ProfileCard } from "@/components/profile/ProfileCard";
import RejectApplicationDialog from "@/components/jobs/RejectApplicationDialog";

interface JobApplicationTabsProps {
  jobId: string;
  companyId: string;
  job?: {
    title: string;
    city?: string;
    employment_type?: string;
    industry?: string;
  };
}

const parseJsonField = (field: any) => {
  if (field === null || field === undefined) return null;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  }
  return field;
};

export function JobApplicationTabs({ jobId, companyId, job }: JobApplicationTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const statusParam = urlParams.get("status") || "new";
  
  const [activeTab, setActiveTab] = useState(statusParam);
  const [previewProfile, setPreviewProfile] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewApplication, setPreviewApplication] = useState<any>(null);
  const [selectedApplicationInfo, setSelectedApplicationInfo] = useState<{
    id: string;
    candidateId?: string;
    jobId?: string | null;
    jobTitle?: string | null;
    jobCity?: string | null;
    status?: string | null;
    createdAt?: string | null;
  } | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [applicationToReject, setApplicationToReject] = useState<any>(null);

  // Sync URL with tab
  useEffect(() => {
    const newStatus = urlParams.get("status") || "new";
    if (newStatus !== activeTab) {
      setActiveTab(newStatus);
    }
  }, [location.search]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(location.search);
    params.set("status", value);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  // Fetch applications with candidates
  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      // First, load applications with candidates
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select(`
          *,
          unlocked_at,
          candidates (
            id,
            user_id,
            full_name,
            email,
            phone,
            city,
            country,
            skills,
            profile_image,
            experience_years,
            bio_short
          )
        `)
        .eq("job_id", jobId)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;
      if (!appsData) return [];

      // For each application, check if candidate is already unlocked in company_candidates
      // AND load profile data if unlocked
      const applicationsWithUnlockStatus = await Promise.all(
        appsData.map(async (app: any) => {
          const candidate = app.candidates;
          const userId = candidate?.user_id;
          
          if (userId) {
            // Check if candidate is already unlocked in company_candidates
            const { data: companyCandidate } = await supabase
              .from("company_candidates")
              .select("id, unlocked_at, candidate_id")
              .eq("company_id", companyId)
              .eq("candidate_id", userId)
              .not("unlocked_at", "is", null)
              .maybeSingle();

            // If unlocked, also load profile data for full name
            let profileData = null;
            if (companyCandidate) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("id, vorname, nachname, avatar_url, email, telefon, ort")
                .eq("id", userId)
                .maybeSingle();
              profileData = profile;
            }

            return {
              ...app,
              company_candidates: companyCandidate ? [companyCandidate] : null,
              profile_data: profileData, // Add profile data if unlocked
            };
          }
          
          return {
            ...app,
            company_candidates: null,
            profile_data: null,
          };
        })
      );

      return applicationsWithUnlockStatus;
    },
  });

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      await setApplicationStatus({
        applicationId,
        newStatus,
      });

      toast({
        title: "Status aktualisiert",
        description: "Der Bewerbungsstatus wurde erfolgreich geändert.",
      });

      refetch();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const loadFullProfileForPreview = async (candidateId: string, unlocked: boolean) => {
    console.log("Loading full profile for preview:", { candidateId, unlocked, companyId });
    
    // First, try to load directly from profiles table
    let { data: fullProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", candidateId)
      .single();

    console.log("Direct profile load result:", { hasData: !!fullProfile, error: error?.code, errorMessage: error?.message });

    // If that fails (e.g., profile is invisible), try to load via RPC function
    // This ensures we can always see profile data for applicants, even if they're invisible
    if (error && (error.code === 'PGRST116' || error.message?.includes('0 rows') || error.message?.includes('multiple'))) {
      console.log("Direct load failed, trying RPC function...");
      
      // Use the RPC function that bypasses visibility restrictions for applications
      const { data: rpcData, error: rpcError } = await supabase
        .rpc("get_full_profile_for_application", {
          p_company_id: companyId,
          p_profile_id: candidateId,
        });

      console.log("RPC function result:", { hasData: !!rpcData, dataLength: rpcData?.length, error: rpcError?.code, errorMessage: rpcError?.message });

      if (!rpcError && rpcData && rpcData.length > 0) {
        // RPC returns array, get first element
        fullProfile = rpcData[0] as any;
        error = null;
        console.log("Successfully loaded profile via RPC:", { hasVorname: !!fullProfile.vorname, hasNachname: !!fullProfile.nachname });
      } else {
        // Fallback: try loading via applications table with profile join
        console.log("RPC failed, trying applications table...");
        const { data: appData, error: appError } = await supabase
          .from("applications")
          .select(`
            candidate_id,
            profiles:candidate_id (*)
          `)
          .eq("company_id", companyId)
          .eq("candidate_id", candidateId)
          .maybeSingle();

        console.log("Applications table result:", { hasData: !!appData, hasProfile: !!appData?.profiles, error: appError?.code });

        if (!appError && appData?.profiles) {
          fullProfile = appData.profiles;
          error = null;
          console.log("Successfully loaded profile via applications table:", { hasVorname: !!fullProfile.vorname, hasNachname: !!fullProfile.nachname });
        } else {
          console.error("All profile load methods failed:", { rpcError, appError, originalError: error });
          throw rpcError || appError || error;
        }
      }
    }

    if (error) {
      console.error("Final error loading profile:", error);
      throw error;
    }
    if (!fullProfile) {
      console.error("No profile data found");
      throw new Error("Profil nicht gefunden");
    }

    console.log("Profile loaded successfully:", { 
      id: fullProfile.id, 
      vorname: fullProfile.vorname, 
      nachname: fullProfile.nachname,
      hasFaehigkeiten: !!fullProfile.faehigkeiten,
      hasBerufserfahrung: !!fullProfile.berufserfahrung,
      hasSchulbildung: !!fullProfile.schulbildung
    });

    const rawProfile = fullProfile as any;
    const parsedProfile = {
      ...rawProfile,
      berufserfahrung: parseJsonField(rawProfile.berufserfahrung) || [],
      schulbildung: parseJsonField(rawProfile.schulbildung) || [],
      faehigkeiten: parseJsonField(rawProfile.faehigkeiten) || [],
      sprachkenntnisse: parseJsonField(rawProfile.sprachkenntnisse) || [],
      sprachen: parseJsonField(rawProfile.sprachen) || [],
      languages: parseJsonField(rawProfile.languages) || [],
    };

    const sanitizedProfile = sanitizePreviewProfile(parsedProfile, unlocked);
    console.log("Sanitized profile:", { 
      id: sanitizedProfile.id, 
      vorname: sanitizedProfile.vorname, 
      nachname: sanitizedProfile.nachname,
      isUnlocked: sanitizedProfile.is_unlocked
    });
    setPreviewProfile(sanitizedProfile);
  };

  const openPreview = async (application: any) => {
    const candidate = application.candidates;
    const candidateId = candidate?.id || application.candidate_id;
    // Check unlocked_at - if set, candidate is unlocked (fully visible)
    const isUnlocked = !!application.unlocked_at;

    setPreviewOpen(true);
    setLoadingPreview(true);
    setPreviewApplication(application);
    setSelectedApplicationInfo({
      id: application.id,
      candidateId,
      jobId: application.job_id,
      jobTitle: job?.title || null,
      jobCity: job?.city || null,
      status: application.status,
      createdAt: application.created_at,
    });

    const baseCandidate = {
      ...candidate,
      id: candidateId,
      user_id: candidate?.user_id || candidateId,
    };
    const initialPreview = sanitizePreviewProfile(baseCandidate, isUnlocked);
    setPreviewProfile(initialPreview);

    try {
      await loadFullProfileForPreview(candidateId, isUnlocked);
    } catch (error) {
      console.error("Error loading profile preview:", error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleReject = (application: any) => {
    openRejectDialog(application);
  };

  const handleUnlock = (application: any) => {
    openPreview(application);
  };

  const handleAssignApplication = async (application: any) => {
    if (!application.id || !companyId || !jobId) return;
    
    try {
      const candidate = application.candidates || {};
      // Use user_id (profiles.id) for company_candidates, not candidates.id
      const userId = candidate?.user_id;
      
      if (!userId) {
        toast({
          title: "Fehler",
          description: "Kandidaten-ID nicht gefunden.",
          variant: "destructive",
        });
        return;
      }

      // Update job assignment if candidate is already unlocked
      const { error: updateError } = await supabase.rpc(
        "update_candidate_job_assignment",
        {
          p_company_id: companyId,
          p_candidate_id: userId, // Use user_id (profiles.id)
          p_linked_job_ids: [jobId] as any, // JSONB array
          p_notes: null,
        }
      );

      if (updateError) {
        console.error("Error updating job assignment:", updateError);
        // Continue anyway to update application status
      }

      // Set application status to "unlocked" to move to next phase
      await setApplicationStatus({
        applicationId: application.id,
        newStatus: "unlocked",
      });

      // Switch to unlocked tab to show the assigned application
      setActiveTab("unlocked");
      
      toast({
        title: "Angenommen",
        description: `Die Bewerbung wurde angenommen und der Kandidat ist jetzt für die Stelle "${job?.title || ""}" freigeschaltet.`,
      });

      // Refetch to update the list
      refetch();
    } catch (error) {
      console.error("Error assigning application:", error);
      toast({
        title: "Fehler",
        description: "Bewerbung konnte nicht zugeordnet werden.",
        variant: "destructive",
      });
    }
  };

  const handleUnlockSuccess = async () => {
    if (!selectedApplicationInfo) return;

    try {
      // Refetch applications to get updated unlocked_at
      await refetch();

      // Update preview application with unlocked_at
      if (previewApplication) {
        setPreviewApplication((prev: any) => (prev ? { ...prev, unlocked_at: new Date().toISOString() } : null));
      }

      setPreviewProfile((prev: any) => (prev ? { ...prev, is_unlocked: true } : prev));
      setSelectedApplicationInfo((prev) => (prev ? { ...prev, status: "unlocked" } : prev));

      if (selectedApplicationInfo.candidateId) {
        try {
          await loadFullProfileForPreview(selectedApplicationInfo.candidateId, true);
        } catch (error) {
          console.error("Error refreshing unlocked profile:", error);
        }
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error?.message || "Profil konnte nicht freigeschaltet werden.",
        variant: "destructive",
      });
    }
  };

  const openRejectDialog = (application: any) => {
    setPreviewApplication(application);
    setSelectedApplicationInfo({
      id: application.id,
      candidateId: application.candidates?.id || application.candidate_id,
      jobId: application.job_id,
      jobTitle: job?.title || null,
      jobCity: job?.city || null,
      status: application.status,
      createdAt: application.created_at,
    });
    setApplicationToReject(application);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async ({ reasonShort, reasonCustom }: { reasonShort: string; reasonCustom?: string }) => {
    if (!applicationToReject) return;

    try {
      setIsRejecting(true);
      await setApplicationStatus({
        applicationId: applicationToReject.id,
        newStatus: "rejected",
        reasonShort,
        reasonCustom,
      });

      toast({
        title: "Bewerbung abgelehnt",
        description: "Der Kandidat wurde in die entsprechende Spalte verschoben.",
      });

      if (selectedApplicationInfo?.id === applicationToReject.id) {
        setPreviewOpen(false);
        setPreviewProfile(null);
        setSelectedApplicationInfo(null);
        setPreviewApplication(null);
      }

      setRejectDialogOpen(false);
      setApplicationToReject(null);
      refetch();
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      toast({
        title: "Fehler",
        description: error?.message || "Die Bewerbung konnte nicht abgelehnt werden.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const TABS: Array<{ value: string; label: string; statuses: ApplicationStatus[] }> = useMemo(
    () => [
      { value: "new", label: "Neue Bewerbungen", statuses: ["new"] },
      { value: "unlocked", label: "Freigeschaltete Talente", statuses: ["unlocked"] },
      { value: "interview", label: "Im Gespräch", statuses: ["interview"] },
      { value: "offer", label: "Angebot", statuses: ["offer"] },
      { value: "rejected", label: "Absagen", statuses: ["rejected"] },
      { value: "hired", label: "Eingestellt", statuses: ["hired"] },
    ],
    [],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TABS.forEach((tab) => {
      counts[tab.value] = applications?.filter((app: any) => tab.statuses.includes(app.status))?.length || 0;
    });
    return counts;
  }, [TABS, applications]);

  const activeTabConfig = TABS.find((tab) => tab.value === activeTab) ?? TABS[0];

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    return applications.filter((app: any) => activeTabConfig.statuses.includes(app.status));
  }, [applications, activeTabConfig]);

  const STATUS_TO_STAGE: Partial<Record<ApplicationStatus, string>> = {
    unlocked: "FREIGESCHALTET",
    interview: "INTERVIEW_GEPLANT",
    offer: "ANGEBOT_GESENDET",
    hired: "EINGESTELLT",
    rejected: "ABGELEHNT",
  };

  const renderApplicationActions = (app: any) => {
    switch (app.status as ApplicationStatus) {
      case "new":
        // Check if candidate is already unlocked (unlocked_at is set in applications OR in company_candidates)
        const companyCandidate = Array.isArray(app.company_candidates) 
          ? app.company_candidates[0] 
          : app.company_candidates;
        const isAlreadyUnlocked = !!app.unlocked_at || !!companyCandidate?.unlocked_at;
        
        return (
          <div className="flex flex-col gap-2 sm:flex-row min-w-0">
            {isAlreadyUnlocked ? (
              <Button className="flex-1 min-w-0 h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4" onClick={() => handleAssignApplication(app)} disabled={isRejecting}>
                <span className="truncate">Annehmen</span>
              </Button>
            ) : (
              <Button className="flex-1 min-w-0 h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4" onClick={() => handleUnlock(app)} disabled={isRejecting}>
                <span className="truncate">Profil freischalten</span>
              </Button>
            )}
            <Button variant="outline" className="flex-1 sm:flex-initial min-w-0 h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4" onClick={() => handleReject(app)} disabled={isRejecting}>
              <span className="truncate">Ablehnen</span>
            </Button>
          </div>
        );
      case "unlocked":
        return (
          <div className="flex flex-col gap-2 sm:flex-row min-w-0">
            <Button className="flex-1 min-w-0 h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4" onClick={() => handleStatusChange(app.id, "interview")} disabled={isRejecting}>
              <span className="truncate">Gespräch planen</span>
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-initial min-w-0 h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4" onClick={() => handleReject(app)} disabled={isRejecting}>
              <span className="truncate">Absagen</span>
            </Button>
          </div>
        );
      case "interview":
        return (
          <div className="flex flex-col gap-2 sm:flex-row min-w-0">
            <Button className="flex-1 min-w-0 h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4" onClick={() => handleStatusChange(app.id, "offer")} disabled={isRejecting}>
              <span className="truncate">Gespräch durchgeführt</span>
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-initial min-w-0 h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4" onClick={() => handleReject(app)} disabled={isRejecting}>
              <span className="truncate">Absagen</span>
            </Button>
          </div>
        );
      case "offer":
        return (
          <div className="flex flex-col gap-2 sm:flex-row min-w-0">
            <Button className="flex-1 min-w-0 h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4" onClick={() => handleStatusChange(app.id, "hired")} disabled={isRejecting}>
              <span className="truncate">Einstellung bestätigen</span>
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-initial min-w-0 h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4" onClick={() => handleReject(app)} disabled={isRejecting}>
              <span className="truncate">Absagen</span>
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const buildProfileData = (app: any) => {
    const candidate = app.candidates || {};
    const profile = app.profile_data || {}; // Use profile data if available
    const parsedSkills = parseJsonField(candidate.skills);
    const skillsArray = Array.isArray(parsedSkills) ? parsedSkills : [];
    const stage = STATUS_TO_STAGE[app.status as ApplicationStatus] || undefined;
    // Check unlocked_at - if set in applications OR in company_candidates, candidate is unlocked (fully visible)
    // If not set, candidate is locked (only first name visible)
    const companyCandidate = Array.isArray(app.company_candidates) 
      ? app.company_candidates[0] 
      : app.company_candidates;
    const isUnlocked = !!app.unlocked_at || !!companyCandidate?.unlocked_at;
    const appliedAgo = formatDistanceToNow(new Date(app.created_at), {
      locale: de,
      addSuffix: true,
    });

    // Locked state: nur Vorname, unlocked: vollständiger Name
    // Use profile data if available (for unlocked candidates), otherwise use candidate data
    const displayName = isUnlocked
      ? (profile.vorname && profile.nachname
          ? `${profile.vorname} ${profile.nachname}`.trim()
          : candidate.full_name || "Unbekannte Person")
      : (profile.vorname || candidate.full_name?.split(' ')[0] || "Kandidat");

    return {
      profile: {
        id: candidate.id || app.id,
        name: displayName,
        avatar_url: isUnlocked 
          ? (profile.avatar_url || candidate.profile_image || null) 
          : null,
        city: profile.ort || candidate.city || null,
        industry: job?.industry || undefined,
        occupation: job?.title || undefined,
        role: candidate.bio_short || undefined,
        status: stage,
        stage,
        email: isUnlocked ? (profile.email || candidate.email || null) : null,
        phone: isUnlocked ? (profile.telefon || candidate.phone || null) : null,
        skills: skillsArray,
        seeking: job?.title || null,
      },
      unlockNotes: `Beworben ${appliedAgo}`,
    };
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {statusCounts[tab.value] > 0 && (
                <span className="ml-1">({statusCounts[tab.value]})</span>
              )}
          </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Keine Bewerbungen gefunden.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredApplications.map((app: any) => {
                const candidate = app.candidates || {};
                // Check unlocked_at - if set in applications OR in company_candidates, candidate is unlocked (fully visible)
                const companyCandidate = Array.isArray(app.company_candidates) 
                  ? app.company_candidates[0] 
                  : app.company_candidates;
                const isUnlocked = !!app.unlocked_at || !!companyCandidate?.unlocked_at;
                const { profile, unlockNotes } = buildProfileData(app);
                const footerActions = renderApplicationActions(app);
                
                return (
                  <div key={app.id} className="rounded-3xl border border-transparent bg-white p-3 sm:p-4 shadow-sm h-full flex flex-col overflow-hidden">
                    <ProfileCard
                      profile={profile}
                      variant={isUnlocked ? "unlocked" : "search"}
                      unlockSource="bewerbung"
                      unlockJobTitle={job?.title ?? null}
                      unlockNotes={unlockNotes}
                      footerNote={
                        <div className="flex flex-wrap items-center gap-2">
                          <span>
                            Beworben {formatDistanceToNow(new Date(app.created_at), { locale: de, addSuffix: true })}
                          </span>
                          {candidate.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {candidate.city}
                            </span>
                          )}
                        </div>
                      }
                      footerActions={footerActions}
                      hideDefaultAction={!isUnlocked}
                      onView={() => openPreview(app)}
                      onUnlock={!isUnlocked ? () => openPreview(app) : undefined}
                    />
                        </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CandidateProfilePreviewModal
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewApplication(null);
          }
        }}
        profile={previewProfile}
        isUnlocked={!!previewApplication?.unlocked_at || previewProfile?.is_unlocked}
        isLoading={loadingPreview}
        applicationInfo={selectedApplicationInfo}
        onUnlockSuccess={handleUnlockSuccess}
        onRejectRequest={previewApplication ? () => openRejectDialog(previewApplication) : undefined}
        isRejecting={isRejecting}
        showApplicationBanner={false}
      />

      <RejectApplicationDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) {
            setIsRejecting(false);
            setApplicationToReject(null);
            if (!previewOpen) {
              setSelectedApplicationInfo(null);
              setPreviewApplication(null);
            }
          }
        }}
        onConfirm={handleConfirmReject}
        isSubmitting={isRejecting}
        candidateName={applicationToReject?.candidates?.full_name || previewProfile?.full_name || null}
        jobTitle={job?.title || null}
      />
    </div>
  );
}
