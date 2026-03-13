import { useMemo } from "react";
import type { UnlockedCandidate } from "@/types/unlocked";
import type { UnlockedFilters } from "@/types/unlocked";
import { ARCHIVED_FILTERS, SEARCH_KIND_OPTIONS } from "./useUnlockedFilters";

function normalizeSearchKind(value: unknown): string | null {
  if (!value) return null;
  const raw = typeof value === "string" ? value.trim() : String(value).trim();
  if (!raw) return null;
  const match = SEARCH_KIND_OPTIONS.find(
    (opt) =>
      opt.key.toLowerCase() === raw.toLowerCase() ||
      opt.label.toLowerCase() === raw.toLowerCase()
  );
  return match ? match.key : null;
}

export interface UseUnlockedFilteringOptions {
  profiles: UnlockedCandidate[];
  recentlyViewed: UnlockedCandidate[];
  filters: UnlockedFilters;
  search: string;
  currentPage: number;
  itemsPerPage: number;
}

export interface UseUnlockedFilteringResult {
  filteredProfiles: UnlockedCandidate[];
  filteredRecentlyViewed: UnlockedCandidate[];
  currentProfiles: UnlockedCandidate[];
  currentRecentlyViewed: UnlockedCandidate[];
  totalPages: number;
  totalPagesViewed: number;
  startIndex: number;
  endIndex: number;
}

export function useUnlockedFiltering({
  profiles,
  recentlyViewed,
  filters,
  search,
  currentPage,
  itemsPerPage,
}: UseUnlockedFilteringOptions): UseUnlockedFilteringResult {
  const filteredProfiles = useMemo(() => {
    const {
      selectedStageFilters,
      showArchived,
      jobTitleFilter,
      industryFilter,
      locationFilter,
      abschlussFilter,
      searchKindFilters,
      unlockedOnly,
      selectedJobId,
    } = filters;

    return profiles.filter((p) => {
      const stageKey = (p.stage || p.status || "FREIGESCHALTET").toUpperCase();

      if (showArchived) {
        if (!ARCHIVED_FILTERS.some((f) => f.key === stageKey)) return false;
      } else {
        if (!selectedStageFilters.includes(stageKey)) return false;
        if (ARCHIVED_FILTERS.some((f) => f.key === stageKey)) return false;
      }

      if (unlockedOnly && !p.unlocked_at) return false;

      const searchText = search.trim().toLowerCase();
      if (searchText) {
        const matchesSearch =
          `${p.vorname} ${p.nachname}`.toLowerCase().includes(searchText) ||
          (p.ort?.toLowerCase().includes(searchText) ?? false) ||
          (p.branche?.toLowerCase().includes(searchText) ?? false) ||
          (p.headline?.toLowerCase().includes(searchText) ?? false);
        if (!matchesSearch) return false;
      }

      if (jobTitleFilter && !(p.headline?.toLowerCase().includes(jobTitleFilter.toLowerCase()) ?? false))
        return false;
      if (industryFilter && !(p.branche?.toLowerCase().includes(industryFilter.toLowerCase()) ?? false))
        return false;
      if (locationFilter && !(p.ort?.toLowerCase().includes(locationFilter.toLowerCase()) ?? false))
        return false;

      if (selectedJobId) {
        const hasLinkedJob = p.linkedJobTitles?.some((job) => job.id === selectedJobId);
        if (!hasLinkedJob) return false;
      }

      if (abschlussFilter.length > 0) {
        const hasMatchingAbschluss =
          (p.geplanter_abschluss && abschlussFilter.includes(p.geplanter_abschluss)) ||
          (Array.isArray(p.schulbildung) &&
            (p.schulbildung as Array<{ abschluss?: string; degree?: string; qualifikation?: string }>).some(
              (edu) => {
                const abschluss = edu.abschluss || edu.degree || edu.qualifikation;
                return abschluss && abschlussFilter.includes(abschluss);
              }
            ));
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
        const hasMatch = normalizedPrefs.some((pref) => searchKindFilters.includes(pref));
        if (normalizedPrefs.length && !hasMatch) return false;
      }

      return true;
    });
  }, [profiles, filters, search]);

  const filteredRecentlyViewed = useMemo(() => {
    const s = search.toLowerCase();
    return recentlyViewed.filter(
      (p) =>
        `${p.vorname} ${p.nachname}`.toLowerCase().includes(s) ||
        (p.ort?.toLowerCase().includes(s) ?? false) ||
        (p.branche?.toLowerCase().includes(s) ?? false)
    );
  }, [recentlyViewed, search]);

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const totalPagesViewed = Math.ceil(filteredRecentlyViewed.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentProfiles = filteredProfiles.slice(startIndex, endIndex);
  const currentRecentlyViewed = filteredRecentlyViewed.slice(startIndex, endIndex);

  return {
    filteredProfiles,
    filteredRecentlyViewed,
    currentProfiles,
    currentRecentlyViewed,
    totalPages,
    totalPagesViewed,
    startIndex,
    endIndex,
  };
}
