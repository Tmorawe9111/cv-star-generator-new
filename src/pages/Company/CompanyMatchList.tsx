import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { LayoutGrid, List, RefreshCw, TrendingUp, XCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { cn } from "@/lib/utils";
import { FullProfileModal } from "@/components/Company/FullProfileModal";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface MatchProfile {
  id: string;
  candidate_id: string;
  company_id: string;
  is_eligible: boolean;
  ineligible_reasons?: string[];
  base_score: number | null;
  values_score: number | null;
  role_score: number | null;
  interview_score: number | null;
  overall_score: number;
  score_breakdown?: any;
  last_calculated_at: string;
  // Profile data
  vorname?: string;
  nachname?: string;
  status?: string;
  branche?: string;
  ort?: string;
  plz?: string;
  avatar_url?: string;
  headline?: string;
  faehigkeiten?: any;
  email?: string;
  telefon?: string;
  cv_url?: string;
}

const ITEMS_PER_PAGE = 20;

export default function CompanyMatchList() {
  const { company, isLoading: companyLoading } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [eligibilityFilter, setEligibilityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Load matches from candidate_company_matches table
  const loadMatches = useCallback(async () => {
    if (!company?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidate_company_matches')
        .select(`
          *,
          profiles:candidate_id (
            id,
            vorname,
            nachname,
            email,
            telefon,
            avatar_url,
            ort,
            plz,
            branche,
            status,
            headline,
            faehigkeiten,
            cv_url,
            profile_published
          )
        `)
        .eq('company_id', company.id)
        .order('overall_score', { ascending: false })
        .order('last_calculated_at', { ascending: false });

      if (error) throw error;

      // Transform data to include profile fields
      const transformedMatches: MatchProfile[] = (data || []).map((match: any) => ({
        ...match,
        vorname: match.profiles?.vorname,
        nachname: match.profiles?.nachname,
        email: match.profiles?.email,
        telefon: match.profiles?.telefon,
        avatar_url: match.profiles?.avatar_url,
        ort: match.profiles?.ort,
        plz: match.profiles?.plz,
        branche: match.profiles?.branche,
        status: match.profiles?.status,
        headline: match.profiles?.headline,
        faehigkeiten: match.profiles?.faehigkeiten,
        cv_url: match.profiles?.cv_url,
      }));

      setMatches(transformedMatches);
    } catch (error: any) {
      console.error('Error loading matches:', error);
      toast.error('Matches konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Recalculate match for a specific candidate
  const recalculateMatch = useCallback(async (candidateId: string) => {
    if (!company?.id) return;

    setRecalculating(candidateId);
    try {
      const { data, error } = await supabase.rpc('calculate_candidate_company_match', {
        p_company_id: company.id,
        p_candidate_id: candidateId,
      });

      if (error) throw error;

      toast.success('Match erfolgreich neu berechnet');
      await loadMatches();
    } catch (error: any) {
      console.error('Error recalculating match:', error);
      toast.error('Match konnte nicht neu berechnet werden');
    } finally {
      setRecalculating(null);
    }
  }, [company?.id, loadMatches]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(match =>
        `${match.vorname} ${match.nachname}`.toLowerCase().includes(query) ||
        match.ort?.toLowerCase().includes(query) ||
        match.branche?.toLowerCase().includes(query)
      );
    }

    // Score filter
    if (scoreFilter !== "all") {
      const minScore = parseInt(scoreFilter);
      filtered = filtered.filter(match => match.overall_score >= minScore);
    }

    // Eligibility filter
    if (eligibilityFilter === "eligible") {
      filtered = filtered.filter(match => match.is_eligible);
    } else if (eligibilityFilter === "ineligible") {
      filtered = filtered.filter(match => !match.is_eligible);
    }

    return filtered;
  }, [matches, searchQuery, scoreFilter, eligibilityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMatches.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMatches, currentPage]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  if (companyLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Matches werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matching-Übersicht</h1>
          <p className="text-muted-foreground mt-1">
            {filteredMatches.length} {filteredMatches.length === 1 ? 'Match' : 'Matches'} gefunden
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Suche nach Name, Ort, Branche..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select value={scoreFilter} onValueChange={(value) => {
              setScoreFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Min. Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Scores</SelectItem>
                <SelectItem value="80">80+ (Sehr gut)</SelectItem>
                <SelectItem value="60">60+ (Gut)</SelectItem>
                <SelectItem value="40">40+ (Mittel)</SelectItem>
                <SelectItem value="0">0+ (Alle)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eligibilityFilter} onValueChange={(value) => {
              setEligibilityFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Eligibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="eligible">Nur Eligible</SelectItem>
                <SelectItem value="ineligible">Nur Ineligible</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadMatches}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Aktualisieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      {paginatedMatches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Keine Matches gefunden</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedMatches.map((match) => (
            <Card key={match.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {match.avatar_url ? (
                      <img
                        src={match.avatar_url}
                        alt={`${match.vorname} ${match.nachname}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        {match.vorname?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {match.vorname} {match.nachname}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {match.ort} {match.plz && `• ${match.plz}`}
                      </p>
                    </div>
                  </div>
                  {match.is_eligible ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score Display */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Match-Score</span>
                    <Badge variant={getScoreBadgeVariant(match.overall_score)}>
                      {match.overall_score}%
                    </Badge>
                  </div>
                  <Progress value={match.overall_score} className="h-2" />
                </div>

                {/* Score Breakdown */}
                {match.score_breakdown && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {match.base_score !== null && (
                      <div>Base: {match.base_score}%</div>
                    )}
                    {match.values_score !== null && (
                      <div>Values: {match.values_score}%</div>
                    )}
                    {match.role_score !== null && (
                      <div>Role: {match.role_score}%</div>
                    )}
                  </div>
                )}

                {/* Ineligible Reasons */}
                {!match.is_eligible && match.ineligible_reasons && match.ineligible_reasons.length > 0 && (
                  <div className="text-xs text-red-600">
                    <p className="font-medium mb-1">Nicht eligible:</p>
                    <ul className="list-disc list-inside">
                      {match.ineligible_reasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/company/profile/${match.candidate_id}`)}
                  >
                    Profil ansehen
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => recalculateMatch(match.candidate_id)}
                    disabled={recalculating === match.candidate_id}
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4",
                      recalculating === match.candidate_id && "animate-spin"
                    )} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kandidat</TableHead>
                <TableHead>Branche</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eligible</TableHead>
                <TableHead>Base Score</TableHead>
                <TableHead>Overall Score</TableHead>
                <TableHead>Berechnet</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMatches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {match.avatar_url ? (
                        <img
                          src={match.avatar_url}
                          alt={`${match.vorname} ${match.nachname}`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                          {match.vorname?.[0] || "?"}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {match.vorname} {match.nachname}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {match.ort}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{match.branche || "-"}</TableCell>
                  <TableCell>{match.status || "-"}</TableCell>
                  <TableCell>
                    {match.is_eligible ? (
                      <Badge variant="default">Ja</Badge>
                    ) : (
                      <Badge variant="destructive">Nein</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {match.base_score !== null ? (
                      <span className={getScoreColor(match.base_score)}>
                        {match.base_score}%
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getScoreBadgeVariant(match.overall_score)}>
                      {match.overall_score}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(match.last_calculated_at).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/company/profile/${match.candidate_id}`)}
                      >
                        Ansehen
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => recalculateMatch(match.candidate_id)}
                        disabled={recalculating === match.candidate_id}
                      >
                        <RefreshCw className={cn(
                          "h-4 w-4",
                          recalculating === match.candidate_id && "animate-spin"
                        )} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

