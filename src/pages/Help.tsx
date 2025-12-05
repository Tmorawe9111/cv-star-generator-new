/**
 * Help Center Page - Minimalistischer Apple-Style
 */

import React from 'react';
import { Link } from 'react-router-dom';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FAQStructuredData } from '@/components/seo/StructuredData';
import { HelpCircle, BookOpen, MessageCircle, FileText, Search } from 'lucide-react';

const helpCategories = [
  {
    title: 'Erste Schritte',
    icon: BookOpen,
    items: [
      { title: 'Wie erstelle ich mein Profil?', url: '/hilfe/profil-erstellen' },
      { title: 'Wie funktioniert der Lebenslauf-Generator?', url: '/hilfe/lebenslauf-generator' },
      { title: 'Wie vernetze ich mich mit anderen?', url: '/hilfe/vernetzung' },
      { title: 'Wie bewerbe ich mich auf Jobs?', url: '/hilfe/bewerbung' }
    ]
  },
  {
    title: 'Profil & Einstellungen',
    icon: FileText,
    items: [
      { title: 'Wie bearbeite ich mein Profil?', url: '/hilfe/profil-bearbeiten' },
      { title: 'Wie ändere ich meine Sichtbarkeit?', url: '/hilfe/sichtbarkeit' },
      { title: 'Wie lösche ich mein Konto?', url: '/hilfe/konto-loeschen' }
    ]
  },
  {
    title: 'Unternehmen',
    icon: MessageCircle,
    items: [
      { title: 'Wie registriere ich mein Unternehmen?', url: '/hilfe/unternehmen-registrieren' },
      { title: 'Wie erstelle ich eine Stellenanzeige?', url: '/hilfe/stellenanzeige-erstellen' },
      { title: 'Wie verwalte ich Bewerbungen?', url: '/hilfe/bewerbungen-verwalten' }
    ]
  }
];

export default function Help() {
  const seoData = useSEO({
    title: 'Hilfe & Support – BeVisiblle',
    description: 'Finde Antworten auf deine Fragen zu BeVisiblle. Hilfe zu Profil, Lebenslauf, Bewerbungen und mehr.',
    keywords: ['Hilfe', 'Support', 'FAQ', 'Anleitung', 'BeVisiblle']
  });

  return (
    <>
      <SEOHead {...seoData} />
      <CareerHubHeader />
      <BaseLayout>
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen pt-24">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
              <Breadcrumbs items={[
                { name: 'Home', url: '/' },
                { name: 'Hilfe', url: '/hilfe' }
              ]} />
            </div>

            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Wie können wir dir helfen?
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Finde schnell Antworten auf deine Fragen oder kontaktiere unseren Support.
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suche nach Hilfe..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-8 mb-16">
              {helpCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Icon className="h-6 w-6 text-[#5170ff]" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900">{category.title}</h2>
                    </div>
                    <ul className="space-y-3">
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex}>
                          <Link
                            to={item.url}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <span className="text-gray-700 group-hover:text-gray-900">{item.title}</span>
                            <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-br from-[#5170ff] to-blue-600 rounded-2xl p-8 text-white text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-semibold mb-2">Noch Fragen?</h2>
              <p className="text-blue-100 mb-6 max-w-md mx-auto">
                Unser Support-Team hilft dir gerne weiter. Kontaktiere uns direkt.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/kontakt"
                  className="px-6 py-3 bg-white text-[#5170ff] rounded-full font-medium hover:bg-gray-100 transition-colors"
                >
                  Support kontaktieren
                </Link>
                <Link
                  to="/faq"
                  className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-full font-medium hover:bg-white/10 transition-colors"
                >
                  FAQ ansehen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
}

