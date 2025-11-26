import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePublicJobs } from "@/hooks/useJobs";
import { useMyApplications } from "@/hooks/useMyApplications";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useCompanyInterests } from "@/hooks/useCompanyInterests";
import { JobSearchHero } from "@/components/community/jobs/JobSearchHero";
import { JobFilters } from "@/components/community/jobs/JobFilters";
import { JobSearchModal } from "@/components/community/jobs/JobSearchModal";
import { PublicJobCard } from "@/components/community/jobs/PublicJobCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Building2, ChevronRight, LayoutGrid, ChevronDown, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type TabType = "foryou" | "career" | "interested";

export default function CommunityJobs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("foryou");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState("");
  const [viewMode, setViewMode] = useState<"large" | "compact">("large");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>("");
  const [isTabsVisible, setIsTabsVisible] = useState(true);

  // Listen for search modal open event from TopNavBar
  useEffect(() => {
    const handleOpenSearchModal = () => {
      setIsSearchModalOpen(true);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('open-job-search-modal', handleOpenSearchModal as EventListener);
      return () => {
        window.removeEventListener('open-job-search-modal', handleOpenSearchModal as EventListener);
      };
    }
  }, []);

  // Scroll behavior for tabs: hide on scroll down, show on scroll up (Mobile only)
  useEffect(() => {
    if (!isMobile) return;
    
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // At top: always show tabs
          if (currentScrollY <= 0) {
            setIsTabsVisible(true);
            lastScrollY = currentScrollY;
            ticking = false;
            return;
          }

          // Determine scroll direction
          if (currentScrollY > lastScrollY) {
            // Scrolling down → hide tabs
            setIsTabsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            // Scrolling up → show tabs
            setIsTabsVisible(true);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  
  // Desktop filters
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [requiresLicense, setRequiresLicense] = useState(false);
  const [datePosted, setDatePosted] = useState("all");
  const [experience, setExperience] = useState("all");
  const [salaryRange, setSalaryRange] = useState<[number, number]>([15000, 100000]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("recent");

  // Mobile "Mehr anzeigen" states
  const [showMoreApplications, setShowMoreApplications] = useState(false);
  const [showMoreUnlocked, setShowMoreUnlocked] = useState(false);
  const [showMoreSaved, setShowMoreSaved] = useState(false);
  const [showMoreInterested, setShowMoreInterested] = useState(false);

  // Sync search with URL params
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== search) {
      setSearch(urlQ);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        setSearchParams({ q: search }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, setSearchParams]);

  // Fetch jobs
  const {
    data: jobs,
    isLoading: jobsLoading
  } = usePublicJobs({
    employment_type: selectedJobTypes[0],
    location: location || selectedCity,
    work_mode: selectedWorkMode || undefined
  });

  // Fetch applications
  const { data: myApplications } = useMyApplications();

  // Fetch saved jobs
  const { data: savedJobs } = useSavedJobs();

  // Fetch companies that unlocked user
  const { data: unlockedCompanies } = useCompanyInterests();

  // Fetch companies that showed interest
  const { data: interestedCompanies } = useQuery({
    queryKey: ["interested-companies", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_user_interests")
        .select(`
          id,
          company_id,
          created_at,
          company:companies!company_id (
            id,
            name,
            logo_url,
            industry,
            main_location
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Create a map of job_id to application for quick lookup
  const applicationsByJobId = myApplications?.reduce((acc, app) => {
    acc[app.job_id] = app;
    return acc;
  }, {} as Record<string, typeof myApplications[0]>) || {};

  // Filter jobs based on all criteria (Desktop)
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    return jobs.filter(job => {
    // Hide rejected applications
    const application = applicationsByJobId[job.id];
    if (application?.status === 'rejected') {
      return false;
    }

      // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesTitle = job.title?.toLowerCase().includes(searchLower);
      const matchesCompany = job.company?.name?.toLowerCase().includes(searchLower);
      const matchesDescription = job.description?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesCompany && !matchesDescription) {
        return false;
      }
    }

    // Company filter
    if (selectedCompany && job.company?.name) {
      if (!job.company.name.toLowerCase().includes(selectedCompany.toLowerCase())) {
        return false;
      }
    }

      // Job type filter
    if (selectedJobTypes.length > 0 && !selectedJobTypes.includes(job.employment_type)) {
      return false;
    }

      // Industry filter
    if (selectedIndustry && job.industry) {
      if (job.industry !== selectedIndustry) {
        return false;
      }
    }

      // Work mode filter (mobile)
      if (selectedWorkMode && job.work_mode !== selectedWorkMode) {
        return false;
      }

      // Work mode filter (desktop)
    if (selectedWorkModes.length > 0 && !selectedWorkModes.includes(job.work_mode)) {
      return false;
    }

    // City filter
    if (selectedCity && job.city && !job.city.toLowerCase().includes(selectedCity.toLowerCase())) {
      return false;
    }

      // Location filter
    if (location && job.city && !job.city.toLowerCase().includes(location.toLowerCase())) {
        return false;
      }
    
    return true;
    });
  }, [jobs, search, selectedJobTypes, selectedWorkModes, selectedCity, selectedCompany, selectedIndustry, location, selectedWorkMode, applicationsByJobId]);

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  // Pagination
  const jobsPerPage = 10;
  const totalPages = Math.ceil(sortedJobs.length / jobsPerPage);
  const paginatedJobs = sortedJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);

  const resetFilters = () => {
    setSelectedJobTypes([]);
    setSelectedWorkModes([]);
    setSelectedCity("");
    setSelectedCompany("");
    setSelectedIndustry("");
    setStartDate("");
    setRequiresLicense(false);
    setDatePosted("all");
    setExperience("all");
    setSalaryRange([15000, 100000]);
    setSelectedSkills([]);
    setSearch("");
    setLocation("");
  };
  
  const hasActiveFilters = 
    selectedJobTypes.length > 0 || 
    selectedWorkModes.length > 0 || 
    selectedCity !== "" || 
    selectedCompany !== "" ||
    selectedIndustry !== "" ||
    startDate !== "" ||
    requiresLicense ||
    datePosted !== 'all' || 
    experience !== 'all' || 
    selectedSkills.length > 0 || 
    search || 
    location;

  const handleJobClick = (job: any) => {
    navigate(`/jobs/${job.id}`);
  };

  // Filter data for mobile tabs
  const filteredApplications = useMemo(() => {
    if (!myApplications) return [];
    return myApplications.filter(app => app.status !== 'rejected' && app.status !== 'archived');
  }, [myApplications]);

  const filteredUnlocked = useMemo(() => {
    if (!unlockedCompanies) return [];
    return unlockedCompanies;
  }, [unlockedCompanies]);

  const filteredSaved = useMemo(() => {
    if (!savedJobs) return [];
    return savedJobs.filter(item => item.job?.is_active);
  }, [savedJobs]);

  const filteredInterested = useMemo(() => {
    if (!interestedCompanies) return [];
    return interestedCompanies;
  }, [interestedCompanies]);

  const INITIAL_LIMIT = 5;

  const handleCompanyClick = (companyId: string) => {
    navigate(`/companies/${companyId}`);
  };

  // Section Component for "Mehr anzeigen" pattern
  const SectionWithMore = ({ 
    title, 
    items, 
    renderItem, 
    showMore, 
    onShowMore,
    emptyMessage 
  }: {
    title: string;
    items: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
    showMore: boolean;
    onShowMore: () => void;
    emptyMessage: string;
  }) => {
    const displayedItems = showMore ? items : items.slice(0, INITIAL_LIMIT);
    const hasMore = items.length > INITIAL_LIMIT;

    if (items.length === 0) {
      return (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowMore}
              className="text-sm"
            >
              {showMore ? "Weniger anzeigen" : "Mehr anzeigen"}
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {displayedItems.map((item, index) => renderItem(item, index))}
        </div>
      </div>
    );
  };

  const handleSearchSubmit = (position: string, loc: string) => {
    setSearch(position);
    setLocation(loc);
    setActiveTab("foryou");
  };

  // Mobile View
  if (isMobile) {
    const displayLocation = location || searchParams.get("location") || "Deutschland";
    const totalResults = filteredJobs.length;
    const hasActiveSearch = search || location;

    return (
      <div className="w-full min-h-screen bg-background pb-20">
        {/* Search Modal */}
        <JobSearchModal
          open={isSearchModalOpen}
          onOpenChange={setIsSearchModalOpen}
          onSearch={handleSearchSubmit}
          initialPosition={search}
          initialLocation={location}
        />

        {/* Filters Modal */}
        <Sheet open={isFiltersModalOpen} onOpenChange={setIsFiltersModalOpen}>
          <SheetContent side="bottom" className="max-h-[75vh] overflow-hidden">
            <SheetHeader>
              <SheetTitle>Alle Filter</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <div className="space-y-4">
                <JobFilters
                  selectedJobTypes={selectedJobTypes}
                  selectedWorkModes={selectedWorkModes}
                  selectedCity={selectedCity}
                  selectedCompany={selectedCompany}
                  selectedIndustry={selectedIndustry}
                  startDate={startDate}
                  requiresLicense={requiresLicense}
                  datePosted={datePosted}
                  experience={experience}
                  salaryRange={salaryRange}
                  selectedSkills={selectedSkills}
                  onJobTypeChange={setSelectedJobTypes}
                  onWorkModeChange={setSelectedWorkModes}
                  onCityChange={setSelectedCity}
                  onCompanyChange={setSelectedCompany}
                  onIndustryChange={setSelectedIndustry}
                  onStartDateChange={setStartDate}
                  onRequiresLicenseChange={setRequiresLicense}
                  onDatePostedChange={setDatePosted}
                  onExperienceChange={setExperience}
                  onSalaryRangeChange={setSalaryRange}
                  onSkillsChange={setSelectedSkills}
                  onReset={resetFilters}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Filter Tabs and Pills - Sticky directly below TopNavBar with scroll behavior */}
        <div 
          className={cn(
            "sticky top-12 z-40 bg-background border-b border-border transition-transform duration-300",
            isTabsVisible ? "translate-y-0" : "-translate-y-full"
          )}
        >
          {/* Tabs */}
          <div className="flex items-center border-b border-border px-3 sm:px-4">
            <button
              onClick={() => setActiveTab("foryou")}
              className={cn(
                "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === "foryou"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Für Dich
            </button>
            <button
              onClick={() => setActiveTab("career")}
              className={cn(
                "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === "career"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Meine Karriere
            </button>
            <button
              onClick={() => setActiveTab("interested")}
              className={cn(
                "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === "interested"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Unternehmen
            </button>
          </div>
          
          {/* Filter Pills - Only show for "Für Dich" tab */}
          {activeTab === "foryou" && (
            <div className="px-3 sm:px-4 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1",
                  !selectedWorkMode
                    ? "bg-green-500 text-white"
                    : "bg-white border border-border text-foreground"
                )}
              >
                Jobs
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => setSelectedWorkMode(selectedWorkMode === "remote" ? "" : "remote")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1",
                  selectedWorkMode === "remote"
                    ? "bg-green-500 text-white"
                    : "bg-white border border-border text-foreground"
                )}
              >
                Remote
                <ChevronDown className="h-3 w-3" />
              </button>
              <button 
                onClick={() => setIsFiltersModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-white border border-border text-foreground"
              >
                Alle Filter
              </button>
            </div>
          )}
        </div>

        {/* Tab Content - padding-top accounts for tabs height (py-2 = 16px + text ~20px = ~36px) + filter pills if active (py-1.5 = 12px + text ~16px = ~28px) = ~64px total */}
        <div className="px-3 sm:px-4" style={{ paddingTop: activeTab === "foryou" ? "64px" : "36px" }}>
          {activeTab === "foryou" && (
            <>
              {/* Blue Banner with Location and Results Count */}
              {hasActiveSearch && (
                <div className="bg-blue-600 text-white px-3 sm:px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold">
                        Jobs {search && `für "${search}"`} {location && `in ${location}`}
                      </h2>
                      <p className="text-sm text-blue-100 mt-0.5">
                        {totalResults.toLocaleString()}+ Treffer
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-100">Benachrichtigung einstellen</span>
                      <Switch
                        checked={notificationEnabled}
                        onCheckedChange={setNotificationEnabled}
                        className="data-[state=checked]:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Active Filters Pills */}
              {hasActiveFilters && (
                <div className="px-3 sm:px-4 py-1 flex flex-wrap gap-2 border-b border-border bg-background">
                  {selectedJobTypes.map((type) => {
                    const typeLabel = type === 'full_time' ? 'Vollzeit' : 
                                     type === 'part_time' ? 'Teilzeit' : 
                                     type === 'internship' ? 'Praktikum' : 
                                     type === 'apprenticeship' ? 'Ausbildung' : 
                                     type === 'temporary' ? 'Befristet' : type;
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                      >
                        <span>{typeLabel}</span>
                        <button
                          onClick={() => setSelectedJobTypes(selectedJobTypes.filter(t => t !== type))}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  {selectedWorkModes.map((mode) => {
                    const modeLabel = mode === 'remote' ? 'Remote' : 
                                     mode === 'hybrid' ? 'Hybrid' : 
                                     mode === 'onsite' ? 'Vor Ort' : mode;
                    return (
                      <div
                        key={mode}
                        className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                      >
                        <span>{modeLabel}</span>
                        <button
                          onClick={() => setSelectedWorkModes(selectedWorkModes.filter(m => m !== mode))}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  {selectedCity && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      <span>Ort: {selectedCity}</span>
                      <button
                        onClick={() => setSelectedCity("")}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {selectedCompany && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      <span>Unternehmen: {selectedCompany}</span>
                      <button
                        onClick={() => setSelectedCompany("")}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {selectedIndustry && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      <span>Branche: {selectedIndustry}</span>
                      <button
                        onClick={() => setSelectedIndustry("")}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {startDate && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      <span>Start: {new Date(startDate).toLocaleDateString('de-DE')}</span>
                      <button
                        onClick={() => setStartDate("")}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {requiresLicense && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      <span>Führerschein</span>
                      <button
                        onClick={() => setRequiresLicense(false)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {datePosted !== 'all' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      <span>
                        {datePosted === '24h' ? 'Letzte 24h' : 
                         datePosted === '7d' ? 'Letzte 7 Tage' : 
                         datePosted === '30d' ? 'Letzte 30 Tage' : datePosted}
                      </span>
                      <button
                        onClick={() => setDatePosted("all")}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {experience !== 'all' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      <span>
                        {experience === 'entry' ? 'Berufseinsteiger' : 
                         experience === 'mid' ? 'Mit Berufserfahrung' : 
                         experience === 'senior' ? 'Berufserfahren' : 
                         experience === 'lead' ? 'Führungsposition' : experience}
                      </span>
                      <button
                        onClick={() => setExperience("all")}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {(salaryRange[0] !== 15000 || salaryRange[1] !== 100000) && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      <span>
                        €{salaryRange[0].toLocaleString()} - €{salaryRange[1].toLocaleString()}
                      </span>
                      <button
                        onClick={() => setSalaryRange([15000, 100000])}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {selectedSkills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Jobs List */}
              <div className="px-0 -mx-3 sm:-mx-4">
                {jobsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filteredJobs.length > 0 ? (
                  <div className="space-y-0">
                    {filteredJobs.map(job => (
                      <PublicJobCard
                        key={job.id}
                        job={job}
                        onClick={() => handleJobClick(job)}
                        compact={true}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center m-4">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Keine Jobs gefunden</p>
                  </Card>
                )}
              </div>
          </>
        )}

        {activeTab === "career" && (
          <div className="px-3 sm:px-4 py-0 space-y-8">
              <SectionWithMore
                title="Bewerbungen"
                items={filteredApplications}
                showMore={showMoreApplications}
                onShowMore={() => setShowMoreApplications(!showMoreApplications)}
                emptyMessage="Keine Bewerbungen"
                renderItem={(app, index) => (
                  <Card
                    key={app.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/jobs/${app.job_id}`)}
                  >
                    <div className="flex items-start gap-3">
                      {app.job?.company?.logo_url ? (
                        <img
                          src={app.job.company.logo_url}
                          alt={app.job.company.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{app.job?.title}</h4>
                        <p className="text-sm text-muted-foreground">{app.job?.company?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                )}
              />

              <SectionWithMore
                title="Unternehmen die dich freigeschaltet haben"
                items={filteredUnlocked}
                showMore={showMoreUnlocked}
                onShowMore={() => setShowMoreUnlocked(!showMoreUnlocked)}
                emptyMessage="Keine Unternehmen haben dich bisher freigeschaltet"
                renderItem={(item, index) => (
                  <Card
                    key={item.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCompanyClick(item.company_id)}
                  >
                    <div className="flex items-start gap-3">
                      {item.company?.logo_url ? (
                        <img
                          src={item.company.logo_url}
                          alt={item.company.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{item.company?.name}</h4>
                        {item.job && (
                          <p className="text-sm text-muted-foreground truncate">{item.job.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(item.unlocked_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                )}
              />

              <SectionWithMore
                title="Gespeicherte Jobs"
                items={filteredSaved}
                showMore={showMoreSaved}
                onShowMore={() => setShowMoreSaved(!showMoreSaved)}
                emptyMessage="Keine gespeicherten Jobs"
                renderItem={(savedJob, index) => (
                  <Card
                    key={savedJob.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/jobs/${savedJob.job_id}`)}
                  >
                    <div className="flex items-start gap-3">
                      {savedJob.job?.company?.logo_url ? (
                        <img
                          src={savedJob.job.company.logo_url}
                          alt={savedJob.job.company.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{savedJob.job?.title}</h4>
                        <p className="text-sm text-muted-foreground">{savedJob.job?.company?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(savedJob.created_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                )}
              />
          </div>
        )}

        {activeTab === "interested" && (
          <div className="px-3 sm:px-4 py-0 space-y-6">
              <SectionWithMore
                title="Unternehmen"
                items={filteredInterested}
                showMore={showMoreInterested}
                onShowMore={() => setShowMoreInterested(!showMoreInterested)}
                emptyMessage="Keine Unternehmen haben Interesse gezeigt"
                renderItem={(item, index) => (
                  <Card
                    key={item.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCompanyClick(item.company_id)}
                  >
                    <div className="flex items-start gap-3">
                      {item.company?.logo_url ? (
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={item.company.logo_url} alt={item.company.name} />
                          <AvatarFallback>
                            <Building2 className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{item.company?.name}</h4>
                        {item.company?.industry && (
                          <p className="text-sm text-muted-foreground truncate">{item.company.industry}</p>
                        )}
                        {item.company?.main_location && (
                          <p className="text-xs text-muted-foreground truncate">{item.company.main_location}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                )}
              />
          </div>
        )}
        </div>

      </div>
    );
  }

  // Desktop View - Original Layout
  return (
    <div className="w-full py-6 px-3 sm:px-6 bg-background">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Hero Section */}
        <JobSearchHero 
          search={search} 
          location={location} 
          onSearchChange={setSearch} 
          onLocationChange={setLocation} 
          totalJobs={filteredJobs.length}
          datePosted={datePosted}
          experience={experience}
          onDatePostedChange={setDatePosted}
          onExperienceChange={setExperience}
        />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <JobFilters 
                selectedJobTypes={selectedJobTypes} 
                selectedWorkModes={selectedWorkModes}
                selectedCity={selectedCity}
                selectedCompany={selectedCompany}
                selectedIndustry={selectedIndustry}
                startDate={startDate}
                requiresLicense={requiresLicense}
                datePosted={datePosted} 
                experience={experience} 
                salaryRange={salaryRange} 
                selectedSkills={selectedSkills}
                onJobTypeChange={setSelectedJobTypes} 
                onWorkModeChange={setSelectedWorkModes}
                onCityChange={setSelectedCity}
                onCompanyChange={setSelectedCompany}
                onIndustryChange={setSelectedIndustry}
                onStartDateChange={setStartDate}
                onRequiresLicenseChange={setRequiresLicense}
                onDatePostedChange={setDatePosted} 
                onExperienceChange={setExperience} 
                onSalaryRangeChange={setSalaryRange} 
                onSkillsChange={setSelectedSkills}
                onReset={resetFilters} 
              />
            </div>
          </aside>

          {/* Jobs List */}
          <div className="space-y-6">
            {/* View Toggle and Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'Stelle gefunden' : 'Stellen gefunden'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "large" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("large")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Groß
                </Button>
                <Button
                  variant={viewMode === "compact" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("compact")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kompakt
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {jobsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : paginatedJobs.length > 0 ? (
              <>
                {/* Jobs Grid */}
                <div className={viewMode === "large" ? "grid gap-4" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
                  {paginatedJobs.map(job => {
                    const application = applicationsByJobId[job.id];
                    return (
                      <PublicJobCard 
                        key={job.id} 
                        job={job} 
                        onClick={() => handleJobClick(job)}
                        compact={viewMode === "compact"}
                        application={application}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                    >
                      ←
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                    >
                      →
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <Briefcase className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Keine Jobs gefunden</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                  Versuche, deine Suchkriterien anzupassen
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={resetFilters}>
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
