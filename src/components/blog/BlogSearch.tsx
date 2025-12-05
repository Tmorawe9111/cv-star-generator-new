import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BlogSearchProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: {
    category?: string;
    industry?: string;
    targetAudience?: string;
  }) => void;
}

export function BlogSearch({ onSearchChange, onFilterChange }: BlogSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category') || null
  );
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(
    searchParams.get('industry') || null
  );
  const [selectedTargetAudience, setSelectedTargetAudience] = useState<string | null>(
    searchParams.get('audience') || null
  );

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedIndustry) params.set('industry', selectedIndustry);
    if (selectedTargetAudience) params.set('audience', selectedTargetAudience);
    
    setSearchParams(params, { replace: true });
    
    onSearchChange(searchQuery);
    onFilterChange({
      category: selectedCategory || undefined,
      industry: selectedIndustry || undefined,
      targetAudience: selectedTargetAudience || undefined,
    });
  }, [searchQuery, selectedCategory, selectedIndustry, selectedTargetAudience]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedIndustry(null);
    setSelectedTargetAudience(null);
  };

  const hasActiveFilters = selectedCategory || selectedIndustry || selectedTargetAudience || searchQuery;

  const categories = [
    { value: 'Ausbildung', label: 'Ausbildung' },
    { value: 'Karriere', label: 'Karriere' },
    { value: 'Tipps', label: 'Tipps' },
    { value: 'News', label: 'News' },
  ];

  const industries = [
    { value: 'pflege', label: 'Pflege' },
    { value: 'handwerk', label: 'Handwerk' },
    { value: 'industrie', label: 'Industrie' },
    { value: 'allgemein', label: 'Allgemein' },
  ];

  const targetAudiences = [
    { value: 'schueler', label: 'Schüler' },
    { value: 'azubi', label: 'Auszubildende' },
    { value: 'profi', label: 'Fachkräfte' },
    { value: 'unternehmen', label: 'Unternehmen' },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Artikel durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`rounded-full ${selectedCategory ? 'bg-[#5170ff] text-white border-[#5170ff]' : ''}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Kategorie
              {selectedCategory && `: ${categories.find(c => c.value === selectedCategory)?.label}`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Kategorie</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={selectedCategory === null}
              onCheckedChange={(checked) => setSelectedCategory(checked ? null : selectedCategory)}
            >
              Alle
            </DropdownMenuCheckboxItem>
            {categories.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat.value}
                checked={selectedCategory === cat.value}
                onCheckedChange={(checked) =>
                  setSelectedCategory(checked ? cat.value : null)
                }
              >
                {cat.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`rounded-full ${selectedIndustry ? 'bg-[#5170ff] text-white border-[#5170ff]' : ''}`}
            >
              Branche
              {selectedIndustry && `: ${industries.find(i => i.value === selectedIndustry)?.label}`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Branche</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={selectedIndustry === null}
              onCheckedChange={(checked) => setSelectedIndustry(checked ? null : selectedIndustry)}
            >
              Alle
            </DropdownMenuCheckboxItem>
            {industries.map((ind) => (
              <DropdownMenuCheckboxItem
                key={ind.value}
                checked={selectedIndustry === ind.value}
                onCheckedChange={(checked) =>
                  setSelectedIndustry(checked ? ind.value : null)
                }
              >
                {ind.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`rounded-full ${selectedTargetAudience ? 'bg-[#5170ff] text-white border-[#5170ff]' : ''}`}
            >
              Zielgruppe
              {selectedTargetAudience && `: ${targetAudiences.find(a => a.value === selectedTargetAudience)?.label}`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Zielgruppe</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={selectedTargetAudience === null}
              onCheckedChange={(checked) =>
                setSelectedTargetAudience(checked ? null : selectedTargetAudience)
              }
            >
              Alle
            </DropdownMenuCheckboxItem>
            {targetAudiences.map((aud) => (
              <DropdownMenuCheckboxItem
                key={aud.value}
                checked={selectedTargetAudience === aud.value}
                onCheckedChange={(checked) =>
                  setSelectedTargetAudience(checked ? aud.value : null)
                }
              >
                {aud.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="rounded-full text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4 mr-2" />
            Filter zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
}

