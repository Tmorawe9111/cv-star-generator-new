/**
 * Unternehmen Landing Page - Minimalistischer Apple-Style
 * Überarbeitete Version mit CareerHubHeader
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { LocalBusinessStructuredData } from '@/components/seo/StructuredData';
import { Check, ArrowRight, Target, Zap, BarChart3, Shield, Users2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY_PRICING_TIERS } from '@/config/companyPricing';

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

export default function Unternehmen() {
  const [billingYearly, setBillingYearly] = useState(false);
  useEffect(() => {
    if (window.location.hash === '#pricing') {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    }
    const onHashChange = () => {
      if (window.location.hash === '#pricing') {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
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
            <div className="text-center mb-12">
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
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                >
                  Preise anzeigen
                </a>
                <Link
                  to="/support"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                >
                  Demo buchen
                </Link>
              </div>
            </div>

            {/* Pricing Section - direkt nach Hero, gut sichtbar */}
            <div id="pricing" className="mb-20 rounded-3xl overflow-hidden bg-slate-900 py-16 px-4 md:px-8 scroll-mt-24">
              <div className="mx-auto max-w-5xl">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-white">
                    Transparente Preise
                  </h2>
                  <p className="mt-2 text-slate-400">
                    Flexibel wechseln – keine versteckten Kosten.
                  </p>
                  <div className="mt-6 inline-flex rounded-full bg-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => setBillingYearly(false)}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                        !billingYearly ? 'bg-[#5170ff] text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Monatlich
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingYearly(true)}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                        billingYearly ? 'bg-[#5170ff] text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Jährlich
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3 items-stretch">
                  {COMPANY_PRICING_TIERS.map((tier) => {
                    const isPopular = tier.id === 'pro';
                    const price = tier.price.monthly != null
                      ? (billingYearly ? tier.price.yearly! : tier.price.monthly)
                      : null;
                    const period = billingYearly ? 'Jahr' : 'Monat';
                    const isEnterprise = tier.id === 'enterprise';
                    return (
                      <div
                        key={tier.id}
                        className={`relative rounded-2xl border px-6 py-8 text-left transition ${
                          isPopular
                            ? 'bg-slate-800/80 border-[#5170ff] ring-2 ring-[#5170ff]/30'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        {tier.badge && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#5170ff] text-white text-xs font-semibold">
                            {tier.badge}
                          </div>
                        )}
                        <h3 className="text-xl font-semibold text-white">{tier.title}</h3>
                        <div className="mt-3 text-2xl md:text-3xl font-bold text-white">
                          {isEnterprise ? (
                            'Individuell'
                          ) : (
                            <>
                              €{price}
                              <span className="text-base font-normal text-slate-400"> /{period}</span>
                            </>
                          )}
                        </div>
                        {tier.description && (
                          <p className="mt-2 text-sm text-slate-400">{tier.description}</p>
                        )}
                        <ul className="mt-6 space-y-3 text-sm text-slate-300">
                          {tier.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2">
                              <Check className={`h-4 w-4 flex-shrink-0 ${isPopular ? 'text-[#5170ff]' : 'text-slate-500'}`} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {tier.ctaHref.startsWith('http') ? (
                          <a
                            href={tier.ctaHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                              isPopular
                                ? 'bg-[#5170ff] text-white hover:bg-[#3d5fe6]'
                                : 'bg-slate-700 text-white hover:bg-slate-600'
                            }`}
                          >
                            {tier.ctaLabel}
                          </a>
                        ) : (
                          <Link
                            to={tier.ctaHref.includes('unternehmensregistrierung') ? `${tier.ctaHref}&billing=${billingYearly ? 'yearly' : 'monthly'}` : tier.ctaHref}
                            className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                              isPopular
                                ? 'bg-[#5170ff] text-white hover:bg-[#3d5fe6]'
                                : 'bg-slate-700 text-white hover:bg-slate-600'
                            }`}
                          >
                            {tier.ctaLabel}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mb-20">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
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

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-[#5170ff] to-blue-600 rounded-2xl p-6 md:p-12 text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Bereit loszulegen?</h2>
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
