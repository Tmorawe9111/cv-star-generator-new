import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Coins, LayoutGrid, List, Filter, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SelectionBar } from "@/components/Company/SelectionBar";
import { useExportCandidates } from "@/hooks/useUnlockedBulk";
import { toast } from "sonner";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { cn } from "@/lib/utils";
import { useEqualizeCards } from "@/components/unlocked/useEqualizeCards";
import { FullProfileModal } from "@/components/Company/FullProfileModal";
import { UserCVModal } from "@/components/admin/user/UserCVModal";
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

interface Profile {
  id: string;
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
  has_drivers_license?: boolean;
  stage?: string;
  company_candidate_id?: string;
  unlocked_at?: string;
  unlock_source?: "bewerbung" | "initiativ";
  unlock_notes?: string;
  linkedJobTitles?: Array<{ id: string; title: string }>;
  match_score?: number | null;
  geplanter_abschluss?: string | null;
  schulbildung?: any;
  available_from?: string | null;
  has_drivers_license?: boolean;
  interview_date?: string | null;
}

const ITEMS_PER_PAGE = 20;

const normalizeSearchKind = (value: unknown): string | null => {
  if (!value) return null;

  const raw = typeof value === "string" ? value.trim() : String(value).trim();
  if (!raw) return null;

  const match = SEARCH_KIND_OPTIONS.find(
    (opt) =>
      opt.key.toLowerCase() === raw.toLowerCase() ||
      opt.label.toLowerCase() === raw.toLowerCase()
  );

  return match ? match.key : null;
};

// Vereinfachte Status-Filter - nur die wichtigsten Phasen
const STAGE_FILTERS = [
  { key: "FREIGESCHALTET", label: "Freigeschaltet", description: "Noch nicht kontaktiert" },
  { key: "INTERVIEW_GEPLANT", label: "Interview geplant", description: "Termin steht fest" },
  { key: "INTERVIEW_DURCHGEFÜHRT", label: "Interview durchgeführt", description: "Gespräch abgeschlossen" },
  { key: "ANGEBOT_GESENDET", label: "Angebot gesendet", description: "Warten auf Antwort" },
  { key: "EINGESTELLT", label: "Eingestellt", description: "Erfolgreich abgeschlossen" },
] as const;

// Abgelehnte/Abgesagte Kandidaten separat
const ARCHIVED_FILTERS = [
  { key: "ABGESAGT", label: "Abgesagt" },
  { key: "ABGELEHNT", label: "Abgelehnt" },
] as const;

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

const SEARCH_KIND_OPTIONS = [
  { key: "Praktikum", label: "Praktikum" },
  { key: "Ausbildung", label: "Ausbildung" },
  { key: "Nach der Ausbildung Job", label: "Nach der Ausbildung Job" },
  { key: "Ausbildungsplatzwechsel", label: "Ausbildungsplatzwechsel" },
] as const;

const PROCESS_STAGE_OPTIONS = [
  { value: "FREIGESCHALTET", label: "Freigeschaltet" },
  { value: "INTERVIEW_GEPLANT", label: "Interview geplant" },
  { value: "INTERVIEW_DURCHGEFÜHRT", label: "Interview durchgeführt" },
  { value: "ANGEBOT_GESENDET", label: "Angebot gesendet" },
  { value: "EINGESTELLT", label: "Eingestellt" },
  { value: "ABGESAGT", label: "Abgesagt" },
  { value: "ABGELEHNT", label: "Abgelehnt" },
  { value: "ON_HOLD", label: "On Hold" },
] as const;

type ProcessStageValue = typeof PROCESS_STAGE_OPTIONS[number]["value"];

const PIPELINE_ORDER: ProcessStageValue[] = [
  "FREIGESCHALTET",
  "INTERVIEW_GEPLANT",
  "INTERVIEW_DURCHGEFÜHRT",
  "ANGEBOT_GESENDET",
  "EINGESTELLT",
];

