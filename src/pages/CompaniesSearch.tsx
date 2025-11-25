import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompanyCard } from "@/components/shared/CompanyCard";
import { useNavigate } from "react-router-dom";
import type { CompanyBase } from "@/types/company";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BRANCHES } from '@/lib/branches';

export default function CompaniesSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [location, setLocation] = useState<string>("");
  const [sizeRange, setSizeRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // SEO
  useEffect(() => {
    document.title = "Unternehmen suchen – Handwerk Netzwerk";
    const desc = "Finde interessante Unternehmen im Handwerk. Durchsuche Profile, entdecke Arbeitgeber und informiere dich über Branchen.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, []);

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies-search", searchQuery, industry, location, sizeRange],
    queryFn: async () => {
      let query = supabase
        .from("companies")
        .select("id, name, logo_url, industry, main_location, employee_count")
        .order("name");

      if (searchQuery.trim()) {
        query = query.ilike("name", `%${searchQuery.trim()}%`);
      }

      if (industry && industry !== "all") {
        // industry is now a branch key (e.g., 'handwerk', 'it')
        query = query.eq("industry", industry);
      }

      if (location) {
        query = query.ilike("main_location", `%${location}%`);
      }

      if (sizeRange && sizeRange !== "all") {
        query = query.eq("size_range", sizeRange);
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return (data || []) as CompanyBase[];
    },
  });

  // Use centralized branches instead of querying companies
  const industries = BRANCHES.map(b => ({
    id: b.key,
    name: b.label
  }));

  const activeFiltersCount = [
    industry !== "all" && industry,
    location,
    sizeRange !== "all" && sizeRange
  ].filter(Boolean).length;

  const clearFilters = () => {
    setIndustry("all");
    setLocation("");
    setSizeRange("all");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Unternehmen entdecken</h1>
        <p className="text-muted-foreground">
          Finde interessante Arbeitgeber und informiere dich über Branchen
        </p>
      </header>

      {/* Search Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Unternehmen suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filter
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 h-5 min-w-5 px-1">{activeFiltersCount}</Badge>
            )}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Branche</label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Branchen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Branchen</SelectItem>
                    {industries.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Standort</label>
                <Input
                  placeholder="Stadt oder Region"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Unternehmensgröße</label>
                <Select value={sizeRange} onValueChange={setSizeRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Größen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Größen</SelectItem>
                    <SelectItem value="1-10">1-10 Mitarbeiter</SelectItem>
                    <SelectItem value="11-50">11-50 Mitarbeiter</SelectItem>
                    <SelectItem value="51-200">51-200 Mitarbeiter</SelectItem>
                    <SelectItem value="201-500">201-500 Mitarbeiter</SelectItem>
                    <SelectItem value="501+">501+ Mitarbeiter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Filter zurücksetzen
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!isLoading && (
        <div className="mb-4 text-sm text-muted-foreground">
          {companies?.length || 0} {companies?.length === 1 ? 'Unternehmen gefunden' : 'Unternehmen gefunden'}
        </div>
      )}

      {/* Results Grid */}
      <main>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : companies && companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                variant="discover"
                onClick={() => navigate(`/companies/${company.id}`)}
                className="w-full"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Keine Unternehmen gefunden</p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
