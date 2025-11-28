import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface BlogArchiveProps {
  articles: Array<{
    id: string;
    slug: string;
    title: string;
    featured_image?: string | null;
    category?: string | null;
    published_at?: string | null;
    industry_sector?: string | null;
  }>;
}

export function BlogArchive({ articles }: BlogArchiveProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Filtere Artikel
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    if (selectedTopic !== 'all') {
      filtered = filtered.filter((a) => {
        if (selectedTopic === 'pflege') return a.industry_sector === 'pflege';
        if (selectedTopic === 'handwerk') return a.industry_sector === 'handwerk';
        if (selectedTopic === 'industrie') return a.industry_sector === 'industrie';
        return true;
      });
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter((a) => {
        if (!a.published_at) return false;
        const year = new Date(a.published_at).getFullYear();
        return year.toString() === selectedYear;
      });
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter((a) => {
        if (!a.published_at) return false;
        const month = new Date(a.published_at).getMonth();
        return month.toString() === selectedMonth;
      });
    }

    return filtered;
  }, [articles, selectedTopic, selectedYear, selectedMonth]);

  // Gruppiere Artikel nach Monat (wie im Screenshot)
  const groupedArticles = useMemo(() => {
    const groups: Record<string, Array<typeof articles[0]>> = {};

    filteredArticles.forEach((article) => {
      if (!article.published_at) return;

      const date = new Date(article.published_at);
      const displayKey = format(date, 'MMMM yyyy', { locale: de });

      if (!groups[displayKey]) {
        groups[displayKey] = [];
      }
      groups[displayKey].push(article);
    });

    // Sortiere die Keys (neueste zuerst) - Parse "November 2025" zu Date
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      // Versuche "MMMM yyyy" zu parsen
      const parseMonthYear = (str: string) => {
        const parts = str.split(' ');
        const monthNames = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
        const monthIndex = monthNames.findIndex(m => m === parts[0].toLowerCase());
        const year = parseInt(parts[1]);
        return new Date(year, monthIndex, 1);
      };
      
      const dateA = parseMonthYear(a);
      const dateB = parseMonthYear(b);
      return dateB.getTime() - dateA.getTime();
    });

    return { groups, sortedKeys };
  }, [filteredArticles]);

  // Extrahiere verfügbare Jahre und Topics
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    articles.forEach((a) => {
      if (a.published_at) {
        years.add(new Date(a.published_at).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [articles]);

  const getCategoryLabel = (article: typeof articles[0]) => {
    if (article.category) return article.category.toUpperCase();
    if (article.industry_sector) {
      const labels: Record<string, string> = {
        pflege: 'PFLEGE',
        handwerk: 'HANDWERK',
        industrie: 'INDUSTRIE',
      };
      return labels[article.industry_sector] || '';
    }
    return 'KARRIERE';
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-12">
        {/* Header mit Filtern - Apple Style */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
              Newsroom
            </h1>
          </div>

          {/* Filter Bar - Genau wie im Screenshot */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                <SelectItem value="pflege">Pflege</SelectItem>
                <SelectItem value="handwerk">Handwerk</SelectItem>
                <SelectItem value="industrie">Industrie</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(2025, i, 1);
                  return (
                    <SelectItem key={i} value={i.toString()}>
                      {format(date, 'MMMM', { locale: de })}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Artikel-Liste - Genau wie im Screenshot */}
        <div className="space-y-12">
          {groupedArticles.sortedKeys.map((monthYear) => {
            const monthArticles = groupedArticles.groups[monthYear];

            if (monthArticles.length === 0) return null;

            return (
              <div key={monthYear}>
                {/* Monat-Header */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {monthYear}
                </h2>

                {/* Artikel-Grid - 2 Spalten wie im Screenshot */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {monthArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/blog/${article.slug}`}
                      className="group"
                    >
                      <div className="flex flex-col gap-4">
                        {/* Bild */}
                        {article.featured_image && (
                          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-gray-100">
                            <img
                              src={article.featured_image}
                              alt={article.title}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          </div>
                        )}

                        {/* Text */}
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                            {getCategoryLabel(article)}
                          </span>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors mb-2">
                            {article.title}
                          </h3>
                          {article.published_at && (
                            <time className="text-sm text-gray-400">
                              {format(new Date(article.published_at), 'd. MMMM yyyy', { locale: de })}
                            </time>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

