import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyId } from "@/hooks/useCompanyId";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyMatchesWithProfiles } from "@/lib/api/company-matches";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, MapPin, Briefcase, Coins, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

interface MatchWithProfile {
  id: string;
  company_id: string;
  candidate_id: string;
  is_eligible: boolean;
  base_score: number | null;
  values_score: number | null;
  role_score: number | null;
  interview_score: number | null;
  overall_score: number;
  score_breakdown?: any;
  token_cost?: number;
  is_application?: boolean;
  // Profile fields (from view or join)
  vorname?: string;
  nachname?: string;
  status?: string;
  branche?: string;
  ort?: string;
  plz?: string;
  avatar_url?: string;
  headline?: string;
  faehigkeiten?: any;
  cv_url?: string;
  profile_published?: boolean;
}

interface JobOption {
  id: string;
  title: string;
  city?: string | null;
}

type ViewMode = "all" | "applications" | "byJob";

// ============================================
// MatchCard Component
// ============================================

interface MatchCardProps {
  match: MatchWithProfile;
  onUnlock: (candidateId: string, tokenCost: number) => void;
}

function MatchCard({ match, onUnlock }: MatchCardProps) {
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

  const scoreLabel = getScoreLabel(match.overall_score);
  const profileHeadline = match.headline || `${match.status || "Kandidat:in"} ${match.branche || ""}`.trim();
  const location = match.ort ? `${match.ort}${match.plz ? ` · ${match.plz}` : ""}` : null;

  return (
    <Card className="group rounded-2xl border border-slate-200 bg-white/90 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Left: Profile Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-4">
              {match.avatar_url ? (
                <img
                  src={match.avatar_url}
                  alt={`${match.vorname} ${match.nachname}`}
                  className="h-16 w-16 rounded-full object-cover border-2 border-slate-100"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 border-2 border-slate-200">
                  <span className="text-lg font-semibold text-slate-400">
                    {match.vorname?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  {match.vorname} {match.nachname}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {profileHeadline}
                </p>
                {location && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </div>
                )}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {match.base_score !== null && (
                <Badge variant="outline" className="text-xs">
                  Profil-Fit {match.base_score}%
                </Badge>
              )}
              {match.values_score !== null ? (
                <Badge variant="outline" className="text-xs">
                  Werte-Fit {match.values_score}%
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-slate-400">
                  Werte-Fit noch nicht definiert
                </Badge>
              )}
              {match.role_score !== null ? (
                <Badge variant="outline" className="text-xs">
                  Rollen-Fit {match.role_score}%
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-slate-400">
                  Rollen-Fit noch nicht definiert
                </Badge>
              )}
            </div>
          </div>

          {/* Right: Score + Action */}
          <div className="flex flex-col items-end gap-4 lg:w-64 lg:flex-shrink-0">
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", scoreLabel.color)}>
                  {scoreLabel.label}
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {match.overall_score}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full transition-all", getScoreColor(match.overall_score))}
                  style={{ width: `${match.overall_score}%` }}
                />
              </div>
            </div>

            <div className="w-full space-y-2">
              <Button
                onClick={() => onUnlock(match.candidate_id, match.token_cost || 2)}
                className="w-full"
                size="lg"
              >
                <Coins className="h-4 w-4 mr-2" />
                Profil für {match.token_cost || 2} Token freischalten
              </Button>
              
              {match.is_application && (
                <p className="text-xs text-slate-500 text-center">
                  <CheckCircle2 className="h-3 w-3 inline-block mr-1" />
                  Bewerbung vorhanden – dieses Profil kostet nur 1 Token.
                </p>
              )}
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

export default function CompanyMatchesPage() {
  const companyId = useCompanyId();
  const { company } = useCompany();
  
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  // Load active jobs for filter dropdown
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["company-jobs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("job_posts")
        .select("id, title, city, is_active, status")
        .eq("company_id", companyId)
        .order("title", { ascending: true });

      if (error) throw error;

      // Filter active jobs
      const activeJobs = (data || []).filter((job) => {
        if (!job) return false;
        if (job.is_active === true) return true;
        const status = typeof job.status === "string" ? job.status.toLowerCase() : "";
        return status === "published" || status === "active" || status === "online";
      });

      return activeJobs.map((job) => ({
        id: job.id,
        title: job.city ? `${job.title} · ${job.city}` : job.title,
        city: job.city,
      }));
    },
    enabled: !!companyId,
  });

  // Load locked matches
  const { data: matchesData, isLoading: matchesLoading, refetch } = useQuery({
    queryKey: ["company-locked-matches", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const data = await getCompanyMatchesWithProfiles(companyId, {
        visibility: "locked",
        limit: 100, // Load more matches for filtering
      });
      return data || [];
    },
    enabled: !!companyId,
  });

  // Filter matches based on view mode
  const filteredMatches = useMemo(() => {
    if (!matchesData) return [];
    
    let filtered = matchesData as MatchWithProfile[];

    // Filter by view mode
    if (viewMode === "applications") {
      filtered = filtered.filter(m => m.is_application === true);
    } else if (viewMode === "byJob" && selectedJobId) {
      // TODO: Filter by job_id when job_id is available in match data
      // For now, we filter by checking if candidate has an application for this job
      // This requires checking the applications table or adding job_id to the match view
      filtered = filtered; // Placeholder - will need to enhance match data with job_id
    }

    // Sort by score descending
    return filtered.sort((a, b) => b.overall_score - a.overall_score);
  }, [matchesData, viewMode, selectedJobId]);

  // Handle unlock action
  const handleUnlock = (candidateId: string, tokenCost: number) => {
    // TODO: Implement unlock flow
    // This should:
    // 1. Check if company has enough tokens
    // 2. Call unlock_candidate RPC or similar function
    // 3. Update company_candidates table (set unlocked_at)
    // 4. Deduct tokens from company
    // 5. Refresh matches list
    // 6. Show success/error toast
    
    console.log("TODO: Unlock candidate", {
      candidateId,
      tokenCost,
      companyId,
    });
    
    toast.info("Freischalt-Funktion wird implementiert...");
    
    // Placeholder for future implementation:
    // await unlockCandidate(companyId, candidateId, tokenCost);
    // await refetch();
  };

  if (matchesLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-slate-600">Matches werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Kandidaten-Matching</h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Entdecken Sie passende Talente für Ihr Unternehmen und schalten Sie gezielt die besten Profile frei.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setViewMode("all");
                setSelectedJobId(undefined);
              }}
              className="rounded-full"
            >
              Alle Matches
            </Button>
            <Button
              variant={viewMode === "applications" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setViewMode("applications");
                setSelectedJobId(undefined);
              }}
              className="rounded-full"
            >
              Nur Bewerbungen
            </Button>
            <Button
              variant={viewMode === "byJob" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("byJob")}
              className="rounded-full"
            >
              Nach Stelle
            </Button>
          </div>

          {viewMode === "byJob" && (
            <Select
              value={selectedJobId || ""}
              onValueChange={(value) => setSelectedJobId(value || undefined)}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Stellenanzeige auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Stellenanzeigen</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stats Summary */}
        {filteredMatches.length > 0 && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-slate-700">
                  {filteredMatches.length} {filteredMatches.length === 1 ? "Match gefunden" : "Matches gefunden"}
                </span>
              </div>
              <div className="text-sm text-slate-500">
                Durchschnittlicher Score: {Math.round(
                  filteredMatches.reduce((sum, m) => sum + m.overall_score, 0) / filteredMatches.length
                )}%
              </div>
            </div>
          </div>
        )}

        {/* Matches List */}
        {filteredMatches.length === 0 ? (
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Briefcase className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">
                {viewMode === "applications" 
                  ? "Keine Bewerbungs-Matches gefunden"
                  : viewMode === "byJob"
                  ? "Keine Matches für diese Stelle gefunden"
                  : "Keine Matches gefunden"}
              </h3>
              <p className="text-sm text-slate-600">
                {viewMode === "all"
                  ? "Es gibt aktuell keine verfügbaren Matches. Versuchen Sie es später erneut oder passen Sie Ihre Suchkriterien an."
                  : "Versuchen Sie einen anderen Filter oder passen Sie Ihre Suchkriterien an."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onUnlock={handleUnlock}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

