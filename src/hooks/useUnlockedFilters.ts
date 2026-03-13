import { useState, useCallback } from "react";
import type { UnlockedFilters } from "@/types/unlocked";

export const STAGE_FILTERS = [
  { key: "FREIGESCHALTET", label: "Freigeschaltet", description: "Noch nicht kontaktiert" },
  { key: "INTERVIEW_GEPLANT", label: "Interview geplant", description: "Termin steht fest" },
  { key: "INTERVIEW_DURCHGEFÜHRT", label: "Interview durchgeführt", description: "Gespräch abgeschlossen" },
  { key: "ANGEBOT_GESENDET", label: "Angebot gesendet", description: "Warten auf Antwort" },
  { key: "EINGESTELLT", label: "Eingestellt", description: "Erfolgreich abgeschlossen" },
] as const;

export const ARCHIVED_FILTERS = [
  { key: "ABGESAGT", label: "Abgesagt" },
  { key: "ABGELEHNT", label: "Abgelehnt" },
] as const;

export const ABSCHLUSS_OPTIONS = [
  { value: "Hauptschulabschluss", label: "Hauptschulabschluss" },
  { value: "Realschulabschluss", label: "Realschulabschluss" },
  { value: "Abitur", label: "Abitur" },
  { value: "Fachabitur", label: "Fachabitur" },
  { value: "Fachhochschulreife", label: "Fachhochschulreife" },
  { value: "Bachelor", label: "Bachelor" },
  { value: "Master", label: "Master" },
  { value: "Ausbildung abgeschlossen", label: "Ausbildung abgeschlossen" },
];

export const SEARCH_KIND_OPTIONS = [
  { key: "Praktikum", label: "Praktikum" },
  { key: "Ausbildung", label: "Ausbildung" },
  { key: "Nach der Ausbildung Job", label: "Nach der Ausbildung Job" },
  { key: "Ausbildungsplatzwechsel", label: "Ausbildungsplatzwechsel" },
] as const;

export const SELECT_ALL_JOBS = "__all__";

export interface UseUnlockedFiltersOptions {
  initialStageFilters?: string[];
}

export interface UseUnlockedFiltersResult {
  filters: UnlockedFilters;
  setSelectedStageFilters: (v: string[] | ((prev: string[]) => string[])) => void;
  setShowArchived: (v: boolean) => void;
  setJobTitleFilter: (v: string) => void;
  setIndustryFilter: (v: string) => void;
  setLocationFilter: (v: string) => void;
  setAbschlussFilter: (v: string[] | ((prev: string[]) => string[])) => void;
  setSearchKindFilters: (v: string[] | ((prev: string[]) => string[])) => void;
  setUnlockedOnly: (v: boolean) => void;
  setSelectedJobId: (v: string | null) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

const DEFAULT_FILTERS: UnlockedFilters = {
  selectedStageFilters: [STAGE_FILTERS[0].key],
  showArchived: false,
  jobTitleFilter: "",
  industryFilter: "",
  locationFilter: "",
  abschlussFilter: [],
  searchKindFilters: SEARCH_KIND_OPTIONS.map((opt) => opt.key),
  unlockedOnly: true,
  selectedJobId: null,
};

export function useUnlockedFilters(options: UseUnlockedFiltersOptions = {}): UseUnlockedFiltersResult {
  const initialStage =
    options.initialStageFilters &&
    Array.isArray(options.initialStageFilters) &&
    options.initialStageFilters.length > 0
      ? options.initialStageFilters
      : [STAGE_FILTERS[0].key];

  const [selectedStageFilters, setSelectedStageFilters] = useState<string[]>(initialStage);
  const [showArchived, setShowArchived] = useState(false);
  const [jobTitleFilter, setJobTitleFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [abschlussFilter, setAbschlussFilter] = useState<string[]>([]);
  const [searchKindFilters, setSearchKindFilters] = useState<string[]>(
    SEARCH_KIND_OPTIONS.map((opt) => opt.key)
  );
  const [unlockedOnly, setUnlockedOnly] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const resetFilters = useCallback(() => {
    setSelectedStageFilters([STAGE_FILTERS[0].key]);
    setShowArchived(false);
    setJobTitleFilter("");
    setIndustryFilter("");
    setLocationFilter("");
    setAbschlussFilter([]);
    setSearchKindFilters(SEARCH_KIND_OPTIONS.map((opt) => opt.key));
    setUnlockedOnly(true);
    setSelectedJobId(null);
  }, []);

  const activeFilterCount =
    (selectedJobId ? 1 : 0) +
    (jobTitleFilter ? 1 : 0) +
    (industryFilter ? 1 : 0) +
    (locationFilter ? 1 : 0) +
    (abschlussFilter.length > 0 ? 1 : 0) +
    (searchKindFilters.length < SEARCH_KIND_OPTIONS.length ? 1 : 0) +
    (!unlockedOnly ? 1 : 0) +
    (showArchived ? 1 : 0);

  const filters: UnlockedFilters = {
    selectedStageFilters,
    showArchived,
    jobTitleFilter,
    industryFilter,
    locationFilter,
    abschlussFilter,
    searchKindFilters,
    unlockedOnly,
    selectedJobId,
  };

  return {
    filters,
    setSelectedStageFilters,
    setShowArchived,
    setJobTitleFilter,
    setIndustryFilter,
    setLocationFilter,
    setAbschlussFilter,
    setSearchKindFilters,
    setUnlockedOnly,
    setSelectedJobId,
    resetFilters,
    activeFilterCount,
  };
}
