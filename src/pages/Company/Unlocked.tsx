import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Coins, LayoutGrid, List, Filter, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SelectionBar } from "@/components/Company/SelectionBar";
import { useExportCandidates } from "@/hooks/useUnlockedBulk";
import { toast } from "sonner";
import { ProfileCard } from "@/components/profile/ProfileCard";
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
}

const ITEMS_PER_PAGE = 20;

const STAGE_FILTERS = [
  { key: "FREIGESCHALTET", label: "Freigeschaltet" },
  { key: "KONTAKTIERT", label: "Kontaktiert" },
  { key: "INTERVIEW_GEPLANT", label: "Gespräch geplant" },
  { key: "INTERVIEW_DURCHGEFÜHRT", label: "Gespräch geführt" },
  { key: "ANGEBOT_GESENDET", label: "Angebot" },
  { key: "EINGESTELLT", label: "Eingestellt" },
  { key: "ABGESAGT", label: "Abgesagt" },
  { key: "ABGELEHNT", label: "Abgelehnt" },
] as const;

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
  const [selectedStageFilters, setSelectedStageFilters] = useState<string[]>(STAGE_FILTERS.map(s => s.key));
  const [jobTitleFilter, setJobTitleFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [searchKindFilters, setSearchKindFilters] = useState<string[]>(SEARCH_KIND_OPTIONS.map(opt => opt.key));
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [unlockedOnly, setUnlockedOnly] = useState(true);
  const [applicationsOnly, setApplicationsOnly] = useState(false);

  const handleOpenCv = (profileId: string) => {
    setSelectedCVUserId(profileId);
    setCvModalOpen(true);
  };

  const updateCandidateStage = async (companyCandidateId: string | undefined, nextStage: ProcessStageValue) => {
    if (!companyCandidateId) return;
    try {
      setStatusUpdatingId(companyCandidateId);
      const { error } = await supabase
        .from('company_candidates')
        .update({ stage: nextStage })
        .eq('id', companyCandidateId);

      if (error) throw error;

      setProfiles(prev =>
        prev.map(profile =>
          profile.company_candidate_id === companyCandidateId
            ? { ...profile, stage: nextStage }
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

  useEffect(() => {
    if (!company) return;
    const load = async () => {
      setLoading(true);
      try {
        // Query company_candidates with profiles JOIN to get all unlocked candidates
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
              cv_url
            )
          `)
          .eq('company_id', company.id)
          .not('unlocked_at', 'is', null)
          .order('unlocked_at', { ascending: false });

        if (ccErr) throw ccErr;

        // Fetch job titles for linked_job_ids
        const allJobIds = new Set<string>();
        (ccRows || []).forEach((cc: any) => {
          if (cc.linked_job_ids && Array.isArray(cc.linked_job_ids)) {
            cc.linked_job_ids.forEach((id: string) => allJobIds.add(id));
          }
        });

        let jobTitleMap = new Map();
        if (allJobIds.size > 0) {
          const { data: jobTitles } = await supabase
            .from("job_posts")
            .select("id, title")
            .in("id", Array.from(allJobIds));
          
          jobTitleMap = new Map(
            jobTitles?.map(j => [j.id, j.title]) || []
          );
        }

        // Map to UI Profile type with unlock metadata
        const profilesData = (ccRows || [])
          .filter((cc: any) => cc.profiles)
          .map((cc: any) => ({
            ...cc.profiles,
            stage: cc.status || cc.stage,
            company_candidate_id: cc.id,
            unlocked_at: cc.unlocked_at,
            unlock_source: cc.source,
            unlock_notes: cc.notes,
            linkedJobTitles: (cc.linked_job_ids || []).map((id: string) => ({
              id,
              title: jobTitleMap.get(id) || "Unbekannte Stelle"
            })),
            plz: cc.profiles.plz ?? '',
            match_score: cc.match_score,
          })) as Profile[];

        setProfiles(profilesData);
      } catch (e) {
        console.error('Error loading unlocked profiles', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [company]);

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
    STAGE_FILTERS.forEach(({ key }) => {
      counts[key] = 0;
    });
    profiles.forEach(profile => {
      const stageKey = (profile.stage || "FREIGESCHALTET").toUpperCase();
      if (counts[stageKey] !== undefined) {
        counts[stageKey] += 1;
      }
    });
    return counts;
  }, [profiles]);

  const applicationCount = useMemo(
    () => profiles.filter(profile => profile.unlock_source === "bewerbung").length,
    [profiles]
  );

  // Filter profiles based on search
  const filteredProfiles = profiles.filter(p => {
    const stageKey = (p.stage || "FREIGESCHALTET").toUpperCase();
    if (!selectedStageFilters.includes(stageKey)) {
      return false;
    }

    if (unlockedOnly && !p.unlocked_at) {
      return false;
    }

    if (applicationsOnly && p.unlock_source !== "bewerbung") {
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

    if (searchKindFilters.length) {
      const prefs = Array.isArray(p.job_search_preferences) ? p.job_search_preferences : [];
      const hasMatch = prefs.some(pref => searchKindFilters.includes(pref));
      if (prefs.length && !hasMatch) return false;
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
    <div className="mx-auto max-w-[1200px] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Freigeschaltete Azubis</h1>
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
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[360px] space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Stages</span>
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
                        onClick={() => setSelectedStageFilters([])}
                      >
                        Keine
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {STAGE_FILTERS.map(stage => {
                      const checked = selectedStageFilters.includes(stage.key);
                      return (
                        <label key={stage.key} className="flex items-center gap-2">
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
                          />
                          <span className="text-sm">{stage.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-semibold">Weitere Filter</span>
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
                      setSelectedStageFilters(STAGE_FILTERS.map(s => s.key));
                      setJobTitleFilter("");
                      setIndustryFilter("");
                      setLocationFilter("");
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

        {/* Stage filter chips */}
        <div className="-mx-2 overflow-x-auto px-2">
          <div className="flex items-center gap-2 min-w-max">
            <Button
              size="sm"
              variant={applicationsOnly ? "secondary" : "outline"}
              className="gap-2 whitespace-nowrap"
              onClick={() => setApplicationsOnly(prev => !prev)}
            >
              Bewerbungen
              <Badge variant={applicationsOnly ? "default" : "secondary"} className="ml-1">
                {applicationCount}
              </Badge>
            </Button>
            {STAGE_FILTERS.map(stage => {
              const active = selectedStageFilters.includes(stage.key);
              return (
                <Button
                  key={stage.key}
                  size="sm"
                  variant={active ? "secondary" : "outline"}
                  className="gap-2 whitespace-nowrap"
                  onClick={() => {
                    setSelectedStageFilters(prev => {
                      const set = new Set(prev);
                      if (active) {
                        set.delete(stage.key);
                      } else {
                        set.add(stage.key);
                      }
                      return Array.from(set);
                    });
                  }}
                >
                  {stage.label}
                  <Badge variant={active ? "default" : "secondary"} className="ml-1">
                    {stageCounts[stage.key] ?? 0}
                  </Badge>
                </Button>
              );
            })}
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
                  <Button onClick={() => navigate('/company/search')}>
                    <Coins className="h-4 w-4 mr-2" /> Kandidaten suchen
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Ort</TableHead>
                          <TableHead>Branche</TableHead>
                          <TableHead>Profil</TableHead>
                          <TableHead>Matching</TableHead>
                          <TableHead>Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentProfiles.map((p) => {
                          const checked = selected.includes(p.id);
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
                              <TableCell>{p.ort || "—"}</TableCell>
                              <TableCell>{p.branche || "—"}</TableCell>
                              <TableCell>{p.headline || p.status || "—"}</TableCell>
                              <TableCell>{typeof p.match_score === "number" ? `${Math.round(p.match_score)}%` : "—"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handlePreview(p)}>Profil</Button>
                                  <Button size="sm" variant="outline" onClick={() => handleOpenCv(p.id)}>CV</Button>
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
                <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
