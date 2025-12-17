import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase, Wrench, Lock, X, Loader2, GraduationCap, Languages, User } from "lucide-react";
import CandidateUnlockModal from "@/components/unlock/CandidateUnlockModal";
import { InterviewAnswerMatchDisplay } from "@/components/jobs/InterviewAnswerMatchDisplay";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";

interface CandidateProfilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    user_id?: string;
    full_name?: string;
    vorname?: string;
    nachname?: string;
    avatar_url?: string;
    headline?: string;
    branche?: string;
    ort?: string;
    plz?: string;
    faehigkeiten?: any;
    skills?: any;
    berufserfahrung?: any;
    schulbildung?: any;
    bio_short?: string;
    email?: string;
    telefon?: string;
    sprachkenntnisse?: any;
    languages?: any;
    sprachen?: any;
  } | null;
  isUnlocked?: boolean;
  isLoading?: boolean;
  onUnlockSuccess?: () => void;
  applicationInfo?: {
    id: string;
    candidateId?: string;
    jobId?: string | null;
    jobTitle?: string | null;
    jobCity?: string | null;
    status?: string | null;
    createdAt?: string | null;
  } | null;
  onRejectRequest?: () => void;
  isRejecting?: boolean;
  onMarkNotFit?: (profileId: string, profile: CandidateProfilePreviewModalProps["profile"]) => Promise<void> | void;
  showApplicationBanner?: boolean;
}

