import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
  category: 'allgemein' | 'profil' | 'bewerbung' | 'unternehmen';
}

interface FAQSearchProps {
  faqs: FAQItem[];
  onFilteredFAQsChange: (filtered: FAQItem[]) => void;
}

export function FAQSearch({ faqs, onFilteredFAQsChange }: FAQSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Filter FAQs based on search query
  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqs;
    }

    const query = searchQuery.toLowerCase().trim();
    return faqs.filter((faq) => {
      const questionMatch = faq.question.toLowerCase().includes(query);
      const answerMatch = faq.answer.toLowerCase().includes(query);
      return questionMatch || answerMatch;
    });
  }, [faqs, searchQuery]);

  // Update parent component when filtered FAQs change
  useEffect(() => {
    onFilteredFAQsChange(filteredFAQs);
  }, [filteredFAQs, onFilteredFAQsChange]);

  // Update URL params when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    setSearchParams(params, { replace: true });
  }, [searchQuery, setSearchParams]);

  // Highlight search terms in text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-full mb-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Fragen durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Suche zurücksetzen"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {searchQuery && (
        <div className="mt-4 text-sm text-gray-600">
          {filteredFAQs.length > 0 ? (
            <span>
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden
            </span>
          ) : (
            <span className="text-gray-500">Keine Ergebnisse gefunden</span>
          )}
        </div>
      )}
    </div>
  );
}

// Export highlight function for use in FAQ items
export function highlightSearchTerms(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-gray-900 px-1 rounded font-medium">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

