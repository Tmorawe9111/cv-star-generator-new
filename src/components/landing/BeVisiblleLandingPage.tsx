import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BeVisiblleLandingSections from '@/components/landing/BeVisiblleLandingSections';
import CompanyPricingSection from '@/components/landing/CompanyPricingSection';
import CareerFieldsSection from '@/components/marketing/CareerFieldsSection';
import { trackCalendlyClick, trackPageView } from '@/lib/telemetry';
import { motion } from 'framer-motion';
import { WebSiteStructuredData, OrganizationStructuredData, LocalBusinessStructuredData } from '@/components/seo/StructuredData';

const heroVariants = [
  {
    id: 'main',
    image: '/assets/hero-main.png',
    headline: 'Das Karrierenetzwerk für Pflege, Handwerk & alle, die anpacken.',
    subtitle: 'Schluss mit Vitamin B nur für die da oben. Egal ob auf Station oder Baustelle: Vernetze dich, zeig was du kannst und finde Jobs, die dich wertschätzen.',
    description: '',
    ctaText: 'Kostenlos Profil erstellen'
  },
  {
    id: 'business',
    image: '/assets/hero-business-cropped.png',
    headline: 'Finde deinen Traumjob mit',
    subtitle: 'Vernetze dich mit Unternehmen, die zu dir passen',
    description: 'Erstelle deinen Lebenslauf, präsentiere deine Fähigkeiten und werde sichtbar für Unternehmen, die genau nach dir suchen.'
  },
  {
    id: 'healthcare',
    image: '/assets/hero-healthcare-cropped.png',
    headline: 'Deine Karriere in der Pflege startet hier mit',
    subtitle: 'Jobs, Community und Weiterbildung an einem Ort',
    description: 'Ob Ausbildung oder Fachkraft – finde passende Stellen im Gesundheitswesen und tausche dich mit Kolleg:innen aus der Branche aus.'
  },
  {
    id: 'construction',
    image: '/assets/hero-construction-cropped.png',
    headline: 'Handwerk hat goldenen Boden',
    headlineExtra: '–\u00A0und',
    subtitle: 'Dein Netzwerk für Azubis und Fachkräfte im Handwerk',
    description: 'Zeige deine praktischen Fähigkeiten, finde Ausbildungsplätze oder Jobs im Handwerk und vernetze dich mit Gleichgesinnten.'
  }
];