export default function CompanyUnlocked() {
  const { company } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Profile[]>([]);
  const [activeRecentTab, setActiveRecentTab] = useState<'unlocked' | 'viewed'>('unlocked');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [selectedCVUserId, setSelectedCVUserId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const gridRef = useEqualizeCards();
  
  // Initialize stage filters from location state if available
  const initialStageFilters = (location.state as any)?.initialStageFilters;
  const [selectedStageFilters, setSelectedStageFilters] = useState<string[]>(
    initialStageFilters && Array.isArray(initialStageFilters) && initialStageFilters.length > 0
      ? initialStageFilters
      : [STAGE_FILTERS[0].key] // Standard: Nur "Freigeschaltet" anzeigen
  );
  const [showArchived, setShowArchived] = useState(false);
  const [jobTitleFilter, setJobTitleFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [abschlussFilter, setAbschlussFilter] = useState<string[]>([]);
  const [searchKindFilters, setSearchKindFilters] = useState<string[]>(SEARCH_KIND_OPTIONS.map(opt => opt.key));
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [unlockedOnly, setUnlockedOnly] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const SELECT_ALL_JOBS = "__all__";
  const [availableJobs, setAvailableJobs] = useState<Array<{ id: string; title: string; is_active: boolean }>>([]);

  const handleOpenCv = (profileId: string) => {
    setSelectedCVUserId(profileId);
    setCvModalOpen(true);
  };

  const updateCandidateStage = async (companyCandidateId: string | undefined, nextStage: ProcessStageValue) => {
    if (!companyCandidateId) return;
    try {
      setStatusUpdatingId(companyCandidateId);
      
      // Build meta object - for INTERVIEW_DURCHGEFÜHRT, we need interview_date
      let meta: Record<string, unknown> = {};
      if (nextStage === 'INTERVIEW_DURCHGEFÜHRT') {
        // Use current date/time as interview_date if not provided
        meta = {
          interview_date: new Date().toISOString()
        };
      }
      
      // Use changeCandidateStatus RPC to update both status and stage
      // This ensures the status field is updated correctly for dashboard metrics
      const { error } = await supabase.rpc('change_candidate_status', {
        p_company_candidate_id: companyCandidateId,
        p_next_status: nextStage,
        p_meta: meta,
        p_silent: false
      });

      if (error) throw error;

      setProfiles(prev =>
        prev.map(profile =>
          profile.company_candidate_id === companyCandidateId
            ? { ...profile, stage: nextStage, status: nextStage }
            : profile
        )
      );

      toast.success('Status aktualisiert');
    } catch (error) {
      console.error('Stage update failed', error);
      toast.error('Status konnte nicht aktualisiert werden');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const buildProcessActions = (profile: Profile) => {
    const currentStage = (profile.stage || 'FREIGESCHALTET').toUpperCase() as ProcessStageValue;
    const currentIndex = PIPELINE_ORDER.indexOf(currentStage);
    const nextStage = currentIndex >= 0 && currentIndex < PIPELINE_ORDER.length - 1
      ? PIPELINE_ORDER[currentIndex + 1]
      : null;

    if (!nextStage) {
      return [];
    }

    const nextStageConfig = PROCESS_STAGE_OPTIONS.find((option) => option.value === nextStage);
    return nextStageConfig
      ? [
          {
            key: `${profile.id}-${nextStageConfig.value}`,
            label: nextStageConfig.label,
            onClick: () => updateCandidateStage(profile.company_candidate_id, nextStageConfig.value),
            variant: 'primary' as const,
            disabled: statusUpdatingId === profile.company_candidate_id,
          },
        ]
      : [];
  };

  // Bulk operations hooks
  const exporter = useExportCandidates(company?.id || '');

  const loadUnlockedCandidates = useCallback(async () => {
    if (!company?.id) return;

    setLoading(true);
    try {
      const { data: ccRows, error: ccErr } = await supabase
        .from('company_candidates')
        .select(`
          id,
          candidate_id,
          stage,
          status,
          unlocked_at,
          match_score,
          source,
          notes,
          linked_job_ids,
          interview_date,
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
            job_search_preferences,
            has_drivers_license,
            cv_url,
            geplanter_abschluss,
            schulbildung,
            available_from,
            visibility_mode
          )
        `)
        .eq('company_id', company.id)
        .not('unlocked_at', 'is', null)
        .order('unlocked_at', { ascending: false });

      if (ccErr) {
        console.error('Error loading unlocked candidates:', ccErr);
        throw ccErr;
      }

      console.log('Loaded company_candidates rows:', ccRows?.length || 0);
      console.log('Sample row:', ccRows?.[0]);

      const allJobIds = new Set<string>();
      (ccRows || []).forEach((cc: any) => {
        if (Array.isArray(cc.linked_job_ids)) {
          cc.linked_job_ids.forEach((id: string) => allJobIds.add(id));
        }
      });

      let jobTitleMap = new Map();
      if (allJobIds.size > 0) {
        const { data: jobTitles } = await supabase
          .from("job_posts")
          .select("id, title")
          .in("id", Array.from(allJobIds));

        jobTitleMap = new Map(jobTitles?.map(j => [j.id, j.title]) || []);
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

      const profilesData = (ccRows || [])
        .filter((cc: any) => {
          const hasProfile = !!cc.profiles;
          if (!hasProfile) {
            console.warn('Company candidate without profile:', {
              company_candidate_id: cc.id,
              candidate_id: cc.candidate_id,
              unlocked_at: cc.unlocked_at
            });
          }
          return hasProfile;
        })
        .map((cc: any) => ({
          ...cc.profiles,
          stage: cc.status || cc.stage,
          company_candidate_id: cc.id,
          unlocked_at: cc.unlocked_at,
          unlock_source: cc.source,
          unlock_notes: cc.notes,
          interview_date: cc.interview_date,
          linkedJobTitles: (cc.linked_job_ids || []).map((id: string) => ({
            id,
            title: jobTitleMap.get(id) || "Unbekannte Stelle"
          })),
          plz: cc.profiles.plz ?? '',
          match_score: cc.match_score,
          schulbildung: parseJsonField(cc.profiles.schulbildung),
        })) as Profile[];

      console.log('Processed profiles:', profilesData.length);
      setProfiles(profilesData);
    } catch (e) {
      console.error('Error loading unlocked profiles', e);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    loadUnlockedCandidates();
  }, [loadUnlockedCandidates]);

  // Load available jobs on mount
  useEffect(() => {
    if (!company?.id) return;

    const loadJobs = async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: allJobs } = await supabase
        .from("job_posts")
        .select("id, title, is_active, created_at, updated_at")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (allJobs) {
        // Filter: active jobs OR inactive jobs updated in last 3 months
        const filteredJobs = allJobs.filter(job => {
          if (job.is_active) return true;
          if (!job.is_active && job.updated_at) {
            const updatedAt = new Date(job.updated_at);
            return updatedAt >= threeMonthsAgo;
          }
          return false;
        });

        setAvailableJobs(filteredJobs.map(job => ({
          id: job.id,
          title: job.title,
          is_active: job.is_active ?? false,
        })));
      }
    };

    loadJobs();
  }, [company?.id]);

  useEffect(() => {
    if (!company?.id) return;

    const channel = supabase
      .channel(`company-candidates-${company.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_candidates',
          filter: `company_id=eq.${company.id}`,
        },
        () => {
          loadUnlockedCandidates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company?.id, loadUnlockedCandidates]);

  useEffect(() => {
    if (!company) return;
    const loadViews = async () => {
      try {
        const { data: views } = await supabase
          .from('company_activity')
          .select('payload')
          .eq('company_id', company.id)
          .eq('type', 'profile_view')
          .order('created_at', { ascending: false })
          .limit(24);
        const ids = Array.from(new Set((views || []).map((v: any) => v.payload?.profile_id).filter(Boolean)));
        if (ids.length) {
          const { data: viewProfiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', ids)
            .limit(12);
          setRecentlyViewed(viewProfiles || []);
        } else {
          setRecentlyViewed([]);
        }
      } catch (e) {
        console.error('Error loading recently viewed profiles', e);
      }
    };
    loadViews();
  }, [company]);
  const handlePreview = async (p: Profile) => {
    if (company && user) {
      try {
        await supabase.from('company_activity').insert({
          company_id: company.id,
          type: 'profile_view',
          actor_user_id: user.id,
          payload: { profile_id: p.id }
        });
      } catch (e) {
        console.error('Failed to log profile view', e);
      }
    }
    // Navigate to LinkedIn-style profile page
    navigate(`/company/profile/${p.id}`);
  };

  const handleStageChange = async (newStage: string) => {
    if (!selectedProfile?.company_candidate_id || !company) return;
    
    const { error } = await supabase
      .from('company_candidates')
      .update({ stage: newStage })
      .eq('id', selectedProfile.company_candidate_id);
    
    if (!error) {
      toast.success('Status aktualisiert');
      setIsProfileModalOpen(false);
      // Reload profiles
      const load = async () => {
        const { data: ccRows } = await supabase
          .from('company_candidates')
          .select(`
            id,
            candidate_id,
            stage,
            unlocked_at,
            match_score,
            profiles:candidate_id (*)
          `)
          .eq('company_id', company.id)
          .not('unlocked_at', 'is', null)
          .order('unlocked_at', { ascending: false });

        const profilesData = (ccRows || [])
          .filter((cc: any) => cc.profiles)
          .map((cc: any) => ({
            ...cc.profiles,
            stage: cc.stage,
            company_candidate_id: cc.id,
            unlocked_at: cc.unlocked_at,
            plz: cc.profiles.plz ?? '',
          })) as Profile[];

        setProfiles(profilesData);
      };
      load();
    } else {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  // Selection handlers
  const toggleSelection = (profileId: string) => {
    setSelected(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const clearSelection = () => setSelected([]);

  const handleExportCsv = async () => {
    if (!selected.length) return;
    try {
      const url = await exporter.export("csv", selected);
      window.open(url, "_blank");
      clearSelection();
    } catch (error) {
      console.error('CSV export failed:', error);
    }
  };

  const handleExportXlsx = async () => {
    if (!selected.length) return;
    try {
      const url = await exporter.export("xlsx", selected);
      window.open(url, "_blank");
      clearSelection();
    } catch (error) {
      console.error('Excel export failed:', error);
    }
  };

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    [...STAGE_FILTERS, ...ARCHIVED_FILTERS].forEach(({ key }) => {
      counts[key] = 0;
    });
    profiles.forEach(profile => {
      const stageKey = (profile.stage || profile.status || "FREIGESCHALTET").toUpperCase();
      if (counts[stageKey] !== undefined) {
        counts[stageKey] += 1;
      }
    });
    return counts;
  }, [profiles]);


  // Filter profiles based on search
  const filteredProfiles = profiles.filter(p => {
    const stageKey = (p.stage || p.status || "FREIGESCHALTET").toUpperCase();
    
    // Filter by stage/status
    if (showArchived) {
      // Wenn Archiv anzeigt wird, zeige nur abgelehnte/abgesagte
      if (!ARCHIVED_FILTERS.some(f => f.key === stageKey)) {
        return false;
      }
    } else {
      // Normale Ansicht: Nur aktive Status
      if (!selectedStageFilters.includes(stageKey)) {
        return false;
      }
      // Archivierte Status ausblenden
      if (ARCHIVED_FILTERS.some(f => f.key === stageKey)) {
        return false;
      }
    }

    if (unlockedOnly && !p.unlocked_at) {
      return false;
    }


    const searchText = search.trim().toLowerCase();
    if (searchText) {
      const matchesSearch = `${p.vorname} ${p.nachname}`.toLowerCase().includes(searchText)
        || p.ort?.toLowerCase().includes(searchText)
        || p.branche?.toLowerCase().includes(searchText)
        || p.headline?.toLowerCase().includes(searchText);
      if (!matchesSearch) return false;
    }

    if (jobTitleFilter && !p.headline?.toLowerCase().includes(jobTitleFilter.toLowerCase())) {
      return false;
    }

    if (industryFilter && !p.branche?.toLowerCase().includes(industryFilter.toLowerCase())) {
      return false;
    }

    if (locationFilter && !p.ort?.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }

    // Stellenanzeige Filter
    if (selectedJobId) {
      const hasLinkedJob = p.linkedJobTitles?.some(job => job.id === selectedJobId);
      if (!hasLinkedJob) {
        return false;
      }
    }

    // Abschluss filter
    if (abschlussFilter.length > 0) {
      // Check geplanter_abschluss
      const hasMatchingAbschluss = 
        (p.geplanter_abschluss && abschlussFilter.includes(p.geplanter_abschluss)) ||
        // Check schulbildung JSONB array
        (Array.isArray(p.schulbildung) && p.schulbildung.some((edu: any) => {
          const abschluss = edu.abschluss || edu.degree || edu.qualifikation;
          return abschluss && abschlussFilter.includes(abschluss);
        }));
      if (!hasMatchingAbschluss) return false;
    }

    if (searchKindFilters.length) {
    const rawPrefs = Array.isArray(p.job_search_preferences)
      ? p.job_search_preferences
      : typeof p.job_search_preferences === "string"
      ? [p.job_search_preferences]
      : [];

    const normalizedPrefs = rawPrefs
      .map(normalizeSearchKind)
      .filter((pref): pref is string => pref !== null);

    const hasMatch = normalizedPrefs.some(pref => searchKindFilters.includes(pref));

    if (normalizedPrefs.length && !hasMatch) return false;
    }

    return true;
  });

  const filteredRecentlyViewed = recentlyViewed.filter(p =>
    `${p.vorname} ${p.nachname}`.toLowerCase().includes(search.toLowerCase()) ||
    p.ort?.toLowerCase().includes(search.toLowerCase()) ||
    p.branche?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination for filtered profiles
  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProfiles = filteredProfiles.slice(startIndex, endIndex);

  // Pagination for recently viewed
  const totalPagesViewed = Math.ceil(filteredRecentlyViewed.length / ITEMS_PER_PAGE);
  const currentRecentlyViewed = filteredRecentlyViewed.slice(startIndex, endIndex);

  return (
    <div className="mx-auto max-w-[1500px] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Freigeschaltete Talente</h1>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen nach Name, Ort, Branche..."
              className="w-[260px] md:w-[320px]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1">
              <Button
                size="icon"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className="h-9 w-9"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="h-9 w-9"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" /> Filter
                  {selectedJobId && (
                    <Badge variant="secondary" className="ml-1">
                      {availableJobs.find(j => j.id === selectedJobId)?.title || "Stelle"}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[400px] space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Stellenanzeige Filter - prominent oben */}
                <div className="space-y-2 pb-3 border-b">
                  <Label className="text-sm font-semibold">Stellenanzeige</Label>
                  <Select 
                    value={selectedJobId || SELECT_ALL_JOBS} 
                    onValueChange={(value) => setSelectedJobId(value === SELECT_ALL_JOBS ? null : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Alle Stellenanzeigen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_ALL_JOBS}>Alle Stellenanzeigen</SelectItem>
                      {availableJobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          <div className="flex items-center gap-2">
                            <span>{job.title}</span>
                            {job.is_active ? (
                              <Badge variant="default" className="ml-auto text-xs">Aktiv</Badge>
                            ) : (
                              <Badge variant="secondary" className="ml-auto text-xs">Inaktiv</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Zeigt nur Kandidaten, die mit der ausgewählten Stelle verknüpft sind
                  </p>
                </div>

                {/* Stellenanzeige Filter - prominent at top */}
                <div className="mb-4 pb-4 border-b">
                  <Label className="text-sm font-semibold mb-2 block">Stellenanzeige</Label>
                  <Select value={selectedJobId || SELECT_ALL_JOBS} onValueChange={(value) => setSelectedJobId(value === SELECT_ALL_JOBS ? null : value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Alle Stellenanzeigen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_ALL_JOBS}>Alle Stellenanzeigen</SelectItem>
                      {availableJobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          <div className="flex items-center gap-2">
                            <span>{job.title}</span>
                            {job.is_active ? (
                              <Badge variant="default" className="ml-auto text-xs">Aktiv</Badge>
                            ) : (
                              <Badge variant="secondary" className="ml-auto text-xs">Inaktiv</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Zeigt nur Kandidaten, die mit der ausgewählten Stelle verknüpft sind
                  </p>
                </div>

                {/* Status Filter */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Status</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStageFilters(STAGE_FILTERS.map(s => s.key))}
                      >
                        Alle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStageFilters([STAGE_FILTERS[0].key])}
                      >
                        Zurücksetzen
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {STAGE_FILTERS.map(stage => {
                      const checked = selectedStageFilters.includes(stage.key);
                      return (
                        <label key={stage.key} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              setSelectedStageFilters(prev => {
                                const set = new Set(prev);
                                if (value) {
                                  set.add(stage.key);
                                } else {
                                  set.delete(stage.key);
                                }
                                return Array.from(set);
                              });
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{stage.label}</span>
                            {stage.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
                            )}
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {stageCounts[stage.key] ?? 0}
                            </Badge>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {ARCHIVED_FILTERS.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold text-muted-foreground">Archiv</Label>
                        <Switch checked={showArchived} onCheckedChange={setShowArchived} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Abgelehnte oder abgesagte Kandidaten
                      </p>
                    </div>
                  )}
                </div>

                {/* Weitere Filter */}
                <div className="space-y-2 pt-3 border-t">
                  <Label className="text-sm font-semibold">Weitere Filter</Label>
                  <Input
                    value={jobTitleFilter}
                    onChange={(e) => setJobTitleFilter(e.target.value)}
                    placeholder="Jobtitel z. B. Azubi im Handwerk"
                    className="text-sm"
                  />
                  <Input
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    placeholder="Branche z. B. Bau, IT"
                    className="text-sm"
                  />
                  <Input
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Standort z. B. Berlin"
                    className="text-sm"
                  />
                </div>
                <div className="border-t pt-3 space-y-2">
                  <span className="text-sm font-semibold">Abschluss</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ABSCHLUSS_OPTIONS.map(option => {
                      const checked = abschlussFilter.includes(option.value);
                      return (
                        <label key={option.value} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              setAbschlussFilter(prev => {
                                const set = new Set(prev);
                                if (value) set.add(option.value); else set.delete(option.value);
                                return Array.from(set);
                              });
                            }}
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t pt-3">
                  <span className="text-sm font-semibold">Art der Suche</span>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {SEARCH_KIND_OPTIONS.map(option => {
                      const checked = searchKindFilters.includes(option.key);
                      return (
                        <label key={option.key} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              setSearchKindFilters(prev => {
                                const set = new Set(prev);
                                if (value) set.add(option.key); else set.delete(option.key);
                                return Array.from(set);
                              });
                            }}
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <Label htmlFor="unlocked-only" className="text-sm">Nur freigeschaltete</Label>
                  <Switch id="unlocked-only" checked={unlockedOnly} onCheckedChange={setUnlockedOnly} />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStageFilters([STAGE_FILTERS[0].key]); // Nur "Freigeschaltet" als Standard
                      setShowArchived(false);
                      setSelectedJobId(null);
                      setJobTitleFilter("");
                      setIndustryFilter("");
                      setLocationFilter("");
                      setAbschlussFilter([]);
                      setSearchKindFilters(SEARCH_KIND_OPTIONS.map(opt => opt.key));
                      setUnlockedOnly(true);
                    }}
                  >
                    Zurücksetzen
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button size="sm" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-2" /> Export (CSV)
            </Button>
          </div>
        </div>

        {/* Stage filter chips - vereinfacht */}
        <div className="-mx-2 overflow-x-auto px-2">
          <div className="flex items-center gap-2 min-w-max">
            {/* Stellenanzeige Filter Chip */}
            {selectedJobId && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-2 whitespace-nowrap bg-blue-100 text-blue-700 hover:bg-blue-200"
                onClick={() => setSelectedJobId(null)}
              >
                {availableJobs.find(j => j.id === selectedJobId)?.title || "Stelle"}
                <span className="ml-1">×</span>
              </Button>
            )}
            <Button
              size="sm"
              variant={selectedStageFilters.length === STAGE_FILTERS.length ? "secondary" : "outline"}
              className="gap-2 whitespace-nowrap"
              onClick={() => {
                setSelectedStageFilters(STAGE_FILTERS.map(s => s.key));
                setShowArchived(false);
              }}
            >
              Alle
            </Button>
            {STAGE_FILTERS.map(stage => {
              const active = selectedStageFilters.includes(stage.key);
              return (
                <Button
                  key={stage.key}
                  size="sm"
                  variant={active ? "secondary" : "outline"}
                  className="gap-2 whitespace-nowrap"
                  title={stage.description}
                  onClick={() => {
                    // Toggle: Wenn aktiv, deaktivieren; wenn nicht aktiv, nur diesen aktivieren
                    if (active) {
                      setSelectedStageFilters(prev => prev.filter(s => s !== stage.key));
                    } else {
                      setSelectedStageFilters([stage.key]);
                    }
                  }}
                >
                  {stage.label}
                  <Badge variant={active ? "default" : "secondary"} className="ml-1">
                    {stageCounts[stage.key] ?? 0}
                  </Badge>
                </Button>
              );
            })}
            {showArchived ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 whitespace-nowrap text-muted-foreground"
                onClick={() => {
                  setShowArchived(false);
                  setSelectedStageFilters([STAGE_FILTERS[0].key]);
                }}
              >
                Archiv ausblenden
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="gap-2 whitespace-nowrap text-muted-foreground"
                onClick={() => {
                  setShowArchived(true);
                  setSelectedStageFilters([]);
                }}
              >
                Archiv anzeigen
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selected.length > 0 && (
        <SelectionBar
          count={selected.length}
          onClear={clearSelection}
          onExportCsv={handleExportCsv}
          onExportXlsx={handleExportXlsx}
          busy={exporter.isPending}
        />
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Kürzlich</CardTitle>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant={activeRecentTab === 'unlocked' ? 'default' : 'outline'} onClick={() => {
              setActiveRecentTab('unlocked');
              setCurrentPage(1);
            }}>
              Freigeschaltet
            </Button>
            <Button size="sm" variant={activeRecentTab === 'viewed' ? 'default' : 'outline'} onClick={() => {
              setActiveRecentTab('viewed');
              setCurrentPage(1);
            }}>
              Angeschaut
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : activeRecentTab === 'unlocked' ? (
            filteredProfiles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                {search ? "Keine Treffer für deine Suche." : "Noch keine Profile freigeschaltet."}
                <div className="mt-4">
                  <Button onClick={() => navigate('/unternehmen/kandidatensuche')}>
                    <Coins className="h-4 w-4 mr-2" /> Kandidaten suchen
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div
                    ref={gridRef}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                  >
                    {currentProfiles.map((p) => (
                      <div key={p.id} className="relative">
                        <Checkbox
                          checked={selected.includes(p.id)}
                          onCheckedChange={() => toggleSelection(p.id)}
                          className="absolute left-3 top-3 z-10 bg-white shadow-sm"
                          aria-label={`${p.vorname} ${p.nachname} auswählen`}
                        />
                         <ProfileCard
                           profile={{
                             id: p.id,
                             name: `${p.vorname} ${p.nachname}`.trim(),
                             avatar_url: p.avatar_url || null,
                             role: p.headline || undefined,
                             industry: p.branche || undefined,
                             occupation: p.headline || undefined,
                             city: p.ort,
                             seeking: p.job_search_preferences ? (Array.isArray(p.job_search_preferences) ? p.job_search_preferences.join(', ') : p.job_search_preferences) : null,
                             status: p.status,
                             email: p.email || null,
                             phone: p.telefon || null,
                             skills: p.faehigkeiten ? (Array.isArray(p.faehigkeiten) ? p.faehigkeiten : []) : [],
                             match: typeof p.match_score === "number" ? Math.round(p.match_score) : null,
                             stage: p.stage,
                             educationForm: (p as any).schulform || undefined,
                             available_from: (p as any).available_from || undefined,
                             visibility_mode: (p as any).visibility_mode || undefined,
                           }}
                           variant="unlocked"
                           unlockReason={
                             p.unlock_source === "bewerbung" 
                               ? `Bewerbung ${p.linkedJobTitles?.[0]?.title ? `auf ${p.linkedJobTitles[0].title}` : ''}`
                               : undefined
                           }
                           unlockNotes={p.unlock_notes}
                           unlockSource={(p.unlock_source as any) ?? null}
                           unlockJobTitle={p.linkedJobTitles?.[0]?.title ?? null}
                           actions={buildProcessActions(p)}
                           onView={() => handlePreview(p)}
                           onDownload={() => handleOpenCv(p.id)}
                           onToggleFavorite={() => {
                             toast.success('Favorit-Funktion wird bald verfügbar sein');
                           }}
                          />
                     </div>
                   ))}
                 </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="min-w-[150px]">Name</TableHead>
                          <TableHead className="min-w-[120px]">Ort</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[120px]">Art der Suche</TableHead>
                          <TableHead className="min-w-[100px]">Verfügbar ab</TableHead>
                          <TableHead className="min-w-[80px]">Führerschein</TableHead>
                          <TableHead className="min-w-[100px]">Kontakt</TableHead>
                          <TableHead className="min-w-[120px]">Interview</TableHead>
                          <TableHead className="min-w-[150px]">Verknüpfte Stelle(n)</TableHead>
                          <TableHead className="min-w-[140px]">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentProfiles.map((p) => {
                          const checked = selected.includes(p.id);
                          const statusLabel = p.stage || p.status || "FREIGESCHALTET";
                          const statusDisplay = STAGE_FILTERS.find(s => s.key === statusLabel.toUpperCase())?.label || statusLabel;
                          
                          // Format available_from
                          const formatAvailableFrom = (dateStr: string | null | undefined) => {
                            if (!dateStr) return "—";
                            try {
                              const [year, month] = dateStr.split('-');
                              const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
                              return `${monthNames[parseInt(month) - 1]} ${year}`;
                            } catch {
                              return dateStr;
                            }
                          };

                          // Format interview date
                          const formatInterviewDate = (dateStr: string | null | undefined) => {
                            if (!dateStr) return "—";
                            try {
                              const date = new Date(dateStr);
                              return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                            } catch {
                              return "—";
                            }
                          };

                          // Job search preferences
                          const jobSearchPrefs = Array.isArray(p.job_search_preferences) 
                            ? p.job_search_preferences.join(', ')
                            : p.job_search_preferences || "—";

                          return (
                            <TableRow key={p.id}>
                              <TableCell>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleSelection(p.id)}
                                  aria-label={`${p.vorname} ${p.nachname} auswählen`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {p.vorname} {p.nachname}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {p.ort || "—"}
                                  {p.plz && <span className="text-muted-foreground"> ({p.plz})</span>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{p.branche || "—"}</div>
                                  <div className="text-xs text-muted-foreground">{p.headline || p.status || ""}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm max-w-[120px] truncate" title={jobSearchPrefs}>
                                  {jobSearchPrefs}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatAvailableFrom(p.available_from)}
                              </TableCell>
                              <TableCell>
                                {p.has_drivers_license ? (
                                  <Badge variant="default" className="bg-green-600">Ja</Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-0.5">
                                  {p.email && <div className="truncate max-w-[100px]" title={p.email}>{p.email}</div>}
                                  {p.telefon && <div>{p.telefon}</div>}
                                  {!p.email && !p.telefon && <span className="text-muted-foreground">—</span>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{statusDisplay}</div>
                                  {p.interview_date && (
                                    <div className="text-xs text-muted-foreground">
                                      {formatInterviewDate(p.interview_date)}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {p.linkedJobTitles && p.linkedJobTitles.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {p.linkedJobTitles.map((job, idx) => {
                                      const isSelected = selectedJobId === job.id;
                                      const jobData = availableJobs.find(j => j.id === job.id);
                                      return (
                                        <div key={job.id} className="flex items-center gap-1.5 flex-wrap">
                                          <Badge 
                                            variant={isSelected ? "default" : "outline"}
                                            className={cn(
                                              "text-xs cursor-pointer hover:bg-primary/10",
                                              isSelected 
                                                ? "bg-blue-600 text-white border-blue-600" 
                                                : "bg-blue-50 text-blue-700 border-blue-200"
                                            )}
                                            onClick={() => setSelectedJobId(job.id)}
                                            title="Klicken zum Filtern nach dieser Stelle"
                                          >
                                            {job.title}
                                          </Badge>
                                          {jobData && (
                                            <Badge 
                                              variant={jobData.is_active ? "default" : "secondary"} 
                                              className="text-[10px]"
                                            >
                                              {jobData.is_active ? "Aktiv" : "Inaktiv"}
                                            </Badge>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Keine Stelle verknüpft</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button size="sm" variant="outline" onClick={() => handlePreview(p)} className="text-xs px-2">
                                    Profil
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleOpenCv(p.id)} className="text-xs px-2">
                                    CV
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
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
            )
          ) : (
            filteredRecentlyViewed.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                {search ? "Keine Treffer für deine Suche." : "Noch keine Profile angesehen."}
              </div>
            ) : (
              <>
                <div
                  ref={gridRef}
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                >
                  {currentRecentlyViewed.map((p) => (
                    <div key={p.id} className="relative">
                      <Checkbox
                        checked={selected.includes(p.id)}
                        onCheckedChange={() => toggleSelection(p.id)}
                        className="absolute left-3 top-3 z-10 bg-white shadow-sm"
                        aria-label={`${p.vorname} ${p.nachname} auswählen`}
                      />
                       <ProfileCard
                          profile={{
                            id: p.id,
                            name: `${p.vorname} ${p.nachname}`.trim(),
                            avatar_url: p.avatar_url || null,
                            role: p.headline || p.branche,
                            industry: p.branche || undefined,
                            occupation: p.headline || undefined,
                            city: p.ort,
                            fs: (p as any).has_drivers_license || false,
                            seeking: (p as any).job_search_preferences ? (Array.isArray((p as any).job_search_preferences) ? (p as any).job_search_preferences.join(', ') : (p as any).job_search_preferences) : null,
                            status: p.status,
                            email: p.email || null,
                            phone: p.telefon || null,
                            skills: p.faehigkeiten ? (Array.isArray(p.faehigkeiten) ? p.faehigkeiten : []) : [],
                            match: 75,
                          }}
                          variant="unlocked"
                          onView={() => handlePreview(p)}
                          onDownload={() => {
                            // Open CV modal instead of generating PDF
                            handleOpenCv(p.id);
                          }}
                          onToggleFavorite={() => {
                            toast.success('Favorit-Funktion wird bald verfügbar sein');
                          }}
                         />
                    </div>
                  ))}
                </div>
                
                {/* Pagination for recently viewed */}
                {totalPagesViewed > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPagesViewed }, (_, i) => i + 1).map((page) => (
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
                            onClick={() => setCurrentPage(Math.min(totalPagesViewed, currentPage + 1))}
                            className={currentPage === totalPagesViewed ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )
          )}
        </CardContent>
      </Card>

      {/* Full Profile Modal */}
      <FullProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfile(null);
        }}
        profile={selectedProfile}
        isUnlocked={true}
        companyCandidate={selectedProfile ? {
          id: selectedProfile.company_candidate_id || '',
          stage: selectedProfile.stage || 'new',
          unlocked_at: selectedProfile.unlocked_at || ''
        } : undefined}
        onStageChange={handleStageChange}
        onArchive={async (reason) => {
          if (!selectedProfile?.company_candidate_id) return;
          
          const { error } = await supabase
            .from('company_candidates')
            .update({ 
              stage: 'rejected',
              notes: reason ? `Absage: ${reason}` : undefined
            })
            .eq('id', selectedProfile.company_candidate_id);
          
          if (!error) {
            toast.success('Kandidat abgelehnt');
            setIsProfileModalOpen(false);
            // Reload
            const load = async () => {
              if (!company) return;
              const { data: ccRows } = await supabase
                .from('company_candidates')
                .select(`
                  id,
                  candidate_id,
                  stage,
                  unlocked_at,
                  match_score,
                  profiles:candidate_id (*)
                `)
                .eq('company_id', company.id)
                .not('unlocked_at', 'is', null)
                .order('unlocked_at', { ascending: false });

              const profilesData = (ccRows || [])
                .filter((cc: any) => cc.profiles)
                .map((cc: any) => ({
                  ...cc.profiles,
                  stage: cc.stage,
                  company_candidate_id: cc.id,
                  unlocked_at: cc.unlocked_at,
                  plz: cc.profiles.plz ?? '',
                })) as Profile[];

              setProfiles(profilesData);
            };
            load();
          } else {
            toast.error('Fehler beim Ablehnen');
          }
        }}
      />

      {/* CV Modal */}
      <UserCVModal
        open={cvModalOpen}
        onOpenChange={setCvModalOpen}
        userId={selectedCVUserId || ''}
      />
    </div>
  );
}
