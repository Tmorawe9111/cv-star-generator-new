import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SearchHeader } from "@/components/Company/SearchHeader";
import { ProfileCard } from "@/components/profile/ProfileCard";
import CandidateProfilePreviewModal from "@/components/candidate/CandidateProfilePreviewModal";
import CandidateUnlockModal from "@/components/unlock/CandidateUnlockModal";
import {
  Search as SearchIcon,
  Filter,
  MapPin,
  Briefcase,
  Coins,
  Heart,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Profile {
  id: string;
  user_id?: string;
  vorname: string;
  nachname: string;
  status: string;
  branche: string;
  ort: string;
  plz: string;
  avatar_url?: string;
  headline?: string;
  faehigkeiten?: any;
  email?: string;
  telefon?: string;
  cv_url?: string;
  job_search_preferences?: string[];
}

interface SearchFilters {
  keywords: string;
  targetGroup: string;
  location: string;
  radius: number;
  industry: string;
  availability: string;
  jobTitle: string;
  jobSearchType: string[];
}

const ITEMS_PER_PAGE = 24;

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

export default function CompanySearch() {
  const { company } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [unlockedProfiles, setUnlockedProfiles] = useState<Set<string>>(new Set());
  const [savedMatches, setSavedMatches] = useState<Profile[]>([]);
  const [previewProfile, setPreviewProfile] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [unlockModalData, setUnlockModalData] = useState<{
    open: boolean;
    profile: Profile | null;
  }>({ open: false, profile: null });
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<SearchFilters>({
    keywords: "",
    targetGroup: "",
    location: "",
    radius: 50,
    industry: "",
    availability: "",
    jobTitle: "",
    jobSearchType: [],
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
  }, [company?.id, JSON.stringify(filters), currentPage, selectedNeedId]);
  
  useEffect(() => {
    if (company) {
      loadUnlockedProfiles();
      loadSavedMatches();
    }
  }, [company?.id]);

  useEffect(() => {
    // Reset to first page when filters or company change
    setCurrentPage(1);
  }, [JSON.stringify(filters), company?.id, selectedNeedId]);

  useEffect(() => {
    // Check for need parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const needParam = urlParams.get('need');
    if (needParam) {
      setSelectedNeedId(needParam);
    }
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      if (!company) return;

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Get already unlocked candidate IDs from company_candidates
      const { data: unlockedData } = await supabase
        .from('company_candidates')
        .select('candidate_id')
        .eq('company_id', company.id)
        .not('unlocked_at', 'is', null);

      const unlockedIds = unlockedData?.map(item => item.candidate_id) || [];

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('profile_published', true);

      // Exclude already unlocked profiles
      if (unlockedIds.length > 0) {
        query = query.not('id', 'in', `(${unlockedIds.map(id => `"${id}"`).join(',')})`);
      }

      // Apply filters including need-based matching
      if (selectedNeedId) {
        // If a specific need is selected, get matches from need_matches table
        const { data: needMatches } = await supabase
          .from('need_matches')
          .select('candidate_id, score')
          .eq('need_id', selectedNeedId)
          .order('score', { ascending: false });
        
        if (needMatches && needMatches.length > 0) {
          const candidateIds = needMatches.map(m => m.candidate_id);
          query = query.in('id', candidateIds);
        } else {
          // No matches for this need, return empty results
          setProfiles([]);
          setTotalCount(0);
          return;
        }
      }
      
      // Apply other filters
      if (filters.targetGroup) {
        query = query.eq('status', filters.targetGroup);
      }
      if (filters.industry) {
        query = query.ilike('branche', `%${filters.industry}%`);
      }
      if (filters.location) {
        query = query.ilike('ort', `%${filters.location}%`);
      }
      if (filters.jobTitle) {
        query = query.or(`ausbildungsberuf.ilike.%${filters.jobTitle}%,aktueller_beruf.ilike.%${filters.jobTitle}%,headline.ilike.%${filters.jobTitle}%`);
      }
      if (filters.jobSearchType && filters.jobSearchType.length > 0) {
        const esc = (s: string) => s.replace(/"/g, '\\"');
        const jobSearchConditions = filters.jobSearchType.map(type => 
          `job_search_preferences.ov.{"${esc(type)}"}`
        ).join(',');
        query = query.or(jobSearchConditions);
      }
      if (filters.keywords) {
        query = query.or(`vorname.ilike.%${filters.keywords}%,nachname.ilike.%${filters.keywords}%,headline.ilike.%${filters.keywords}%`);
      }

      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setProfiles((data || []) as Profile[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({ title: "Fehler beim Laden der Profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadUnlockedProfiles = async () => {
    if (!company) return;

    try {
      const { data } = await supabase
        .from('tokens_used')
        .select('profile_id')
        .eq('company_id', company.id);

      setUnlockedProfiles(new Set(data?.map(item => item.profile_id) || []));
    } catch (error) {
      console.error('Error loading unlocked profiles:', error);
    }
  };

  const loadSavedMatches = async () => {
    if (!company) return;

    try {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          profiles (*)
        `)
        .eq('company_id', company.id)
        .eq('status', 'saved');

      setSavedMatches((data?.map(item => item.profiles).filter(Boolean) || []) as Profile[]);
    } catch (error) {
      console.error('Error loading saved matches:', error);
    }
  };

  const handlePreviewProfile = async (profile: Profile) => {
    setPreviewOpen(true);
    setLoadingPreview(true);

    setPreviewProfile({
      ...profile,
      is_unlocked: isProfileUnlocked(profile.id),
    });

    if (company && user) {
      try {
        await supabase.from('company_activity').insert({
          company_id: company.id,
          type: 'profile_view',
          actor_user_id: user.id,
          payload: { profile_id: profile.id },
        });
      } catch (error) {
        console.error('Failed to log profile view', error);
      }
    }

    try {
      const { data: fullProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      const parsedProfile = {
        ...fullProfile,
        berufserfahrung: parseJsonField(fullProfile.berufserfahrung) || [],
        schulbildung: parseJsonField(fullProfile.schulbildung) || [],
        faehigkeiten: parseJsonField(fullProfile.faehigkeiten) || [],
        sprachkenntnisse: parseJsonField(fullProfile.sprachkenntnisse) || [],
        sprachen: parseJsonField(fullProfile.sprachen) || [],
        languages: parseJsonField(fullProfile.languages) || [],
      };

      let isUnlocked = isProfileUnlocked(profile.id);
      if (!isUnlocked && company?.id) {
        const { data: unlockData } = await supabase
          .from('company_candidates')
          .select('unlocked_at')
          .eq('company_id', company.id)
          .eq('candidate_id', parsedProfile.user_id || parsedProfile.id)
          .not('unlocked_at', 'is', null)
          .maybeSingle();

        isUnlocked = !!unlockData;
      }

      setPreviewProfile({
        ...parsedProfile,
        is_unlocked: isUnlocked,
      });
    } catch (error) {
      console.error('Error loading profile preview:', error);
      toast({
        title: 'Fehler',
        description: 'Profil konnte nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleUnlockProfile = async (profile: Profile) => {
    setUnlockModalData({ open: true, profile });
  };

  const handleSaveMatch = async (profile: Profile) => {
    if (!company) return;

    try {
      const { error } = await supabase
        .from('matches')
        .insert({
          company_id: company.id,
          profile_id: profile.id,
          status: 'saved',
        });

      if (error) throw error;
      setSavedMatches(prev => [...prev, profile]);
      toast({ title: "Profil gespeichert" });
    } catch (error) {
      console.error('Error saving match:', error);
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const isProfileUnlocked = (profileId: string) => unlockedProfiles.has(profileId);

  const calculateMatchPercentage = (profile: Profile) => {
    // Simple matching algorithm
    let score = 0;
    let totalWeight = 0;

    // Industry match (40% weight)
    if (profile.branche && filters.industry && profile.branche.toLowerCase().includes(filters.industry.toLowerCase())) {
      score += 40;
    }
    totalWeight += 40;

    // Location match (30% weight)
    if (profile.ort && filters.location && profile.ort.toLowerCase().includes(filters.location.toLowerCase())) {
      score += 30;
    }
    totalWeight += 30;

    // Skills match (30% weight)
    if (profile.faehigkeiten && Array.isArray(profile.faehigkeiten) && profile.faehigkeiten.length > 0) {
      score += Math.min(30, profile.faehigkeiten.length * 3);
    }
    totalWeight += 30;

    return Math.round((score / totalWeight) * 100) || Math.floor(Math.random() * 40) + 60; // Default fallback with some randomness
  };

  // Use profiles directly since filtering is done at database level
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return (
    <div className="p-3 md:p-6 min-h-screen bg-background max-w-full overflow-x-hidden space-y-6">
      {/* LinkedIn-style Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Kandidatensuche</h1>
            {selectedNeedId && (
              <p className="text-muted-foreground text-sm mt-1">Gefiltert nach Anforderungsprofil</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {selectedNeedId && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSelectedNeedId(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete('need');
                  window.history.replaceState({}, '', url.toString());
                }}
              >
                Filter entfernen
              </Button>
            )}
            <Badge variant="secondary" className="px-3 py-1">
              <Coins className="h-4 w-4 mr-1" />
              {company?.active_tokens || 0} Tokens
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {totalCount} Kandidaten
            </Badge>
          </div>
        </div>

      <SearchHeader 
        filters={filters}
        onFiltersChange={setFilters}
        resultsCount={totalCount}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      {/* Advanced Filters - Pipeline Style */}
      {showAdvancedFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Art der Suche */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Art der Suche</Label>
                <div className="flex flex-wrap gap-2">
                  {['Praktikum', 'Ausbildung', 'Nach der Ausbildung Job', 'Ausbildungsplatzwechsel'].map((type) => (
                    <Button
                      key={type}
                      variant={filters.jobSearchType.includes(type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newTypes = filters.jobSearchType.includes(type)
                          ? filters.jobSearchType.filter(t => t !== type)
                          : [...filters.jobSearchType, type];
                        setFilters({ ...filters, jobSearchType: newTypes });
                      }}
                      className="h-8"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Weitere Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Weitere Filter</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-title">Jobtitel</Label>
                    <Input
                      id="job-title"
                      placeholder="z. B. Azubi im Handwerk"
                      value={filters.jobTitle}
                      onChange={(e) => updateFilter('jobTitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry-detailed">Branche</Label>
                    <Input
                      id="industry-detailed"
                      placeholder="z. B. Bau, IT"
                      value={filters.industry}
                      onChange={(e) => updateFilter('industry', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-detailed">Standort</Label>
                    <Input
                      id="location-detailed"
                      placeholder="z. B. Berlin"
                      value={filters.location}
                      onChange={(e) => updateFilter('location', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    keywords: filters.keywords,
                    targetGroup: filters.targetGroup,
                    location: "",
                    radius: 50,
                    industry: "",
                    availability: "",
                    jobTitle: "",
                    jobSearchType: [],
                  })}
                >
                  Zurücksetzen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Keine Kandidaten gefunden</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Versuchen Sie andere Suchkriterien oder erweitern Sie den Umkreis.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {profiles.map((profile) => {
                const unlocked = isProfileUnlocked(profile.id);
                const matchPercentage = calculateMatchPercentage(profile);
                
                return (
                  <ProfileCard
                    key={profile.id}
                    profile={{
                      id: profile.id,
                      name: profile.vorname, // Only first name for anonymity
                      avatar_url: null, // No avatar for anonymity
                      industry: profile.branche || undefined,
                      occupation: profile.headline || undefined,
                      city: profile.ort,
                      fs: true, // Default for search results
                      seeking: Array.isArray(profile.job_search_preferences) && profile.job_search_preferences.length > 0
                        ? profile.job_search_preferences.join(', ')
                        : undefined,
                      skills: Array.isArray(profile.faehigkeiten) ? profile.faehigkeiten : [],
                      match: matchPercentage,
                    }}
                    variant="search"
                    onUnlock={() => handleUnlockProfile(profile)}
                    onView={() => handlePreviewProfile(profile)}
                    onToggleFavorite={() => handleSaveMatch(profile)}
                  />
                );
              })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Saved Matches Section */}
      {savedMatches.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Gespeicherte Matches ({savedMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {savedMatches.slice(0, 4).map((profile) => (
                <div key={profile.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || ""} />
                    <AvatarFallback>
                      {profile.vorname?.charAt(0)}{profile.nachname?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{profile.vorname} {profile.nachname}</p>
                    <p className="text-sm text-muted-foreground truncate">{profile.branche}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <CandidateProfilePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        profile={previewProfile}
        isUnlocked={!!previewProfile?.is_unlocked}
        isLoading={loadingPreview}
        onUnlockSuccess={() => {
          loadUnlockedProfiles();
          loadProfiles();
          if (previewProfile?.id) {
            const profileId = previewProfile.id;
            setPreviewOpen(false);
            navigate(`/company/profile/${profileId}`, {
              state: {
                from: { pathname: location.pathname, search: location.search },
                label: "Kandidatensuche",
              },
            });
          }
        }}
      />

      {/* Unlock Modal */}
      {unlockModalData.profile && (
        <CandidateUnlockModal
          open={unlockModalData.open}
          onOpenChange={(open) => setUnlockModalData({ open, profile: null })}
          candidate={{
            id: unlockModalData.profile.id,
            user_id: unlockModalData.profile.user_id || unlockModalData.profile.id,
            full_name: `${unlockModalData.profile.vorname} ${unlockModalData.profile.nachname}`,
            vorname: unlockModalData.profile.vorname,
            nachname: unlockModalData.profile.nachname,
          }}
          companyId={company?.id || ""}
          contextApplication={null}
          contextType="none"
          onSuccess={() => {
            const profileId = unlockModalData.profile?.id;
            loadUnlockedProfiles();
            loadProfiles();
            toast({ title: "Kandidat freigeschaltet!" });
            setUnlockModalData({ open: false, profile: null });
            if (profileId) {
              navigate(`/company/profile/${profileId}`, {
                state: {
                  from: { pathname: location.pathname, search: location.search },
                  label: "Kandidatensuche",
                },
              });
            }
          }}
        />
      )}

    </div>
  );
}