import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
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
import { sanitizePreviewProfile } from "@/utils/sanitizePreviewProfile";
import { useGeocoding, useRadiusSearch } from "@/hooks/useGeocoding";
import { LocationAutocomplete } from "@/components/Company/LocationAutocomplete";
import { BRANCHES } from '@/lib/branches';

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
  status: string[]; // Status filter: schueler, azubi, ausgelernt
  location: string;
  radius: number;
  industry: string[]; // Changed to array for multiple selection
  availability: string;
  jobTitle: string;
  jobSearchType: string[];
  abschluss: string[]; // Abschluss filter: Hauptschulabschluss, Realschulabschluss, Abitur, etc.
}

const ITEMS_PER_PAGE = 24;

// Branchen options for filtering - use centralized branches
const BRANCHEN_OPTIONS = BRANCHES.map(branch => ({
  value: branch.key,
  label: branch.label
}));

// Status options for filtering
const STATUS_OPTIONS = [
  { value: 'schueler', label: 'Schüler:in' },
  { value: 'azubi', label: 'Auszubildender' },
  { value: 'ausgelernt', label: 'Fachkraft' },
];

// Abschluss options for filtering
const ABSCHLUSS_OPTIONS = [
  { value: 'Hauptschulabschluss', label: 'Hauptschulabschluss' },
  { value: 'Realschulabschluss', label: 'Realschulabschluss' },
  { value: 'Abitur', label: 'Abitur' },
  { value: 'Fachabitur', label: 'Fachabitur' },
  { value: 'Fachhochschulreife', label: 'Fachhochschulreife' },
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'Ausbildung abgeschlossen', label: 'Ausbildung abgeschlossen' },
];

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
  const [dismissedProfileIds, setDismissedProfileIds] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<SearchFilters>({
    keywords: "",
    targetGroup: "",
    status: [], // Status filter array
    location: "",
    radius: 50,
    industry: [], // Changed to array
    availability: "",
    jobTitle: "",
    jobSearchType: [],
    abschluss: [], // Abschluss filter array
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const { toast } = useToast();
  const { geocodeAddress, loading: geocodingLoading } = useGeocoding();
  const { searchWithinRadius, loading: radiusSearchLoading } = useRadiusSearch();

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

  // Initialize filters based on company data (only once, unless need parameter is set)
  useEffect(() => {
    if (!company || filtersInitialized) return;
    
    // Don't initialize filters if a need parameter is set (it has its own filtering)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('need')) {
      setFiltersInitialized(true);
      return;
    }

    const initializeFilters = async () => {
      try {
        // Set industry filter from company.industry
        const newFilters: Partial<SearchFilters> = {};
        
        if (company.industry) {
          // Convert single industry to array
          newFilters.industry = Array.isArray(company.industry) 
            ? company.industry 
            : [company.industry];
        }

        // Load company settings to get target_status
        const { data: companySettings } = await supabase
          .from('company_settings')
          .select('target_status')
          .eq('company_id', company.id)
          .maybeSingle();

        if (companySettings?.target_status && Array.isArray(companySettings.target_status)) {
          // Set status filter directly from target_status
          // target_status: ["azubi", "schueler", "ausgelernt"]
          newFilters.status = companySettings.target_status.filter(s => 
            ['schueler', 'azubi', 'ausgelernt'].includes(s)
          );
          
          // Also map target_status to jobSearchType for backward compatibility
          // jobSearchType: ["Praktikum", "Ausbildung", "Nach der Ausbildung Job", "Ausbildungsplatzwechsel"]
          const jobSearchTypes: string[] = [];
          
          // Map based on target_status values
          if (companySettings.target_status.includes('schueler')) {
            jobSearchTypes.push('Praktikum');
          }
          if (companySettings.target_status.includes('azubi')) {
            jobSearchTypes.push('Ausbildung');
            jobSearchTypes.push('Ausbildungsplatzwechsel');
          }
          if (companySettings.target_status.includes('ausgelernt')) {
            jobSearchTypes.push('Nach der Ausbildung Job');
          }

          // Only set if we have mappings
          if (jobSearchTypes.length > 0) {
            newFilters.jobSearchType = jobSearchTypes;
          }
        }

        // Update filters if we have any new values
        if (Object.keys(newFilters).length > 0) {
          setFilters(prev => ({ ...prev, ...newFilters }));
        }

        setFiltersInitialized(true);
      } catch (error) {
        console.error('Error initializing filters:', error);
        // Still mark as initialized to avoid retrying
        setFiltersInitialized(true);
      }
    };

    initializeFilters();
  }, [company, filtersInitialized]);

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

      // Only select needed fields for better performance
      // Note: Use correct column names: faehigkeiten (not skills), sprachen (not languages), schulbildung (not education), berufserfahrung (not experience)
      let query = supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url, headline, ort, plz, branche, status, aktueller_beruf, job_search_preferences, faehigkeiten, sprachen, schulbildung, berufserfahrung, visibility_mode, created_at, updated_at', { count: 'exact' })
        .eq('profile_published', true)
        .eq('visibility_mode', 'visible'); // Only show visible profiles

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
      
      // Apply status filter (multiple statuses)
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      } else if (filters.targetGroup) {
        // Fallback to old targetGroup filter for backward compatibility
        query = query.eq('status', filters.targetGroup);
      }

      // Apply abschluss filter - will be filtered in memory after fetching
      // Filter by multiple industries (branche field uses branch keys)
      if (filters.industry && filters.industry.length > 0) {
        // Use exact match for branch keys (e.g., 'handwerk', 'it', 'gesundheit')
        query = query.in('branche', filters.industry);
      }
      
      // Radius-Suche: Wenn location und radius gesetzt sind, verwende Geocoding + Radius-Suche
      let radiusFilteredIds: string[] | null = null;
      if (filters.location && filters.radius > 0) {
        try {
          // Parse PLZ und Stadt aus location String
          const locationParts = filters.location.trim().split(/\s+/);
          const plzMatch = locationParts.find(part => /^\d{5}$/.test(part));
          const plz = plzMatch || null;
          const city = plzMatch 
            ? locationParts.filter(p => p !== plzMatch).join(' ') 
            : filters.location;

          // Geocode Adresse
          const coords = await geocodeAddress(plz || undefined, city || undefined);
          
          if (coords && coords.latitude && coords.longitude) {
            // Suche Profile im Radius
            const radiusResults = await searchWithinRadius(
              coords.latitude,
              coords.longitude,
              filters.radius
            );

            if (radiusResults && radiusResults.length > 0) {
              radiusFilteredIds = radiusResults.map(r => r.profile_id);
              query = query.in('id', radiusFilteredIds);
            } else {
              // Keine Ergebnisse im Radius, setze leere Liste
              setProfiles([]);
              setTotalCount(0);
              return;
            }
          } else {
            // Geocoding fehlgeschlagen, fallback zu normaler Text-Suche
            query = query.ilike('ort', `%${filters.location}%`);
          }
        } catch (error) {
          console.error('Radius search error:', error);
          // Fallback zu normaler Text-Suche bei Fehler
          query = query.ilike('ort', `%${filters.location}%`);
        }
      } else if (filters.location) {
        // Normale Text-Suche wenn kein Radius gesetzt
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
      
      // Parse JSON fields and apply abschluss filter in memory
      let parsedProfiles = (data || []).map((profile: any) => ({
        ...profile,
        faehigkeiten: parseJsonField(profile.faehigkeiten),
        job_search_preferences: parseJsonField(profile.job_search_preferences),
        schulbildung: parseJsonField(profile.schulbildung),
      }));

      // Apply abschluss filter in memory (check geplanter_abschluss and schulbildung array)
      if (filters.abschluss && filters.abschluss.length > 0) {
        parsedProfiles = parsedProfiles.filter((profile: any) => {
          // Check geplanter_abschluss
          if (profile.geplanter_abschluss && filters.abschluss.includes(profile.geplanter_abschluss)) {
            return true;
          }
          // Check schulbildung JSONB array
          if (Array.isArray(profile.schulbildung)) {
            const hasMatchingAbschluss = profile.schulbildung.some((edu: any) => {
              const abschluss = edu.abschluss || edu.degree || edu.qualifikation;
              return abschluss && filters.abschluss.includes(abschluss);
            });
            if (hasMatchingAbschluss) return true;
          }
          return false;
        });
      }

      setProfiles(parsedProfiles as Profile[]);
      // For abschluss filter, we need to get total count from all profiles, not just this page
      if (filters.abschluss && filters.abschluss.length > 0) {
        // Get all profiles to count properly
        const { count: totalCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('profile_published', true)
          .eq('visibility_mode', 'visible');
        // Apply same filters and count
        // For now, use the filtered length as approximation
        setTotalCount(parsedProfiles.length);
      } else {
        setTotalCount(count || 0);
      }
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
      const { data, error } = await supabase
        .from('company_candidates')
        .select('candidate_id')
        .eq('company_id', company.id)
        .not('unlocked_at', 'is', null);

      if (error) throw error;

      setUnlockedProfiles(new Set(data?.map(item => item.candidate_id) || []));
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

    const initialUnlocked = isProfileUnlocked(profile.id);
    const initialPreview = sanitizePreviewProfile({ ...profile }, initialUnlocked);
    setPreviewProfile(initialPreview);

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
        languages: parseJsonField(fullProfile.sprachen) || [],
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

      const sanitizedProfile = sanitizePreviewProfile(parsedProfile, isUnlocked);
      setPreviewProfile(sanitizedProfile);
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
    setFilters(prev => {
      // Special handling for array filters to prevent duplicates
      if ((key === 'industry' || key === 'status' || key === 'jobSearchType') && Array.isArray(value)) {
        // Remove duplicates
        const uniqueValues = Array.from(new Set(value));
        return { ...prev, [key]: uniqueValues };
      }
      return { ...prev, [key]: value };
    });
  };

  const isProfileUnlocked = (profileId: string) => unlockedProfiles.has(profileId);

  const handleMarkNotFit = async (profileId: string) => {
    setDismissedProfileIds((prev) => {
      const next = new Set(prev);
      next.add(profileId);
      return next;
    });
    setProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
    setSavedMatches((prev) => prev.filter((profile) => profile.id !== profileId));
    setPreviewOpen(false);
    toast({
      title: "Profil ausgeblendet",
      description: "Dieses Profil wird nicht mehr angezeigt.",
    });
  };

  const calculateMatchPercentage = (profile: Profile) => {
    // Simple matching algorithm
    let score = 0;
    let totalWeight = 0;

    // Industry match (40% weight) - exact match for branch keys
    if (profile.branche && filters.industry && filters.industry.length > 0) {
      const matchesIndustry = filters.industry.includes(profile.branche);
      if (matchesIndustry) {
        score += 40;
      }
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
  const visibleProfiles = profiles.filter(
    (profile) => !dismissedProfileIds.has(profile.id) && !unlockedProfiles.has(profile.id)
  );

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
              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Status</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    // Prevent duplicate selection and empty values
                    if (value && value !== "" && !filters.status.includes(value)) {
                      const newStatuses = [...filters.status, value];
                      // Double-check for duplicates before updating
                      const uniqueStatuses = Array.from(new Set(newStatuses));
                      updateFilter('status', uniqueStatuses);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filters.status.length > 0 ? `${filters.status.length} ausgewählt` : "Status hinzufügen"} />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter(s => !filters.status.includes(s.value)).length > 0 ? (
                      STATUS_OPTIONS.filter(s => !filters.status.includes(s.value)).map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Alle Status ausgewählt
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {filters.status.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.status.map((stat) => {
                      const statusOption = STATUS_OPTIONS.find(s => s.value === stat);
                      return (
                        <Badge
                          key={stat}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {statusOption?.label || stat}
                          <button
                            onClick={() => {
                              updateFilter('status', filters.status.filter(s => s !== stat));
                            }}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

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

              {/* Abschluss Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Abschluss</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    // Prevent duplicate selection and empty values
                    if (value && value !== "" && !filters.abschluss.includes(value)) {
                      const newAbschluesse = [...filters.abschluss, value];
                      // Double-check for duplicates before updating
                      const uniqueAbschluesse = Array.from(new Set(newAbschluesse));
                      updateFilter('abschluss', uniqueAbschluesse);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filters.abschluss.length > 0 ? `${filters.abschluss.length} ausgewählt` : "Abschluss hinzufügen"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ABSCHLUSS_OPTIONS.filter(a => !filters.abschluss.includes(a.value)).length > 0 ? (
                      ABSCHLUSS_OPTIONS.filter(a => !filters.abschluss.includes(a.value)).map((abschluss) => (
                        <SelectItem key={abschluss.value} value={abschluss.value}>
                          {abschluss.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Alle Abschlüsse ausgewählt
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {filters.abschluss.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.abschluss.map((abschluss) => {
                      const abschlussOption = ABSCHLUSS_OPTIONS.find(a => a.value === abschluss);
                      return (
                        <Badge
                          key={abschluss}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {abschlussOption?.label || abschluss}
                          <button
                            onClick={() => {
                              updateFilter('abschluss', filters.abschluss.filter(a => a !== abschluss));
                            }}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
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
                    <Select
                      value=""
                      onValueChange={(value) => {
                        // Prevent duplicate selection and empty values
                        if (value && value !== "" && !filters.industry.includes(value)) {
                          const newIndustries = [...filters.industry, value];
                          // Double-check for duplicates before updating
                          const uniqueIndustries = Array.from(new Set(newIndustries));
                          updateFilter('industry', uniqueIndustries);
                        }
                      }}
                    >
                      <SelectTrigger id="industry-detailed">
                        <SelectValue placeholder={filters.industry.length > 0 ? `${filters.industry.length} ausgewählt` : "Branche hinzufügen"} />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCHEN_OPTIONS.filter(b => !filters.industry.includes(b.value)).length > 0 ? (
                          BRANCHEN_OPTIONS.filter(b => !filters.industry.includes(b.value)).map((branche) => (
                            <SelectItem key={branche.value} value={branche.value}>
                              {branche.label}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Alle Branchen ausgewählt
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {filters.industry.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {filters.industry.map((ind) => {
                          const branche = BRANCHEN_OPTIONS.find(b => b.value === ind);
                          return (
                            <Badge
                              key={ind}
                              variant="secondary"
                              className="flex items-center gap-1 pr-1"
                            >
                              {branche?.label || ind}
                              <button
                                onClick={() => {
                                  updateFilter('industry', filters.industry.filter(i => i !== ind));
                                }}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-detailed">Standort (PLZ oder Stadt)</Label>
                    <LocationAutocomplete
                      id="location-detailed"
                      value={filters.location}
                      onChange={(value) => updateFilter('location', value)}
                      placeholder="z. B. 10115 Berlin oder Berlin"
                    />
                  </div>
                </div>
              </div>

              {/* Radius-Suche */}
              {filters.location && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="radius" className="text-sm font-medium">
                      Suchradius: {filters.radius} km
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      Radius-Suche aktiv
                    </Badge>
                  </div>
                  <div className="px-2">
                    <Slider
                      id="radius"
                      min={5}
                      max={200}
                      step={5}
                      value={[filters.radius]}
                      onValueChange={(value) => updateFilter('radius', value[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>5 km</span>
                      <span>100 km</span>
                      <span>200 km</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Findet Kandidaten innerhalb von {filters.radius} km um {filters.location}
                  </p>
                </div>
              )}

              {/* Reset Button */}
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    keywords: filters.keywords,
                    targetGroup: filters.targetGroup,
                    status: [],
                    location: "",
                    radius: 50,
                    industry: [],
                    availability: "",
                    jobTitle: "",
                    jobSearchType: [],
                    abschluss: [],
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
        ) : visibleProfiles.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Keine Kandidaten gefunden</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Versuchen Sie andere Suchkriterien oder erweitern Sie den Umkreis.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {visibleProfiles.map((profile) => {
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
                      available_from: (profile as any).available_from || undefined,
                      visibility_mode: profile.visibility_mode || undefined,
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
        onMarkNotFit={
          previewProfile?.id
            ? () => handleMarkNotFit(previewProfile.id)
            : undefined
        }
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