const toArray = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return Object.values(parsed);
    } catch {
      return value
        .split(/[\r?\n;,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  if (typeof value === "object") {
    return Object.values(value).filter(Boolean);
  }

  return [];
};

const toLanguageArray = (value: any): any[] => {
  const arrayValue = toArray(value);
  return arrayValue.flatMap((entry) => {
    if (!entry) return [];
    if (Array.isArray(entry)) return entry;
    if (typeof entry === "string") return [entry];
    if (typeof entry === "object") return [entry];
    return [];
  });
};

const parseLanguageEntry = (entry: any): { name: string; level?: string } | null => {
  if (!entry) return null;

  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (!trimmed) return null;

    const parenMatch = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (parenMatch) {
      return {
        name: parenMatch[1].trim(),
        level: parenMatch[2].trim(),
      };
    }

    const dashParts = trimmed.split(/\s*[-–:]\s*/);
    if (dashParts.length > 1) {
      return {
        name: dashParts[0].trim(),
        level: dashParts.slice(1).join(" - ").trim() || undefined,
      };
    }

    return { name: trimmed };
  }

  if (typeof entry === "object") {
    const name =
      entry?.name ||
      entry?.sprache ||
      entry?.language ||
      entry?.lang ||
      entry?.label ||
      entry?.title ||
      entry?.value;

    const level = entry?.level || entry?.niveau || entry?.proficiency || entry?.kenntnisstand || entry?.rating;

    if (!name && !level) {
      return null;
    }

    return {
      name: typeof name === "string" ? name : name ? String(name) : "",
      level: typeof level === "string" ? level : level ? String(level) : undefined,
    };
  }

  return null;
};

export function CandidateProfilePreviewModal({
  open,
  onOpenChange,
  profile,
  isUnlocked = false,
  isLoading = false,
  onUnlockSuccess,
  applicationInfo = null,
  onRejectRequest,
  isRejecting = false,
  onMarkNotFit,
  showApplicationBanner = true,
}: CandidateProfilePreviewModalProps) {
  const { company } = useCompany();
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [shouldReopenPreview, setShouldReopenPreview] = useState(false);
  const [hasContactAccess, setHasContactAccess] = useState<boolean>(Boolean(isUnlocked));
  const [markingNotFit, setMarkingNotFit] = useState(false);

  useEffect(() => {
    setHasContactAccess(Boolean(isUnlocked));
  }, [isUnlocked]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!open || !company?.id || !profile) return;
      if (isUnlocked) {
        setHasContactAccess(true);
        return;
      }

      const candidateId = profile.user_id || profile.id;
      if (!candidateId) {
        setHasContactAccess(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tokens_used")
          .select("id")
          .eq("company_id", company.id)
          .eq("profile_id", candidateId)
          .maybeSingle();

        if (error) {
          console.error("Error checking token usage for preview:", error);
          if (isMounted) setHasContactAccess(false);
          return;
        }

        if (isMounted) {
          setHasContactAccess(Boolean(data));
        }
      } catch (error) {
        console.error("Unexpected error checking token usage:", error);
        if (isMounted) setHasContactAccess(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [open, company?.id, profile?.id, profile?.user_id, isUnlocked]);

  if (!profile) return null;

  const displayName = isUnlocked
    ? profile.full_name || `${profile.vorname || ""} ${profile.nachname || ""}`.trim()
    : profile.vorname || profile.full_name?.split(" ")[0] || "Kandidat";

  const initials = (profile.vorname?.[0] || "") + (profile.nachname?.[0] || "");
  const skills = toArray(profile.faehigkeiten) || toArray(profile.skills);
  const experiences = toArray(profile.berufserfahrung);
  const education = toArray(profile.schulbildung);

  const rawLanguageValue = profile.sprachkenntnisse ?? profile.sprachen ?? profile.languages ?? [];
  const languageEntries = toLanguageArray(rawLanguageValue);
  const languageSkills = languageEntries.reduce<{ name: string; level?: string }[]>((acc, entry) => {
    const parsed = parseLanguageEntry(entry);
    if (parsed && parsed.name) {
      acc.push(parsed);
    }
    return acc;
  }, []);
  const location = profile.ort ? `${profile.ort}${profile.plz ? `, ${profile.plz}` : ""}` : "";
  const contactEmail = undefined;
  const contactPhone = undefined;

  const formattedApplicationDate = (() => {
    if (!applicationInfo?.createdAt) return null;
    try {
      return format(new Date(applicationInfo.createdAt), "dd.MM.yyyy", { locale: de });
    } catch {
      return applicationInfo.createdAt;
    }
  })();

  const showApplicationActions =
    showApplicationBanner && !!applicationInfo && applicationInfo.status !== "rejected" && Boolean(onRejectRequest);

  const hasRejectButton = Boolean(onRejectRequest) || Boolean(onMarkNotFit);
  const rejectButtonLoading = onRejectRequest ? isRejecting : markingNotFit;

  const handleRejectButtonClick = () => {
    if (onRejectRequest) {
      onRejectRequest();
    } else if (onMarkNotFit) {
      handleMarkNotFit();
    }
  };

  const handleDialogOpenChange = (next: boolean) => {
    if (!next && !shouldReopenPreview) {
      setShouldReopenPreview(false);
    }
    onOpenChange(next);
  };

  const handleClosePreview = () => {
    setShouldReopenPreview(false);
    onOpenChange(false);
  };

  const handleOpenUnlockModal = () => {
    setShouldReopenPreview(true);
    setUnlockModalOpen(true);
    onOpenChange(false);
  };

  const handleUnlockModalOpenChange = (next: boolean) => {
    setUnlockModalOpen(next);
    if (!next && shouldReopenPreview) {
      setShouldReopenPreview(false);
      onOpenChange(true);
    }
  };

  const handleMarkNotFit = async () => {
    if (!profile?.id || !onMarkNotFit) return;
    setMarkingNotFit(true);
    try {
      await onMarkNotFit(profile.id, profile);
    } catch (error) {
      console.error("Error marking candidate as not fit:", error);
    } finally {
      setMarkingNotFit(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0">
            <h2 className="text-xl font-semibold">Profil ansehen</h2>
            <Button variant="ghost" size="icon" onClick={handleClosePreview} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center min-h-0">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
                {showApplicationBanner && applicationInfo && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                    <div className="font-semibold text-blue-700 mb-1">Bewerbung ansehen</div>
                    <div>
                      Hat sich auf
                      {applicationInfo.jobTitle ? (
                        <span className="font-semibold"> "{applicationInfo.jobTitle}"</span>
                      ) : (
                        <span className="font-semibold"> diese Stelle</span>
                      )} beworben
                      {applicationInfo.jobCity && <span> in {applicationInfo.jobCity}</span>}
                      {formattedApplicationDate && <span> am {formattedApplicationDate}</span>}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 flex-shrink-0 bg-blue-50 text-blue-600">
                    {isUnlocked ? (
                      <>
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-xl font-semibold">
                          {initials || displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
                        <User className="h-8 w-8 text-blue-600" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold mb-2">{displayName}</h2>
                    {profile.headline && <p className="text-base text-muted-foreground mb-3">{profile.headline}</p>}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      {location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{location}</span>
                        </div>
                      )}
                      {profile.branche && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 flex-shrink-0" />
                          <span>{profile.branche}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {skills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Fähigkeiten</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill: string, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm font-normal bg-gray-100 text-gray-700 border-0 rounded-md"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {languageSkills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Languages className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Sprachkenntnisse</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {languageSkills.map((lang, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm font-normal bg-gray-100 text-gray-700 border-0 rounded-md"
                        >
                          {lang.level ? `${lang.name} (${lang.level})` : lang.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {education.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Ausbildung</h3>
                    </div>
                    <div className="space-y-4">
                      {education.slice(0, 3).map((edu: any, index) => {
                        const school = edu.schule || edu.school || edu.name || "";
                        const degree = edu.abschluss || edu.degree || edu.qualifikation || "";
                        const field = edu.fachrichtung || edu.field || edu.fach || edu.schwerpunkt || "";
                        const schoolType = edu.schulform || edu.school_type || edu.schulart || "";
                        const from = edu.von || edu.from || edu.start_date || edu.zeitraum_von;
                        const to = edu.bis || edu.to || edu.end_date || edu.abschlussdatum || edu.zeitraum_bis;

                        const formatDate = (date: any) => {
                          if (!date) return null;
                          if (typeof date === "string") {
                            try {
                              const d = new Date(date);
                              if (!isNaN(d.getTime())) {
                                return d.getFullYear().toString();
                              }
                            } catch {
                              return date;
                            }
                          }
                          return date;
                        };

                        const fromYear = formatDate(from);
                        const toYear = formatDate(to);

                        return (
                          <div key={index} className="pb-4 last:pb-0">
                            {degree && <div className="font-semibold text-base mb-1">{degree}</div>}
                            {schoolType && <div className="text-sm text-muted-foreground mb-1">{schoolType}</div>}
                            {school && <div className="text-sm text-muted-foreground mb-1">{school}</div>}
                            {field && <div className="text-sm text-muted-foreground mb-1">{field}</div>}
                            {(fromYear || toYear) && (
                              <div className="text-sm text-muted-foreground mb-3">
                                {fromYear && toYear ? `${fromYear} - ${toYear}` : fromYear || toYear}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {experiences.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Berufserfahrung</h3>
                    </div>
                    <div className="space-y-4">
                      {experiences.slice(0, 3).map((exp: any, index) => {
                        const position = exp.position || exp.titel || exp.beruf || exp.job_title || "Berufserfahrung";
                        const company = exp.unternehmen || exp.company || exp.arbeitgeber || "";
                        const from = exp.von || exp.from || exp.zeitraum_von || exp.start_date;
                        const to = exp.bis || exp.to || exp.zeitraum_bis || exp.end_date;

                        const formatDate = (date: any) => {
                          if (!date) return null;
                          if (typeof date === "string") {
                            if (date.toLowerCase() === "heute" || date.toLowerCase() === "today") {
                              return "Heute";
                            }
                            try {
                              const d = new Date(date);
                              if (!isNaN(d.getTime())) {
                                return d.getFullYear().toString();
                              }
                            } catch {
                              return date;
                            }
                          }
                          return date;
                        };

                        const fromYear = formatDate(from);
                        let toYear: string | null = null;
                        if (to) {
                          toYear = formatDate(to);
                          const today = new Date();
                          try {
                            const endDate = new Date(to);
                            const currentMonth = today.getMonth();
                            const currentYear = today.getFullYear();
                            const endMonth = endDate.getMonth();
                            const endYear = endDate.getFullYear();
                            if (endYear > currentYear || (endYear === currentYear && endMonth >= currentMonth)) {
                              toYear = "Heute";
                            }
                          } catch {
                            if (typeof to === "string" && (to.toLowerCase() === "heute" || to.toLowerCase() === "today")) {
                              toYear = "Heute";
                            } else {
                              toYear = toYear || "Heute";
                            }
                          }
                        } else {
                          toYear = "Heute";
                        }

                        let descriptionItems: string[] = [];
                        if (exp.beschreibung) {
                          if (Array.isArray(exp.beschreibung)) {
                            descriptionItems = exp.beschreibung
                              .map((item: any) => (typeof item === "string" ? item.trim() : item))
                              .filter((item: any) => item && item.length > 0);
                          } else if (typeof exp.beschreibung === "string") {
                            descriptionItems = exp.beschreibung
                              .split("\n")
                              .map((item: string) => item.trim())
                              .filter((item: string) => item.length > 0);
                          }
                        }
                        if (descriptionItems.length === 0 && exp.tasks) {
                          descriptionItems = Array.isArray(exp.tasks) ? exp.tasks : [exp.tasks];
                        }
                        if (descriptionItems.length === 0 && exp.responsibilities) {
                          descriptionItems = Array.isArray(exp.responsibilities) ? exp.responsibilities : [exp.responsibilities];
                        }

                        if (descriptionItems.length > 0) {
                          const deduped = Array.from(
                            new Set(
                              descriptionItems.map((item: any) => (typeof item === "string" ? item.trim() : item))
                            )
                          );
                          descriptionItems = deduped.filter((item: any) => item && item.length > 0);
                        }

                        return (
                          <div key={index} className="pb-4 last:pb-0">
                            <div className="font-semibold text-base mb-1">{position}</div>
                            {company && <div className="text-sm text-muted-foreground mb-1">{company}</div>}
                            {(fromYear || toYear) && (
                              <div className="text-sm text-muted-foreground mb-3">
                                {fromYear ? `${fromYear} - ${toYear}` : `- ${toYear}`}
                              </div>
                            )}
                            {descriptionItems.length > 0 && (
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 ml-1">
                                {descriptionItems.map((desc: string, i: number) => (
                                  <li key={i} className="leading-relaxed">
                                    {desc}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Interview Answer Matching Results - Only visible to companies */}
                {isUnlocked && applicationInfo?.id && (
                  <div className="mt-6 pt-6 border-t">
                    <InterviewAnswerMatchDisplay 
                      applicationId={applicationInfo.id}
                      jobId={applicationInfo.jobId || undefined}
                    />
                  </div>
                )}

            </div>
          )}

          <div className="border-t bg-white px-6 py-4 flex-shrink-0">
            {showApplicationActions ? (
              <div className="flex flex-col sm:flex-row gap-3">
                {!isUnlocked && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleOpenUnlockModal}
                    disabled={isRejecting}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Bewerbung freischalten
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleRejectButtonClick}
                  disabled={rejectButtonLoading}
                >
                  Bewerbung ablehnen
                </Button>
              </div>
            ) : null}

            {(hasRejectButton || !isUnlocked) && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {hasRejectButton && (
                  <Button
                    variant="outline"
                    className="sm:w-auto border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleRejectButtonClick}
                    disabled={rejectButtonLoading}
                  >
                    {rejectButtonLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {onRejectRequest ? "Wird abgelehnt..." : "Wird ausgeblendet..."}
                      </>
                    ) : (
                      "Unpassend"
                    )}
                  </Button>
                )}
                {!isUnlocked && (
                  <Button
                    className="sm:w-auto bg-blue-600 hover:bg-blue-700"
                    onClick={handleOpenUnlockModal}
                    disabled={isRejecting || markingNotFit}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Jetzt freischalten
                  </Button>
                )}
                {isUnlocked && !showApplicationActions && (
                  <Button className="sm:w-auto" disabled>
                    Bereits freigeschaltet
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {profile && company && (
        <CandidateUnlockModal
          open={unlockModalOpen}
          onOpenChange={handleUnlockModalOpenChange}
          candidate={{
            id: profile.id,
            user_id: profile.user_id || profile.id,
            full_name: profile.full_name || `${profile.vorname || ""} ${profile.nachname || ""}`.trim(),
            vorname: profile.vorname,
            nachname: profile.nachname,
          }}
          companyId={company.id}
          contextApplication={applicationInfo ? {
            id: applicationInfo.id,
            job_id: applicationInfo.jobId || null,
            job_title: applicationInfo.jobTitle || null,
            status: applicationInfo.status || null,
          } : null}
          contextType={applicationInfo ? "application" : "none"}
          onSuccess={() => {
            setUnlockModalOpen(false);
            setShouldReopenPreview(false);
            onUnlockSuccess?.();
          }}
        />
      )}
    </>
  );
}

export default CandidateProfilePreviewModal;
