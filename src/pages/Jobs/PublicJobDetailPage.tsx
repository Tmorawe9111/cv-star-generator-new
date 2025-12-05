import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useJobSave } from "@/hooks/useJobSave";
import { useQuickApply } from "@/hooks/useQuickApply";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, MapPin, Briefcase, Clock, Building2, Calendar, Share2, Bookmark, BookmarkCheck, FileText, Users, Languages, Award, CheckCircle, AlertCircle } from "lucide-react";
import { DocumentUploadPrompt } from "@/components/jobs/DocumentUploadPrompt";
import { DOCUMENT_TYPE_LABELS, type DocType } from "@/lib/document-types";
import { JobPostingStructuredData } from "@/components/seo/StructuredData";
import { AccountRequiredDialog } from "@/components/jobs/AccountRequiredDialog";
import { LandingHeader } from "@/components/marketing/LandingHeader";
import { cn } from "@/lib/utils";
import { JobApplicationInterviewQuestions } from "@/components/jobs/JobApplicationInterviewQuestions";
import { ScheduleInterviewAfterQuestions } from "@/components/jobs/ScheduleInterviewAfterQuestions";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function PublicJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const [accountRequiredOpen, setAccountRequiredOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [interviewQuestionsOpen, setInterviewQuestionsOpen] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  
  const { isSaved, toggleSave, isToggling } = useJobSave(id || "");
  const { hasApplied, applyToJob, isApplying, canApply, profileStatus } = useQuickApply(id || "");

  // Check if we should show interview questions modal
  useEffect(() => {
    const showQuestions = searchParams.get('showQuestions') === 'true';
    const appId = searchParams.get('application');
    
    if (showQuestions && appId && user && job) {
      setApplicationId(appId);
      setInterviewQuestionsOpen(true);
      // Remove query params from URL
      navigate(`/stelle/${id}`, { replace: true });
    }
  }, [searchParams, user, job, id, navigate]);

  const { data: job, isLoading } = useQuery({
    queryKey: ["public-job-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select(`
          *,
          company:companies!job_posts_company_id_fkey(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: applicationsCount } = useQuery<number>({
    queryKey: ["applications-count", id],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const getEmploymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      full_time: 'Vollzeit',
      part_time: 'Teilzeit',
      apprenticeship: 'Ausbildung',
      dual_study: 'Duales Studium',
      internship: 'Praktikum',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Stellenanzeige nicht gefunden</p>
      </div>
    );
  }

  // Only add Structured Data for explicitly public jobs
  const isPublicJob = job.is_public === true && job.status === 'published' && job.is_active === true;
  
  // Show LandingHeader only if user is NOT authenticated (public view)
  const showLandingHeader = !user;

  return (
    <div className="min-h-screen bg-background">
      {/* Landing Header - Only for public (non-authenticated) users */}
      {showLandingHeader && <LandingHeader />}
      
      {/* Structured Data - ONLY for public jobs */}
      {isPublicJob && (
        <JobPostingStructuredData
          job={{
            title: job.title,
            description: job.description_md || job.tasks_md || job.title,
            company: job.company?.name || 'Unbekanntes Unternehmen',
            companyLogo: job.company?.logo_url,
            location: [job.city, job.state, job.country].filter(Boolean).join(', ') || 'Deutschland',
            city: job.city,
            postalCode: job.postal_code,
            employmentType: getEmploymentTypeLabel(job.employment_type),
            industry: job.company?.industry || job.industry || undefined,
            salary: (job.salary_min || job.salary_max) ? {
              min: job.salary_min,
              max: job.salary_max,
              currency: 'EUR',
              unit: 'MONTH'
            } : undefined,
            datePosted: job.created_at,
            validThrough: job.expires_at || undefined,
            url: `https://bevisiblle.de/stelle/${job.id}`,
            identifier: {
              name: 'BeVisiblle Job ID',
              value: job.id
            }
          }}
        />
      )}
      {/* Header */}
      <div className={cn("border-b bg-card", showLandingHeader ? "pt-20" : "")}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/jobs")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu den Stellenanzeigen
          </Button>

          <div className="flex items-start gap-4">
            {job.company?.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={job.company.name}
                className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{job.title}</h1>
              <p className="text-lg text-muted-foreground mb-3">
                {job.company?.name || 'Unbekanntes Unternehmen'}
              </p>
              
              <div className="flex items-center gap-4 flex-wrap text-sm">
                {(job.city || job.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.city || job.state}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {getEmploymentTypeLabel(job.employment_type)}
                </span>
                {job.created_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Veröffentlicht {new Date(job.created_at).toLocaleDateString('de-DE')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* About the Job */}
            {(job.description_md || job.tasks_md) && (
              <section>
                <h2 className="text-xl font-bold mb-4">Über die Stelle</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {job.description_md || job.tasks_md}
                  </p>
                </div>
              </section>
            )}

            {/* Responsibilities */}
            {job.requirements_md && (
              <section>
                <h2 className="text-xl font-bold mb-4">Anforderungen</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.requirements_md}</p>
                </div>
              </section>
            )}

            {/* Benefits */}
            {job.benefits_description && (
              <section>
                <h2 className="text-xl font-bold mb-4">Benefits</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.benefits_description}</p>
                </div>
              </section>
            )}

            {/* Additional Info */}
            {job.additional_qualifications && (
              <section>
                <h2 className="text-xl font-bold mb-4">Weitere Anforderungen</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.additional_qualifications}</p>
                </div>
              </section>
            )}

            {/* About Company */}
            {job.company && (
              <section>
                <h2 className="text-xl font-bold mb-4">Über das Unternehmen</h2>
                <div 
                  className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`/companies/${job.company.id}?fromJob=${id}`)}
                >
                  {job.company.logo_url ? (
                    <img
                      src={job.company.logo_url}
                      alt={job.company.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold mb-1">{job.company.name}</h3>
                      <Button variant="ghost" size="sm" className="text-primary">
                        Profil ansehen →
                      </Button>
                    </div>
                    {job.company.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {job.company.description}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Application Stats */}
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{applicationsCount || 0} Personen haben sich bereits beworben</span>
              </div>
            </div>

            {/* Apply Buttons */}
            <div className="space-y-3">
              {!hasApplied ? (
                <>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                    size="lg"
                    onClick={() => {
                      if (!user) {
                        // Show account required dialog instead of navigating directly
                        setCompanyName(job.company?.name || "das Unternehmen");
                        setJobTitle(job.title || "");
                        setAccountRequiredOpen(true);
                        return;
                      }
                      
                      // Check if user has a profile (CV created)
                      if (!profileStatus?.hasProfile) {
                        setCompanyName(job.company?.name || "das Unternehmen");
                        setJobTitle(job.title || "");
                        setAccountRequiredOpen(true);
                        return;
                      }
                      
                      // Check if documents are missing
                      if (!canApply && profileStatus?.missingDocuments && profileStatus.missingDocuments.length > 0) {
                        setDocumentUploadOpen(true);
                        return;
                      }
                      
                      setCompanyName(job.company?.name || "das Unternehmen");
                      setJobTitle(job.title || "");
                      setJobLocation(job.city || job.state || "");
                      setConfirmDialogOpen(true);
                    }}
                    disabled={isApplying || (!canApply && profileStatus?.missingFields && profileStatus.missingFields.length > 0)}
                  >
                    {isApplying ? "Wird gesendet..." : "Jetzt bewerben"}
                  </Button>
                  
                  {/* Document Status Indicator */}
                  {user && !canApply && profileStatus?.missingDocuments && profileStatus.missingDocuments.length > 0 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900">
                            {profileStatus.missingDocuments.length} {profileStatus.missingDocuments.length === 1 ? 'Dokument fehlt' : 'Dokumente fehlen'}
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            Klicken Sie auf "Jetzt bewerben", um die fehlenden Dokumente hochzuladen
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Profile Incomplete Warning */}
                  {user && !canApply && profileStatus?.missingFields && profileStatus.missingFields.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">Profil unvollständig</p>
                          <p className="text-xs text-red-700 mt-1">
                            Bitte vervollständigen Sie Ihr Profil, um sich zu bewerben
                          </p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-red-700 h-auto p-0 mt-1"
                            onClick={() => navigate("/profile")}
                          >
                            Zum Profil →
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    size="lg"
                    disabled
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Bereits beworben
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Du kannst den Status deiner Bewerbung unter "Meine Karriere" einsehen
                  </p>
                </div>
              )}
              
              <Button 
                className={`w-full ${isSaved ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white`}
                size="lg"
                onClick={() => {
                  if (!user) {
                    navigate("/auth");
                    return;
                  }
                  toggleSave();
                }}
                disabled={isToggling}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 mr-2" />
                    Gespeichert
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Speichern
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: job.title,
                      text: `Schau dir diese Stelle an: ${job.title} bei ${job.company?.name}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Teilen
              </Button>
            </div>

            {/* Salary */}
            {(job.salary_min || job.salary_max) && (
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="font-bold text-2xl mb-1">
                  €{job.salary_min?.toLocaleString() || '?'} - €{job.salary_max?.toLocaleString() || '?'}
                </h3>
                <p className="text-sm text-muted-foreground">Durchschn. Gehalt</p>
              </div>
            )}

            {/* Job Details Card */}
            <div className="p-6 border rounded-lg bg-card space-y-4">
              <h3 className="font-semibold mb-4">Details</h3>
              
              {job.industry && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Branche</p>
                    <p className="text-sm text-muted-foreground">{job.industry}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Stellenart</p>
                  <p className="text-sm text-muted-foreground">
                    {getEmploymentTypeLabel(job.employment_type)}
                  </p>
                </div>
              </div>

              {job.work_mode && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Arbeitsmodell</p>
                    <p className="text-sm text-muted-foreground capitalize">{job.work_mode}</p>
                  </div>
                </div>
              )}

              {job.start_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Startdatum</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(job.start_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
              <div className="p-6 border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5" />
                  <h3 className="font-semibold">Fähigkeiten</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill: any, index: number) => (
                    <Badge key={index} variant="secondary">
                      {typeof skill === 'string' ? skill : skill.name || ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {job.required_languages && Array.isArray(job.required_languages) && job.required_languages.length > 0 && (
              <div className="p-6 border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Languages className="h-5 w-5" />
                  <h3 className="font-semibold">Sprachen</h3>
                </div>
                <div className="space-y-2">
                  {job.required_languages.map((lang: any, index: number) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{lang.language}</span>
                      {lang.level && <span className="text-muted-foreground"> - {lang.level}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Documents */}
            {((job.required_documents && Array.isArray(job.required_documents) && job.required_documents.length > 0) ||
              (job.optional_documents && Array.isArray(job.optional_documents) && job.optional_documents.length > 0)) && (
              <div className="p-6 border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5" />
                  <h3 className="font-semibold">Benötigte Dokumente</h3>
                </div>
                
                {job.required_documents && Array.isArray(job.required_documents) && job.required_documents.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-red-600 mb-2">Pflicht:</p>
                    <ul className="space-y-2">
                      {job.required_documents.map((doc: any, index: number) => {
                        const docLabel = typeof doc === 'string' 
                          ? DOCUMENT_TYPE_LABELS[doc as DocType] || doc
                          : doc.label || DOCUMENT_TYPE_LABELS[doc.type as DocType] || doc.type;
                        return (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {docLabel}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                {job.optional_documents && Array.isArray(job.optional_documents) && job.optional_documents.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Optional:</p>
                    <ul className="space-y-2">
                      {job.optional_documents.map((doc: any, index: number) => {
                        const docLabel = typeof doc === 'string' 
                          ? DOCUMENT_TYPE_LABELS[doc as DocType] || doc
                          : doc.label || DOCUMENT_TYPE_LABELS[doc.type as DocType] || doc.type;
                        return (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            {docLabel}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Contact Person */}
            {job.contact_person_name && (
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="font-semibold mb-4">Ansprechperson</h3>
                <div className="flex items-start gap-4">
                  {job.contact_person_photo_url && (
                    <img 
                      src={job.contact_person_photo_url} 
                      alt={job.contact_person_name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  )}
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{job.contact_person_name}</p>
                    {job.contact_person_role && (
                      <p className="text-sm text-muted-foreground">{job.contact_person_role}</p>
                    )}
                    {job.contact_person_email && (
                      <p className="text-sm text-muted-foreground">{job.contact_person_email}</p>
                    )}
                    {job.contact_person_phone && (
                      <p className="text-sm text-muted-foreground">{job.contact_person_phone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bewerbungs-Bestätigungs-Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bewerbung absenden?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {canApply ? (
                <p className="text-base">
                  Du bewirbst dich damit bei <span className="font-semibold">{companyName}</span> auf 
                  die Position <span className="font-semibold">{jobTitle}</span> in{" "}
                  <span className="font-semibold">{jobLocation}</span> - und dein vollständiges 
                  Profil wird an <span className="font-semibold">{companyName}</span> weitergeleitet.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-destructive font-medium">
                    Du kannst dich derzeit nicht bewerben:
                  </p>
                  
                  {profileStatus?.missingFields && profileStatus.missingFields.length > 0 && (
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm font-medium text-destructive mb-2">
                        Dein Profil ist unvollständig:
                      </p>
                      <ul className="text-sm text-destructive list-disc list-inside space-y-1">
                        {profileStatus.missingFields.map((field, idx) => (
                          <li key={idx}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {profileStatus?.missingDocuments && profileStatus.missingDocuments.length > 0 && (
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm font-medium text-destructive mb-2">
                        Folgende Dokumente fehlen:
                      </p>
                      <ul className="text-sm text-destructive list-disc list-inside space-y-1">
                        {profileStatus.missingDocuments.map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
                    Bitte vervollständige dein Profil, bevor du dich bewirbst.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                applyToJob();
                setConfirmDialogOpen(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!canApply || isApplying}
            >
              {isApplying ? "Wird gesendet..." : "Jetzt bewerben"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Upload Prompt */}
      {user && profileStatus?.missingDocuments && profileStatus.missingDocuments.length > 0 && (
        <DocumentUploadPrompt
          open={documentUploadOpen}
          onOpenChange={setDocumentUploadOpen}
          missingDocuments={profileStatus.missingDocuments}
          userId={user.id}
          onUploadComplete={() => {
            // Refresh profile status by triggering apply dialog
            setCompanyName(job?.company?.name || "das Unternehmen");
            setJobTitle(job?.title || "");
            setJobLocation(job?.city || job?.state || "");
            setConfirmDialogOpen(true);
          }}
        />
      )}

      {/* Account Required Dialog */}
      <AccountRequiredDialog
        open={accountRequiredOpen}
        onOpenChange={setAccountRequiredOpen}
        jobTitle={jobTitle}
        companyName={companyName}
      />

      {/* Interview Questions Modal - Opens after unlock */}
      {interviewQuestionsOpen && applicationId && job && (
        <JobApplicationInterviewQuestions
          open={interviewQuestionsOpen}
          onOpenChange={setInterviewQuestionsOpen}
          applicationId={applicationId}
          jobId={job.id}
          companyId={job.company_id}
          onScheduleInterview={(appId, jId, cId) => {
            // After answering questions, show interview scheduling dialog
            setInterviewQuestionsOpen(false);
            setShowScheduleInterview(true);
          }}
          onComplete={() => {
            setInterviewQuestionsOpen(false);
            toast({
              title: 'Vielen Dank!',
              description: 'Deine Antworten wurden gespeichert.',
            });
          }}
        />
      )}

      {/* Schedule Interview Modal - Opens after questions are answered */}
      {showScheduleInterview && applicationId && job && (
        <ScheduleInterviewAfterQuestions
          open={showScheduleInterview}
          onOpenChange={setShowScheduleInterview}
          applicationId={applicationId}
          jobId={job.id}
          companyId={job.company_id}
          candidateName={user ? `${user.user_metadata?.vorname || ''} ${user.user_metadata?.nachname || ''}`.trim() : undefined}
          onComplete={() => {
            setShowScheduleInterview(false);
            toast({
              title: 'Erfolgreich',
              description: 'Interview-Anfrage wurde gesendet. Du erhältst eine Benachrichtigung, sobald der Kandidat antwortet.',
            });
          }}
        />
      )}
    </div>
  );
}
