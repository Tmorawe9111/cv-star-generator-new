/**
 * FAQ Page - Minimalistischer Apple-Style mit FAQ Schema
 */

import React, { useState, useMemo } from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FAQStructuredData } from '@/components/seo/StructuredData';
import { FAQSearch, highlightSearchTerms } from '@/components/faq/FAQSearch';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
  category: 'allgemein' | 'profil' | 'bewerbung' | 'unternehmen';
}

const faqs: FAQItem[] = [
  {
    question: 'Wie erstelle ich mein Profil auf BeVisiblle?',
    answer: 'Du kannst dein Profil ganz einfach mit unserem Lebenslauf-Generator erstellen. Gehe zu "Registrieren" und folge den Schritten. Du kannst deinen Lebenslauf als PDF herunterladen und gleichzeitig wird dein Profil erstellt.',
    category: 'profil'
  },
  {
    question: 'Ist BeVisiblle kostenlos?',
    answer: 'Ja, die Grundfunktionen von BeVisiblle sind für Nutzer komplett kostenlos. Du kannst dein Profil erstellen, dich vernetzen, Jobs durchsuchen und dich bewerben – alles ohne Kosten.',
    category: 'allgemein'
  },
  {
    question: 'Wie bewerbe ich mich auf eine Stelle?',
    answer: 'Wenn du eine passende Stelle gefunden hast, klicke einfach auf "Bewerben". Du kannst dein Profil direkt übermitteln oder zusätzliche Dokumente hochladen. Der Arbeitgeber erhält eine Benachrichtigung und kann dich kontaktieren.',
    category: 'bewerbung'
  },
  {
    question: 'Wie kann ich mein Profil für Unternehmen sichtbar machen?',
    answer: 'In deinen Einstellungen kannst du deine Sichtbarkeit anpassen. Du kannst wählen, ob dein Profil öffentlich, nur für vernetzte Kontakte oder nur für bestimmte Unternehmen sichtbar sein soll.',
    category: 'profil'
  },
  {
    question: 'Wie registriere ich mein Unternehmen?',
    answer: 'Gehe zu "Für Unternehmen" und klicke auf "Unternehmensregistrierung". Folge dem Onboarding-Prozess, bei dem du deine Firmendaten, Branche und Standort angibst. Nach der Registrierung kannst du sofort Stellenanzeigen erstellen.',
    category: 'unternehmen'
  },
  {
    question: 'Wie erstelle ich eine Stellenanzeige?',
    answer: 'Nach der Unternehmensregistrierung kannst du im Dashboard auf "Stellenanzeige erstellen" klicken. Gib alle relevanten Details ein: Jobtitel, Beschreibung, Anforderungen, Standort und Vergütung. Die Anzeige wird nach der Veröffentlichung sofort sichtbar.',
    category: 'unternehmen'
  },
  {
    question: 'Wie funktioniert die Vernetzung mit anderen Nutzern?',
    answer: 'Du kannst andere Nutzer im Marketplace oder in der Community finden und ihnen eine Verbindungsanfrage senden. Sobald die Anfrage angenommen wird, seid ihr vernetzt und könnt euch Nachrichten senden.',
    category: 'allgemein'
  },
  {
    question: 'Kann ich meinen Lebenslauf auch ohne Profil erstellen?',
    answer: 'Ja, du kannst den Lebenslauf-Generator auch ohne Registrierung nutzen. Allerdings benötigst du ein Profil, um dich auf Jobs zu bewerben und dich mit anderen zu vernetzen.',
    category: 'profil'
  },
  {
    question: 'Wie kann ich mein Konto löschen?',
    answer: 'Du kannst dein Konto in den Einstellungen unter "Konto verwalten" löschen. Bitte beachte, dass alle deine Daten unwiderruflich gelöscht werden.',
    category: 'profil'
  },
  {
    question: 'Was kostet es für Unternehmen, Stellenanzeigen zu veröffentlichen?',
    answer: 'BeVisiblle bietet verschiedene Pläne für Unternehmen. Es gibt einen kostenlosen Plan mit limitierten Funktionen sowie kostenpflichtige Pläne (Basic, Growth, BeVisiblle, Enterprise) mit erweiterten Features. Die Preise findest du auf unserer Unternehmensseite.',
    category: 'unternehmen'
  }
];

const categories = [
  { id: 'all', label: 'Alle' },
  { id: 'allgemein', label: 'Allgemein' },
  { id: 'profil', label: 'Profil' },
  { id: 'bewerbung', label: 'Bewerbung' },
  { id: 'unternehmen', label: 'Unternehmen' }
];

export default function FAQ() {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>(faqs);

  const seoData = useSEO({
    title: 'FAQ – Häufig gestellte Fragen | BeVisiblle',
    description: 'Antworten auf die häufigsten Fragen zu BeVisiblle. Erfahre mehr über Profil, Bewerbungen, Unternehmen und mehr.',
    keywords: ['FAQ', 'Häufige Fragen', 'Hilfe', 'Support', 'BeVisiblle']
  });

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Combine category filter with search filter
  const displayedFAQs = useMemo(() => {
    let result = filteredFAQs;
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(faq => faq.category === selectedCategory);
    }
    
    return result;
  }, [filteredFAQs, selectedCategory]);

  // Get search query from URL
  const searchQuery = searchParams.get('q') || '';

  // Prepare FAQ data for structured data
  const faqStructuredData = faqs.map(faq => ({
    question: faq.question,
    answer: faq.answer
  }));

  return (
    <>
      <SEOHead {...seoData} />
      <FAQStructuredData faqs={faqStructuredData} />
      <CareerHubHeader />
      <BaseLayout>
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen pt-24">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
              <Breadcrumbs items={[
                { name: 'Home', url: '/' },
                { name: 'FAQ', url: '/faq' }
              ]} />
            </div>

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Häufig gestellte Fragen
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Finde schnell Antworten auf die häufigsten Fragen zu BeVisiblle.
              </p>
            </div>

            {/* Search */}
            <FAQSearch faqs={faqs} onFilteredFAQsChange={setFilteredFAQs} />

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-[#5170ff] text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {displayedFAQs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    {searchQuery
                      ? 'Keine FAQs gefunden, die zu Ihrer Suche passen.'
                      : 'Keine FAQs in dieser Kategorie.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        window.history.replaceState({}, '', '/faq');
                      }}
                      className="text-[#5170ff] hover:underline"
                    >
                      Alle FAQs anzeigen
                    </button>
                  )}
                </div>
              ) : (
                displayedFAQs.map((faq, displayIndex) => {
                // Find original index for openItems tracking
                const originalIndex = faqs.findIndex(f => f.question === faq.question && f.answer === faq.answer);
                const isOpen = openItems.has(originalIndex);
                return (
                  <div
                    key={originalIndex}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => toggleItem(originalIndex)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 pr-4 group-hover:text-[#5170ff] transition-colors">
                        {searchQuery ? highlightSearchTerms(faq.question, searchQuery) : faq.question}
                      </h3>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5">
                        <p className="text-gray-600 leading-relaxed">
                          {searchQuery ? highlightSearchTerms(faq.answer, searchQuery) : faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
              )}
            </div>

            {/* Contact CTA */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                Deine Frage nicht gefunden?
              </p>
              <a
                href="/hilfe"
                className="inline-flex items-center px-6 py-3 bg-[#5170ff] text-white rounded-full font-medium hover:bg-[#5170ff]/90 transition-colors"
              >
                Hilfe-Center besuchen
              </a>
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
}

