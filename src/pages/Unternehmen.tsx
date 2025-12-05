/**
 * Unternehmen Landing Page - Minimalistischer Apple-Style
 * Überarbeitete Version mit CareerHubHeader
 */

import React from 'react';
import { Link } from 'react-router-dom';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { LocalBusinessStructuredData } from '@/components/seo/StructuredData';
import { Check, ArrowRight, Target, Zap, BarChart3, Shield, Users2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Target,
    title: 'Standardisierte Profile',
    description: 'Alle Profile werden durch unseren Lebenslauf-Generator erstellt – vollständig, verifiziert und vergleichbar.'
  },
  {
    icon: Zap,
    title: 'Direkter Kontakt',
    description: 'Schalte Profile frei und kontaktiere qualifizierte Kandidaten direkt – ohne Umwege.'
  },
  {
    icon: BarChart3,
    title: 'Intelligentes Matching',
    description: 'AI-basiertes Matching findet die passenden Kandidaten für deine offenen Stellen.'
  },
  {
    icon: Users2,
    title: 'Employee Branding',
    description: 'Deine Mitarbeiter werden zu Botschaftern deines Unternehmens in der Community.'
  },
  {
    icon: Shield,
    title: 'Sicher & DSGVO-konform',
    description: 'Alle Daten werden sicher und datenschutzkonform verarbeitet.'
  },
  {
    icon: TrendingUp,
    title: 'Messbare Ergebnisse',
    description: 'Analytics zeigen dir, welche Kanäle und Maßnahmen am besten funktionieren.'
  }
];

const pricingTiers = [
  {
    id: 'base',
    title: 'Base',
    description: 'Ideal für Unternehmen die jährlich rund 20 neue Mitarbeiter suchen',
    price: { monthly: 369, yearly: 3950 },
    badge: undefined,
    features: [
      '10 Tokens pro Monat',
      '5 Stellenanzeigen im Quartal',
      '2 Standorte',
      '1 Zugang',
      'Grundlegende Analytics',
      'Support per Mail'
    ],
    ctaLabel: 'Jetzt starten',
    ctaHref: '/unternehmensregistrierung?tarif=basis'
  },
  {
    id: 'pro',
    title: 'Pro',
    description: 'Ideal für Unternehmen die jährlich rund 50 neue Mitarbeiter suchen',
    price: { monthly: 985, yearly: 9555 },
    badge: 'Beliebt',
    features: [
      '25 Tokens pro Monat',
      '12 Stellenanzeigen im Quartal',
      'Mehrere Standorte',
      '5 Zugänge',
      'AI Matching',
      'Matches via Email',
      '1 zu 1 Support mit Onboarding'
    ],
    ctaLabel: 'Jetzt starten',
    ctaHref: '/unternehmensregistrierung?tarif=profi'
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'Ideal für Unternehmen mit über 250 Mitarbeiter',
    price: { monthly: null, yearly: null },
    badge: undefined,
    features: [
      'Unlimited Tokens',
      'Unlimited Stellenanzeigen',
      'Unlimited Zugänge',
      'Personalisiertes AI Matching',
      'Matches via Email und WhatsApp',
      '1 zu 1 Support'
    ],
    ctaLabel: 'Kontaktiere uns',
    ctaHref: '/support'
  }
];

export default function Unternehmen() {
  const seoData = useSEO({
    title: 'Für Unternehmen – BeVisiblle',
    description: 'Finde passende Auszubildende und Fachkräfte durch standardisierte Profile und intelligentes Matching. Jetzt Unternehmens-Account erstellen.',
    keywords: ['Unternehmen', 'Recruiting', 'Fachkräfte finden', 'Azubi finden', 'BeVisiblle']
  });

  return (
    <>
      <SEOHead {...seoData} />
      <LocalBusinessStructuredData />
      <CareerHubHeader />
      <BaseLayout>
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen pt-24">
          <div className="max-w-6xl mx-auto px-6 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
              <Breadcrumbs items={[
                { name: 'Home', url: '/' },
                { name: 'Unternehmen', url: '/unternehmen' }
              ]} />
            </div>

            {/* Hero Section */}
            <div className="text-center mb-20">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                Finde passende <span className="text-[#5170ff]">Fachkräfte</span> und <span className="text-[#5170ff]">Azubis</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Standardisierte Profile. Direkter Kontakt. Intelligentes Matching. Weniger Aufwand – mehr Matches.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/unternehmensregistrierung"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#5170ff] text-white rounded-full font-semibold hover:bg-[#5170ff]/90 transition-colors shadow-lg hover:shadow-xl"
                >
                  Jetzt registrieren
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/support"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                >
                  Demo buchen
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mb-20">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Warum BeVisiblle?
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-3 bg-blue-50 rounded-lg w-fit mb-4">
                        <Icon className="h-6 w-6 text-[#5170ff]" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Transparente Preise
                </h2>
                <p className="text-gray-600">
                  Flexibel wechseln – keine versteckten Kosten.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingTiers.map((tier) => {
                  const isPopular = tier.id === 'pro';
                  return (
                    <div
                      key={tier.id}
                      className={`relative bg-white rounded-2xl border p-8 shadow-sm hover:shadow-md transition-shadow ${
                        isPopular ? 'border-[#5170ff] ring-2 ring-[#5170ff]/20' : 'border-gray-200'
                      }`}
                    >
                      {tier.badge && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5170ff] text-white text-sm font-semibold rounded-full">
                          {tier.badge}
                        </div>
                      )}
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.title}</h3>
                        {tier.price.monthly ? (
                          <div className="text-4xl font-bold text-gray-900">
                            €{tier.price.monthly}
                            <span className="text-lg font-normal text-gray-500">/Monat</span>
                          </div>
                        ) : (
                          <div className="text-2xl font-semibold text-gray-700">
                            Individuell
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mt-2">{tier.description}</p>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isPopular ? 'text-[#5170ff]' : 'text-gray-400'}`} />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to={tier.ctaHref}
                        className={`block w-full text-center px-6 py-3 rounded-full font-semibold transition-colors ${
                          isPopular
                            ? 'bg-[#5170ff] text-white hover:bg-[#5170ff]/90'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tier.ctaLabel}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-[#5170ff] to-blue-600 rounded-2xl p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Bereit loszulegen?</h2>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                Erstelle jetzt deinen Unternehmens-Account und finde die passenden Kandidaten für dein Team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/unternehmensregistrierung"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#5170ff] rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Jetzt registrieren
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/support"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
                >
                  Support kontaktieren
                </Link>
              </div>
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
}
