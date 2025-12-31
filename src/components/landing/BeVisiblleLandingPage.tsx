import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SmartInteractions from '@/components/landing/SmartInteractions';
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
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Header */}
      <header className="fixed top-4 left-0 right-0 z-50">
        <nav className="mx-auto max-w-5xl px-4">
          <div className="bg-white/90 backdrop-blur rounded-full shadow-sm border px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              {/* Left: Logo */}
              <Link to="/" className="flex items-center gap-2 pl-1">
                <div className="flex items-center gap-2">
                  <img src="/assets/Logo_visiblle-2.svg" alt="BeVisiblle" className="h-8 w-8" />
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
      <section className="relative pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4">
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
                    <span className="whitespace-nowrap">Das Karrierenetzwerk</span><br />
                    <span className="text-[#2563eb]">für Pflege, Handwerk</span><br />
                    <span className="text-[#2563eb]">& alle, die anpacken.</span>
                  </>
                ) : (
                  <>
                    {heroVariants[selectedHero].headline}
                    {heroVariants[selectedHero].headlineExtra && (
                      <span className="whitespace-nowrap"> {heroVariants[selectedHero].headlineExtra}</span>
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
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
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

      {/* Career Fields Section - B2C */}
      <CareerFieldsSection />


      {/* ABOUT Section (links Pill, rechts Text) */}
      <section id="about" className="mt-16">
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

      {/* Community & Connection Section - Dynamisch & Vernetzt */}
      <section className="mt-20 py-20 relative overflow-hidden">
        {/* Radial Gradient Hintergrund */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)'
          }}
        />
        
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          {/* Text zuerst auf Mobile */}
          <div className="text-center mb-12 md:mb-16 order-1">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Mehr als nur Jobs. Dein Netzwerk.
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Verbinde dich direkt mit Arbeitgebern und Kollegen. Keine Barrieren, einfach echter Austausch.
            </p>
          </div>
          
          {/* Zentriertes Layout mit Handy und Floating Elements - Bild nach Text auf Mobile */}
          <div className="relative flex items-center justify-center min-h-[600px] order-2">
            {/* Zentriertes Smartphone Mockup */}
            <div className="relative z-20">
              <div className="w-[280px] md:w-[320px] mx-auto">
                <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-white rounded-[2.5rem] overflow-hidden">
                    <img 
                      src="/assets/screenshot-feed.png" 
                      alt="BeVisible App - Feed" 
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements - Links */}
            <div className="absolute left-0 md:left-10 top-1/2 -translate-y-1/2 z-10">
              <div className="relative">
                {/* Avatar 1 - Profilbild */}
                <img
                  src="https://i.pravatar.cc/80?img=12"
                  alt="Community Member"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-xl border-4 border-white object-cover mb-4 animate-float"
                />
                {/* Verbindungslinie mit Chat-Bubble */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4">
                  <div className="w-24 md:w-32 h-0.5 bg-gradient-to-r from-blue-400 to-transparent" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements - Rechts */}
            <div className="absolute right-0 md:right-10 top-1/2 -translate-y-1/2 z-10">
              <div className="relative">
                {/* Avatar 2 - Profilbild */}
                <img
                  src="https://i.pravatar.cc/80?img=33"
                  alt="Community Member"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-xl border-4 border-white object-cover mb-4 animate-float-delayed"
                />
                {/* Verbindungslinie mit Chat-Bubble */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4">
                  <div className="w-24 md:w-32 h-0.5 bg-gradient-to-l from-purple-400 to-transparent" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Weitere Floating Avatare - Oben */}
            <div className="absolute left-1/2 -translate-x-1/2 top-10 md:top-20 z-10">
              <img
                src="https://i.pravatar.cc/64?img=47"
                alt="Community Member"
                className="w-12 h-12 md:w-16 md:h-16 rounded-full shadow-xl border-4 border-white object-cover animate-float-slow"
              />
            </div>

            {/* Weitere Floating Avatare - Unten */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-10 md:bottom-20 z-10">
              <img
                src="https://i.pravatar.cc/64?img=68"
                alt="Community Member"
                className="w-12 h-12 md:w-16 md:h-16 rounded-full shadow-xl border-4 border-white object-cover animate-float-slow-delayed"
              />
            </div>

            {/* Zusätzliche Avatare für mehr Gesichter - Links oben */}
            <div className="absolute left-10 md:left-20 top-20 md:top-32 z-10">
              <img
                src="https://i.pravatar.cc/56?img=25"
                alt="Community Member"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg border-3 border-white object-cover animate-float"
              />
            </div>

            {/* Zusätzliche Avatare - Rechts unten */}
            <div className="absolute right-10 md:right-20 bottom-20 md:bottom-32 z-10">
              <img
                src="https://i.pravatar.cc/56?img=51"
                alt="Community Member"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg border-3 border-white object-cover animate-float-delayed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Alte App Screenshots Section - ENTFERNT */}
      <section className="hidden mt-20 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              So funktioniert BeVisiblle
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Entdecke die Features, die deine Karriere voranbringen
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bild 2: Feed-Ansicht (Community) */}
            <div className="relative group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200 transition-all duration-500 hover:shadow-2xl">
                <div className="aspect-[9/16] relative">
                  <img 
                    src="/assets/screenshot-feed.png" 
                    alt="Community Feed - Vernetze dich mit Kolleg:innen" 
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:opacity-20 group-hover:blur-sm"
                    loading="eager"
                    fetchPriority="high"
                  />
                  {/* Text Overlay - erscheint bei Hover */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-br from-blue-600/95 to-blue-700/95">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">Community Feed</h3>
                    <p className="text-base md:text-lg text-white/95 text-center leading-relaxed max-w-sm">
                      Vernetze dich mit Kolleg:innen aus deiner Branche, teile deine Erfahrungen und lerne von anderen. 
                      Entdecke relevante Posts, kommentiere und baue dein berufliches Netzwerk auf.
                    </p>
                    <ul className="mt-6 space-y-2 text-sm text-white/90">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        Posts von Unternehmen und Kolleg:innen
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        Direkte Interaktionen und Kommentare
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        Personalisierter Feed basierend auf deinen Interessen
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Bild 3: Profil-Ansicht mit Lebenslauf */}
            <div className="relative group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200 transition-all duration-500 hover:shadow-2xl">
                <div className="aspect-[9/16] relative">
                  <img 
                    src="/assets/screenshot-profile.png" 
                    alt="Profil mit Lebenslauf - Zeige deine Fähigkeiten" 
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:opacity-20 group-hover:blur-sm"
                    loading="eager"
                    fetchPriority="high"
                  />
                  {/* Text Overlay - erscheint bei Hover */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-br from-blue-600/95 to-blue-700/95">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">Dein Profil</h3>
                    <p className="text-base md:text-lg text-white/95 text-center leading-relaxed max-w-sm">
                      Zeige deine gesamte berufliche Laufbahn auf einen Blick. Dein Lebenslauf wird automatisch 
                      zu einem interaktiven Profil, das Unternehmen und Kolleg:innen sehen können.
                    </p>
                    <ul className="mt-6 space-y-2 text-sm text-white/90">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        Automatisch generierter Lebenslauf
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        Fähigkeiten und Sprachen übersichtlich dargestellt
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        Verlinkung zu Unternehmen und Schulen
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Bild 1: Bewerbungsübersicht */}
            <div className="relative group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200 transition-all duration-500 hover:shadow-2xl">
                <div className="aspect-[9/16] relative">
                  <img 
                    src="/assets/screenshot-applications.png" 
                    alt="Meine Bewerbungen - Verwalte deine Jobanfragen" 
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:opacity-20 group-hover:blur-sm"
                    loading="eager"
                    fetchPriority="high"
                  />
                  {/* Text Overlay - erscheint bei Hover */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-br from-blue-600/95 to-blue-700/95">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">Meine Bewerbungen</h3>
                    <p className="text-base md:text-lg text-white/95 text-center leading-relaxed max-w-sm">
                      Verwalte alle deine Jobanfragen und Bewerbungen an einem zentralen Ort. 
                      Sieh auf einen Blick, welche Unternehmen sich für dich interessieren.
                    </p>
                    <ul className="mt-6 space-y-2 text-sm text-white/90">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        Übersicht aller Bewerbungen und Anfragen
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        Status-Tracking (Beworben, Gespräch, Entscheidung)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        Direkte Kommunikation mit Unternehmen
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Zig-Zag Layout für Nutzer */}
      <section className="mt-20 py-20">
        <div className="mx-auto max-w-7xl px-4">
          {/* Reihe 1: Text links, Bild rechts - Mobile: Text zuerst */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center mb-20">
            <div className="order-1 md:order-1">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Dein Profil in 5 Minuten.
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Vergiss komplizierte Word-Vorlagen. Beantworte ein paar Fragen und wir erstellen deinen perfekten Lebenslauf automatisch.
              </p>
            </div>
            <div className="order-2 md:order-2 flex justify-center md:justify-end">
              <div className="w-full max-w-2xl space-y-6">
                {/* Teil 1: Mehrere CVs */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-xl">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">Wähle dein Layout</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* CV 1 */}
                    <div className="bg-white rounded-lg shadow-md p-2 aspect-[3/4] overflow-hidden border-2 border-blue-200">
                      <div className="h-full bg-gradient-to-b from-blue-100 to-blue-50 rounded flex flex-col">
                        <div className="h-3 bg-blue-500 rounded mb-2"></div>
                        <div className="flex-1 space-y-1 px-1">
                          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                    {/* CV 2 */}
                    <div className="bg-white rounded-lg shadow-md p-2 aspect-[3/4] overflow-hidden border-2 border-purple-200">
                      <div className="h-full bg-gradient-to-b from-purple-100 to-purple-50 rounded flex flex-col">
                        <div className="h-3 bg-purple-500 rounded mb-2"></div>
                        <div className="flex-1 space-y-1 px-1">
                          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                    {/* CV 3 */}
                    <div className="bg-white rounded-lg shadow-md p-2 aspect-[3/4] overflow-hidden border-2 border-green-200">
                      <div className="h-full bg-gradient-to-b from-green-100 to-green-50 rounded flex flex-col">
                        <div className="h-3 bg-green-500 rounded mb-2"></div>
                        <div className="flex-1 space-y-1 px-1">
                          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                    {/* CV 4 */}
                    <div className="bg-white rounded-lg shadow-md p-2 aspect-[3/4] overflow-hidden border-2 border-orange-200">
                      <div className="h-full bg-gradient-to-b from-orange-100 to-orange-50 rounded flex flex-col">
                        <div className="h-3 bg-orange-500 rounded mb-2"></div>
                        <div className="flex-1 space-y-1 px-1">
                          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-full"></div>
                          <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teil 2: Fertiges Profil aus dem Netzwerk */}
                <div className="rounded-2xl bg-white shadow-xl border-2 border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                    <h4 className="text-sm font-semibold text-white text-center">Dein fertiges Profil im Netzwerk</h4>
                  </div>
                  <div className="p-4">
                    {/* Profil-Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src="https://i.pravatar.cc/64?img=13"
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                      />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-800 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-400 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded w-20"></div>
                      </div>
                    </div>
                    {/* Profil-Inhalt */}
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="flex gap-2 mt-4">
                        <div className="flex-1 h-20 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-center">
                          <div className="text-center">
                            <div className="h-4 bg-blue-500 rounded w-16 mx-auto mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-12 mx-auto"></div>
                          </div>
                        </div>
                        <div className="flex-1 h-20 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-center">
                          <div className="text-center">
                            <div className="h-4 bg-purple-500 rounded w-16 mx-auto mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-12 mx-auto"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reihe 2: Text links, Bild rechts - Mobile: Text zuerst */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center mb-20">
            <div className="order-1 md:order-2">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Chatten statt Bewerben.
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Du hast eine Frage zum Job? Schreib dem Unternehmen einfach direkt über den Messenger. Schnell, unkompliziert, persönlich.
              </p>
            </div>
            <div className="order-2 md:order-1 flex justify-center md:justify-start">
              <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 p-8 shadow-xl">
                <div className="aspect-square bg-white rounded-xl shadow-lg flex items-center justify-center p-6">
                  <div className="space-y-4 w-full">
                    {/* Chat-Bubble 1 mit Profilbild */}
                    <div className="flex justify-end items-start gap-2">
                      <img
                        src="https://i.pravatar.cc/32?img=15"
                        alt="User"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[75%]">
                        <p className="text-sm">Hallo, ich habe eine Frage zum Job...</p>
                      </div>
                    </div>
                    {/* Chat-Bubble 2 mit Profilbild */}
                    <div className="flex justify-start items-start gap-2">
                      <img
                        src="https://i.pravatar.cc/32?img=22"
                        alt="Company"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[75%]">
                        <p className="text-sm">Gerne! Was möchtest du wissen?</p>
                      </div>
                    </div>
                    {/* Chat-Bubble 3 mit Profilbild */}
                    <div className="flex justify-end items-start gap-2">
                      <img
                        src="https://i.pravatar.cc/32?img=15"
                        alt="User"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[75%]">
                        <p className="text-sm">Wie sind die Arbeitszeiten?</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reihe 3: Text links, Bild rechts - Mobile: Text zuerst */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="order-1 md:order-1">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Wissen teilen & wachsen.
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Tausche dich im Feed mit anderen aus deiner Branche aus. Hol dir Tipps für Gehalt, Weiterbildung und Alltag.
              </p>
            </div>
            <div className="order-2 md:order-2 flex justify-center md:justify-end">
              <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-8 shadow-xl">
                <div className="aspect-square bg-white rounded-xl shadow-lg flex items-center justify-center p-6 relative">
                  <div className="grid grid-cols-3 gap-3 w-full">
                    {/* Avatar-Gruppe mit echten Profilbildern */}
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src="https://i.pravatar.cc/64?img=11"
                        alt="Community Member"
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      <img
                        src="https://i.pravatar.cc/48?img=28"
                        alt="Community Member"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md -ml-4"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src="https://i.pravatar.cc/56?img=35"
                        alt="Community Member"
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      <img
                        src="https://i.pravatar.cc/40?img=42"
                        alt="Community Member"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md -mr-4"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src="https://i.pravatar.cc/48?img=19"
                        alt="Community Member"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md -ml-4"
                      />
                      <img
                        src="https://i.pravatar.cc/64?img=7"
                        alt="Community Member"
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    </div>
                  </div>
                  {/* Feed-Icon oben */}
                  <div className="absolute top-4 right-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Card */}
      <section className="mt-16 mb-8">
        <div className="mx-auto max-w-5xl px-4">
          <div 
            className="rounded-2xl shadow-lg border bg-[#5170ff] text-white px-6 py-8 md:px-10 md:py-10"
            style={{ boxShadow: '0 10px 30px rgba(81,112,255,0.25)' }}
          >
            <div className="grid gap-6 md:grid-cols-[1.1fr,1fr] items-center">
              {/* Left: Copy */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold">Abonniere unseren Newsletter</h3>
                <p className="mt-2 text-white/90">
                  Updates zu Community, neuen Funktionen & passenden Jobs – direkt in dein Postfach.
                </p>
              </div>
              {/* Right: Form */}
              <form className="flex w-full items-center gap-3" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  required
                  placeholder="Deine E-Mail"
                  className="w-full rounded-full bg-white text-gray-900 placeholder:text-gray-500 px-4 py-3 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-white/70"
                />
                <button
                  type="submit"
                  className="rounded-full bg-white text-[#5170ff] px-5 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition"
                >
                  Abonnieren
                </button>
              </form>
            </div>
            <p className="mt-3 text-xs text-white/80">
              Du kannst dich jederzeit abmelden. Weitere Infos in unserer Datenschutzerklärung.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mt-16">
        <div className="border-t">
          <div className="mx-auto max-w-6xl px-4 pt-8 pb-10">
            <div className="grid gap-10 md:grid-cols-4">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2">
                  <img src="/assets/Logo_visiblle-2.svg" alt="BeVisiblle" className="h-8 w-8 object-contain" />
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
                  <li><a className="hover:underline" href="#netzwerk">Community</a></li>
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