export default function BeVisiblleLandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const selectedHero = 0; // Immer die erste Variante verwenden

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Calendly integration - open in new tab
  const openCalendly = (buttonLabel: string = 'Demo buchen') => {
    trackCalendlyClick(buttonLabel, 'Landing Page');
    window.open('https://calendly.com/bevisiblle/demo', '_blank', 'noopener,noreferrer');
  };

  // Newsletter form handler
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Newsletter-Anmeldung erfolgreich!');
  };

  useEffect(() => {
    trackPageView('Landing Page');
  }, []);

  return (
    <>
      <WebSiteStructuredData />
      <OrganizationStructuredData />
      <LocalBusinessStructuredData />
      <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 40%, #faf5ff 70%, #f0f4ff 100%)' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(81,112,255,.05) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '30%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.04) 0%, transparent 60%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(81,112,255,.04) 0%, transparent 60%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '30%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.03) 0%, transparent 55%)', filter: 'blur(30px)' }} />
      </div>

      {/* Header */}
      <header className="fixed top-4 left-0 right-0 z-50">
        <nav className="mx-auto max-w-5xl px-4">
          <div className="bg-white/90 backdrop-blur rounded-full shadow-sm border px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              {/* Left: Logo */}
              <Link to="/" className="flex items-center gap-2 pl-1">
                <div className="flex items-center gap-2">
                  <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" className="h-8 w-8 object-contain" />
                  <span className="text-lg font-semibold tracking-tight">
                    BeVisib<span className="text-primary">ll</span>e
                  </span>
                </div>
              </Link>

              {/* Center: Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <Link to="/cv-generator" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Lebenslauf
                </Link>
                <a href="#community" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Community
                </a>
                <Link to="/company" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Unternehmen
                </Link>
                <a href="#pricing" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Preise
                </a>
                <Link to="/about" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Über uns
                </Link>
              </nav>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
              <Link to="/auth" className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Login
              </Link>
              <Link to="/cv-generator" className="rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-[#5170ff]">
                Jetzt registrieren
              </Link>
                {/* Mobile menu button */}
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile dropdown */}
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden mx-4 mt-2 bg-white/90 backdrop-blur rounded-lg shadow-sm border px-4 py-2`}>
            <Link to="/cv-generator" className="block py-2 text-gray-700 hover:text-gray-900">
              Lebenslauf
            </Link>
            <a href="#community" className="block py-2 text-gray-700 hover:text-gray-900">
              Community
            </a>
            <Link to="/company" className="block py-2 text-gray-700 hover:text-gray-900">
              Unternehmen
            </Link>
            <a href="#pricing" className="block py-2 text-gray-700 hover:text-gray-900">
              Preise
            </a>
            <Link to="/about" className="block py-2 text-gray-700 hover:text-gray-900">
              Über uns
            </Link>
            <Link to="/auth" className="block py-2 text-gray-700 hover:text-gray-900">
              Login
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section - Split Screen Layout */}
      <section className="relative pt-28 pb-16" style={{ zIndex: 1 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 900, height: 500, background: 'radial-gradient(ellipse at center, rgba(81,112,255,.06) 0%, rgba(124,58,237,.03) 30%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="mx-auto max-w-7xl px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Linke Spalte - Text Content - Mobile: Text zuerst */}
            <div className="order-1 lg:order-1 text-center lg:text-left">
              <motion.h1
                key={`headline-${selectedHero}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
              >
                {selectedHero === 0 ? (
                  <>
                    <span>Das Karrierenetzwerk</span><br />
                    <span className="text-[#2563eb]">für Pflege, Handwerk</span><br />
                    <span className="text-[#2563eb]">& alle, die anpacken.</span>
                  </>
                ) : (
                  <>
                    {heroVariants[selectedHero].headline}
                    {heroVariants[selectedHero].headlineExtra && (
                      <span> {heroVariants[selectedHero].headlineExtra}</span>
                    )}
                    {selectedHero !== 0 && (
                      <span className="text-[#5170ff]"> BeVisiblle</span>
                    )}
                  </>
                )}
              </motion.h1>
              <motion.p
                key={`subtitle-${selectedHero}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8"
              >
                {heroVariants[selectedHero].subtitle}
              </motion.p>
              {heroVariants[selectedHero].description && (
                <motion.p
                  key={`desc-${selectedHero}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-gray-600 mb-8"
                >
                  {heroVariants[selectedHero].description}
                </motion.p>
              )}

              {/* CTA Button mit Profil-Cluster */}
              <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  to="/cv-generator" 
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  style={{ 
                    background: '#5170ff', 
                    boxShadow: '0 8px 25px rgba(81,112,255,0.35)' 
                  }}
                >
                  {heroVariants[selectedHero].ctaText || 'Jetzt registrieren'}
                </Link>

                {/* Profil-Cluster */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <img
                        key={i}
                        src={`https://i.pravatar.cc/40?img=${i}`}
                        alt={`Profil ${i}`}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    + 500 weitere Pfleger
                  </span>
                </div>
              </div>

              {/* Trust Element - Sterne */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm md:text-base font-medium text-gray-700">
                  Bereits 5.000+ Handwerker, Pfleger und Servicekräfte dabei.
                </span>
              </div>
            </div>

            {/* Rechte Spalte - Bild ohne Gradient - Mobile: Bild nach Text */}
            <div className="order-2 lg:order-2 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative"
              >
                {/* Bild ohne Overlay */}
                <img 
                  src={heroVariants[selectedHero].image} 
                  alt="BeVisiblle – Menschen vernetzen sich" 
                  className="w-full h-auto object-cover max-w-full"
                  loading="eager"
                  fetchPriority="high"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Career Fields Section */}
      <CareerFieldsSection />


      {/* ABOUT Section (links Pill, rechts Text) */}
      <section id="about" className="mt-16 relative" style={{ zIndex: 1 }}>
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] items-start gap-6">
            {/* Links: Pill */}
            <div className="flex">
              <span className="inline-flex items-center rounded-full bg-white/80 backdrop-blur px-3 py-1 text-xs font-medium text-gray-700 shadow-sm border">
                Über BeVisib<span className="text-[#5170ff]">ll</span>e
              </span>
            </div>
            {/* Rechts: Text */}
            <div className="flex justify-end">
              <div className="max-w-xl text-right">
                <p className="text-gray-800 text-sm leading-relaxed">
                  Mit <span className="font-semibold">BeVisib<span className="text-[#5170ff]">ll</span>e</span> kannst du easy deinen Lebenslauf erstellen – dieser wird
                  direkt zu deinem Profil, wo du dich mit Freund:innen, Kolleg:innen oder Gleichgesinnten vernetzen,
                  austauschen und dein Wissen teilen kannst. Außerdem wirst du auf Jobs & Unternehmen aufmerksam und
                  kannst dich bewerben.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BeVisiblle Sections (So funktioniert's, Community, Testimonials, Newsletter) */}
      <BeVisiblleLandingSections onNewsletterSubmit={handleNewsletterSubmit} />

      {/* Preise für Unternehmen */}
      <section className="mt-16 relative" style={{ zIndex: 1 }}>
        <CompanyPricingSection />
      </section>

      {/* Footer */}
      <footer className="relative mt-16" style={{ zIndex: 1 }}>
        <div style={{ borderTop: '1px solid rgba(81,112,255,.08)' }}>
          <div className="mx-auto max-w-6xl px-4 pt-8 pb-10 relative">
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 2, background: 'linear-gradient(90deg, transparent, rgba(81,112,255,.15), rgba(124,58,237,.1), transparent)' }} />
            <div className="grid gap-10 md:grid-cols-4">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2">
                  <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" className="h-8 w-8 object-contain" />
                  <span className="text-lg font-semibold">
                    BeVisib<span className="text-primary">ll</span>e
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  BeVisible ist mehr als eine Jobplattform. Mit uns findest du Menschen, Chancen und Unternehmen, die zu dir passen. Vernetze dich, teile Erfahrungen und werde sichtbar für deinen Traumjob. 💙
                </p>
              </div>

              {/* Spalten */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Company</h4>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li><a className="hover:underline" href="#about">Über uns</a></li>
                  <li><a className="hover:underline" href="#community">Community</a></li>
                  <li><Link className="hover:underline" to="/company">Unternehmen</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Support</h4>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li><a className="hover:underline" href="#hilfe">Hilfe</a></li>
                  <li><a className="hover:underline" href="#feedback">Feedback</a></li>
                  <li><a className="hover:underline" href="#kontakt">Kontakt</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Rechtliches</h4>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li><Link className="hover:underline" to="/datenschutz">Datenschutz</Link></li>
                  <li><Link className="hover:underline" to="/impressum">Impressum</Link></li>
                  <li><Link className="hover:underline" to="/agb">AGB</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
              <p>© 2025 BeVisiblle. Alle Rechte vorbehalten.</p>
              <div className="flex items-center gap-4">
                <Link className="hover:underline" to="/datenschutz">Datenschutz</Link>
                <Link className="hover:underline" to="/impressum">Impressum</Link>
                <Link className="hover:underline" to="/agb">AGB</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
    </>
  );
}
