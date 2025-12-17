import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getJobMatchesForCandidate, getCompanyMatchesForCandidate } from "@/lib/api/user-matches";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Sparkles, MapPin, Building2, Briefcase, ExternalLink, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================
// JobMatchCard Component
// ============================================

interface JobMatchCardProps {
  match: {
    job_id: string;
    job_title: string;
    company_name: string;
    company_slug?: string;
    city?: string;
    match_score: number;
    description_preview?: string;
    employment_type?: string;
  };
  onViewJob: (jobId: string) => void;
  onApply: (jobId: string) => void;
}

function JobMatchCard({ match, onViewJob, onApply }: JobMatchCardProps) {
  const getScoreLabel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: "Perfektes Match", color: "text-green-700" };
    if (score >= 80) return { label: "Starkes Match", color: "text-green-600" };
    if (score >= 70) return { label: "Gutes Match", color: "text-blue-600" };
    if (score >= 60) return { label: "Passendes Match", color: "text-slate-600" };
    return { label: "Match", color: "text-slate-500" };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-green-400";
    if (score >= 70) return "bg-blue-500";
    if (score >= 60) return "bg-slate-400";
    return "bg-slate-300";
  };

  const scoreLabel = getScoreLabel(match.match_score);

  return (
    <Card className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Left: Job Info */}
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">
                {match.job_title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 className="h-4 w-4" />
                <span>{match.company_name}</span>
                {match.city && (
                  <>
                    <span className="text-slate-400">·</span>
                    <MapPin className="h-4 w-4" />
                    <span>{match.city}</span>
                  </>
                )}
              </div>
              {match.employment_type && (
                <Badge variant="outline" className="text-xs w-fit">
                  {match.employment_type}
                </Badge>
              )}
            </div>

            {match.description_preview && (
              <p className="text-sm text-slate-600 line-clamp-2">
                {match.description_preview}
              </p>
            )}
          </div>

          {/* Right: Score + Actions */}
          <div className="flex flex-col items-end gap-4 lg:w-64 lg:flex-shrink-0">
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", scoreLabel.color)}>
                  {scoreLabel.label}
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {match.match_score}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full transition-all", getScoreColor(match.match_score))}
                  style={{ width: `${match.match_score}%` }}
                />
              </div>
            </div>

            <div className="w-full space-y-2">
              <Button
                onClick={() => onViewJob(match.job_id)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Stellenprofil ansehen
              </Button>
              <Button
                onClick={() => onApply(match.job_id)}
                className="w-full"
                size="lg"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Jetzt bewerben
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CompanyMatchCard Component
// ============================================

interface CompanyMatchCardProps {
  match: {
    company_id: string;
    company_name: string;
    company_slug?: string;
    industry?: string;
    location?: string;
    match_score: number;
    description?: string;
    logo_url?: string;
  };
  onViewCompany: (companyId: string, slug?: string) => void;
  onShowInterest: (companyId: string) => void;
}

function CompanyMatchCard({ match, onViewCompany, onShowInterest }: CompanyMatchCardProps) {
  const getScoreLabel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: "Perfektes Match", color: "text-green-700" };
    if (score >= 80) return { label: "Starkes Match", color: "text-green-600" };
    if (score >= 70) return { label: "Gutes Match", color: "text-blue-600" };
    if (score >= 60) return { label: "Passendes Match", color: "text-slate-600" };
    return { label: "Match", color: "text-slate-500" };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-green-400";
    if (score >= 70) return "bg-blue-500";
    if (score >= 60) return "bg-slate-400";
    return "bg-slate-300";
  };

  const scoreLabel = getScoreLabel(match.match_score);

  return (
    <Card className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Left: Company Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-4">
              {match.logo_url ? (
                <img
                  src={match.logo_url}
                  alt={match.company_name}
                  className="h-16 w-16 rounded-lg object-cover border-2 border-slate-100"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 border-2 border-slate-200">
                  <Building2 className="h-8 w-8 text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-slate-900 truncate">
                  {match.company_name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {match.industry && (
                    <Badge variant="outline" className="text-xs">
                      {match.industry}
                    </Badge>
                  )}
                  {match.location && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {match.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {match.description && (
              <p className="text-sm text-slate-600 line-clamp-2">
                {match.description}
              </p>
            )}
          </div>

          {/* Right: Score + Actions */}
          <div className="flex flex-col items-end gap-4 lg:w-64 lg:flex-shrink-0">
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", scoreLabel.color)}>
                  {scoreLabel.label}
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {match.match_score}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full transition-all", getScoreColor(match.match_score))}
                  style={{ width: `${match.match_score}%` }}
                />
              </div>
            </div>

            <div className="w-full space-y-2">
              <Button
                onClick={() => onViewCompany(match.company_id, match.company_slug)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Unternehmen ansehen
              </Button>
              <Button
                onClick={() => onShowInterest(match.company_id)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Heart className="h-4 w-4 mr-2" />
                Interesse signalisieren
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export default function UserMatches() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"jobs" | "companies">("jobs");

  const candidateId = profile?.id;

  // Load job matches
  const {
    data: jobMatches = [],
    isLoading: jobsLoading,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ["user-job-matches", candidateId],
    queryFn: () => {
      if (!candidateId) return [];
      return getJobMatchesForCandidate(candidateId, { minScore: 60, limit: 20 });
    },
    enabled: !!candidateId && activeTab === "jobs",
  });

  // Load company matches
  const {
    data: companyMatches = [],
    isLoading: companiesLoading,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["user-company-matches", candidateId],
    queryFn: () => {
      if (!candidateId) return [];
      return getCompanyMatchesForCandidate(candidateId, { minScore: 60, limit: 20 });
    },
    enabled: !!candidateId && activeTab === "companies",
  });

  // Handle view job
  const handleViewJob = (jobId: string) => {
    // Navigate to job detail page
    navigate(`/jobs/${jobId}`);
  };

  // Handle apply to job
  const handleApply = (jobId: string) => {
    // TODO: Implement application flow
    // This should:
    // 1. Navigate to job detail page with application modal open
    // 2. Or open application modal directly
    // 3. Handle CV upload, interview questions, etc.
    
    console.log("TODO: Apply to job", jobId);
    navigate(`/jobs/${jobId}?apply=true`);
  };

  // Handle view company
  const handleViewCompany = (companyId: string, slug?: string) => {
    // Navigate to company profile page
    if (slug) {
      navigate(`/firma/${slug}`);
    } else {
      navigate(`/companies/${companyId}`);
    }
  };

  // Handle show interest
  const handleShowInterest = (companyId: string) => {
    // TODO: Implement interest signaling flow
    // This should:
    // 1. Create a record in company_interests or similar table
    // 2. Send notification to company
    // 3. Show success toast
    
    console.log("TODO: Show interest in company", companyId);
    toast.info("Interesse-Funktion wird implementiert...");
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-slate-600">Bitte melde dich an, um deine Matches zu sehen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Top-Matches für dich</h2>
        <p className="text-sm text-slate-600">
          Entdecke Jobs und Unternehmen, die besonders gut zu deinem Profil passen.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "jobs" | "companies")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>Top-Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Top-Unternehmen</span>
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4 mt-6">
          {jobsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-slate-600">Jobs werden geladen...</p>
              </div>
            </div>
          ) : jobMatches.length === 0 ? (
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Briefcase className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Keine Job-Matches gefunden
                </h3>
                <p className="text-sm text-slate-600">
                  Aktuell gibt es keine Jobs, die besonders gut zu deinem Profil passen.
                  Versuche es später erneut oder passe dein Profil an.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-slate-700">
                    {jobMatches.length} {jobMatches.length === 1 ? "Job gefunden" : "Jobs gefunden"}
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  Durchschnitt: {Math.round(
                    jobMatches.reduce((sum, m) => sum + m.match_score, 0) / jobMatches.length
                  )}% Match
                </div>
              </div>
              <div className="space-y-4">
                {jobMatches.map((match) => (
                  <JobMatchCard
                    key={match.job_id}
                    match={match}
                    onViewJob={handleViewJob}
                    onApply={handleApply}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4 mt-6">
          {companiesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-slate-600">Unternehmen werden geladen...</p>
              </div>
            </div>
          ) : companyMatches.length === 0 ? (
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Building2 className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Keine Unternehmens-Matches gefunden
                </h3>
                <p className="text-sm text-slate-600">
                  Aktuell gibt es keine Unternehmen, die besonders gut zu deinem Profil passen.
                  Versuche es später erneut oder passe dein Profil an.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-slate-700">
                    {companyMatches.length} {companyMatches.length === 1 ? "Unternehmen gefunden" : "Unternehmen gefunden"}
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  Durchschnitt: {Math.round(
                    companyMatches.reduce((sum, m) => sum + m.match_score, 0) / companyMatches.length
                  )}% Match
                </div>
              </div>
              <div className="space-y-4">
                {companyMatches.map((match) => (
                  <CompanyMatchCard
                    key={match.company_id}
                    match={match}
                    onViewCompany={handleViewCompany}
                    onShowInterest={handleShowInterest}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

