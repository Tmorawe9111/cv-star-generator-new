import React, { useEffect } from 'react';
import { ArrowRight, Users, Building2, MessageSquare, Sparkles, ShieldCheck, PhoneCall } from "lucide-react";
import { Link } from 'react-router-dom';
import Header from './marketing/Header';
import Footer from './marketing/Footer';
import CareerFieldsSection from './marketing/CareerFieldsSection';
import lebenslaufFeature from '@/assets/lebenslauf-feature.png';
import jobsFeature from '@/assets/jobs-feature.png';
import communityFeature from '@/assets/community-feature.png';

/*
 Landing Page – Lebenslauf Generator
 Tech: React + TailwindCSS
 Structure:
 1) Hero Header
 2) Brand/Unternehmensname
 3) FeatureCardsSection (8 Tiles)
 4) Produkt‑Showcase (User & Unternehmen)
 5) Dual Call‑to‑Action (beide Zielgruppen)
 6) Footer

 Notes:
 - Accent color uses inline style var --brand (default #5ce1e6)
*/

import { OrganizationStructuredData } from '@/components/seo/StructuredData';

export default function LandingPage() {
  // SEO Head Injection
  useEffect(() => {
    const site = "https://bevisiblle.de";
    const title = "BeVisiblle – Vernetze dich mit Kollegen & finde deinen passenden Arbeitgeber";
    const desc = "Vernetze dich mit Kollegen, tausche dich aus und werde von passenden Unternehmen kontaktiert. Dein Lebenslauf bildet die Grundlage für dein Profil – immer up-to-date.";
    const keywords = "Fachkräfte Netzwerk, Kollegen finden, Berufsnetzwerk, Lebenslauf Profil, Fachkräfte Community, Pflege Netzwerk, Handwerk Community, Industrie Kollegen, Karriere Netzwerk";
    const ogImage = site + "/lovable-uploads/logo-32x32.png";
    const head = document.head;
    const meta = (name: string, content: string, attr = "name") => {
      let el = head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    const link = (rel: string, href: string) => {
      let el = head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        head.appendChild(el);
      }
      el.href = href;
    };

    // Basic meta tags
    document.title = title;
    meta("description", desc);
    meta("keywords", keywords);
    meta("robots", "index,follow,max-image-preview:large");
    
    // Structured Data for Organization
    const organizationScript = document.createElement('script');
    organizationScript.type = 'application/ld+json';
    organizationScript.id = 'structured-data-organization';
    organizationScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'BeVisiblle',
      url: 'https://bevisiblle.de',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bevisiblle.de/lovable-uploads/logo-32x32.png',
        width: 512,
        height: 512
      },
      description: desc,
      foundingDate: '2024',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'DE',
        addressLocality: 'Deutschland'
      },
      areaServed: {
        '@type': 'Country',
        name: 'Deutschland'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        availableLanguage: ['German', 'Deutsch']
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://bevisiblle.de/stellenangebote?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    });
    
    // Remove existing script if present
    const existingOrgScript = document.getElementById('structured-data-organization');
    if (existingOrgScript) {
      existingOrgScript.remove();
    }
    head.appendChild(organizationScript);
    
    // WebSite Structured Data
    const websiteScript = document.createElement('script');
    websiteScript.type = 'application/ld+json';
    websiteScript.id = 'structured-data-website';
    websiteScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'BeVisiblle',
      url: 'https://bevisiblle.de',
      description: desc,
      inLanguage: 'de-DE',
      publisher: {
        '@type': 'Organization',
        name: 'BeVisiblle',
        logo: {
          '@type': 'ImageObject',
          url: 'https://bevisiblle.de/lovable-uploads/logo-32x32.png',
          width: 512,
          height: 512
        }
      },
      potentialAction: [
        {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://bevisiblle.de/stellenangebote?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        },
        {
          '@type': 'ReadAction',
          target: 'https://bevisiblle.de/blog'
        }
      ]
    });
    
    // Remove existing script if present
    const existingWebScript = document.getElementById('structured-data-website');
    if (existingWebScript) {
      existingWebScript.remove();
    }
    head.appendChild(websiteScript);
    meta("viewport", "width=device-width, initial-scale=1");
    link("canonical", site + "/");

    // Open Graph
    head.insertAdjacentHTML("beforeend", '<meta property="og:locale" content="de_DE">' + '<meta property="og:type" content="website">' + '<meta property="og:site_name" content="Ausbildungsbasis">' + '<meta property="og:title" content="' + title.replace(/"/g, '&quot;') + '">' + '<meta property="og:description" content="' + desc.replace(/"/g, '&quot;') + '">' + '<meta property="og:url" content="' + site + '/">' + '<meta property="og:image" content="' + ogImage + '">' + '<meta property="og:image:alt" content="Lebenslauf Generator für Ausbildung">');

    // Twitter Cards
    head.insertAdjacentHTML("beforeend", '<meta name="twitter:card" content="summary_large_image">' + '<meta name="twitter:title" content="' + title.replace(/"/g, '&quot;') + '">' + '<meta name="twitter:description" content="' + desc.replace(/"/g, '&quot;') + '">' + '<meta name="twitter:image" content="' + ogImage + '">');

    // JSON-LD Structured Data
    const jsonLd = [{
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Ausbildungsbasis",
      "url": site,
      "logo": site + "/images/step1-hero.jpg",
      "sameAs": ["https://www.linkedin.com/company/ausbildungsbasis"]
    }, {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": site,
      "name": "Ausbildungsbasis",
      "potentialAction": {
        "@type": "SearchAction",
        "target": site + "/suche?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }, {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Lebenslauf Generator (Lebenslauf Ausbildung)",
      "brand": {
        "@type": "Brand",
        "name": "Ausbildungsbasis"
      },
      "url": site + "/cv-generator",
      "description": "CV für Ausbildung in 5 Minuten: PDF, Profil, Direktkontakt zu Unternehmen.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      }
    }];
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    head.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header variant="talent" />
      
      {/* Career Fields Section - B2C */}
      <CareerFieldsSection />
      
      <main className="bg-black text-white w-full" style={{
        ['--brand' as any]: '#5ce1e6'
      }}>
        {/* Hero Section with Mobile Image - LCP Optimized */}
        <section className="hero-section relative overflow-hidden bg-black w-full">
          <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="mb-4 text-[color:var(--brand)] text-lg font-medium">
                  Hey, wir sind bevisible 👋
                </div>
                <h1 className="hero-title text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.95]">
                  Werde sichtbar
                </h1>
                <p className="hero-subtitle mt-6 text-zinc-300 text-lg max-w-xl">
                  Erstelle dein Profil anhand deines Lebenslaufes einfach und schnell. Vernetze dich mit anderen, 
                  tausche Erfahrungen aus und werde von Unternehmen gefunden – oder bewirb dich mit einem Klick.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link to="/cv-generator" className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold border border-[color:var(--brand)] text-[color:var(--brand)] bg-transparent hover:bg-[color:var(--brand)]/10">
                    Profil erstellen – kostenlos
                  </Link>
                  <Link to="#so-funktionierts" className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold border border-zinc-700 text-white hover:bg-zinc-900">
                    So funktioniert's
                  </Link>
                </div>
                <p className="mt-4 text-xs text-zinc-400">
                  *Dein Profil wird automatisch aus deinem Lebenslauf erstellt.
                </p>
              </div>
              <div className="relative lg:ml-8 mx-0">
                <picture>
                  <source srcSet="/lovable-uploads/hero-mobile-576x576.webp" type="image/webp" />
                  <img 
                    src="/lovable-uploads/hero-mobile-576x576.png" 
                    alt="CV Generator Mobile App" 
                    className="w-full max-w-md mx-auto lg:max-w-lg xl:max-w-xl transform lg:translate-x-8" 
                    width="576" 
                    height="576"
                    loading="eager"
                    fetchPriority="high"
                    style={{ maxWidth: '576px', height: 'auto' }}
                  />
                </picture>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <FeatureCardsSection />

        {/* "Mach keinen Lebenslauf – Mach Eindruck" Section */}
        <section id="cv-impression" className="py-16 bg-black w-full">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative lg:mr-8">
                <picture>
                  <source srcSet="/lovable-uploads/hero-mobile-576x576.webp" type="image/webp" />
                  <img 
                    src="/lovable-uploads/hero-mobile-576x576.png" 
                    alt="CV Generator Mobile App" 
                    className="w-full max-w-md mx-auto rounded-lg" 
                    width="576" 
                    height="576"
                    loading="lazy"
                  />
                </picture>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Mach keinen Lebenslauf – mach Eindruck
                </h2>
                <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
                  Lade deinen Lebenslauf hoch und erhalte ein vollständiges Profil, das überzeugt. 
                  Teile relevante Erfahrungen, Fähigkeiten und Nachweise – klar strukturiert und sofort einsatzbereit.
                </p>
                <Link 
                  to="/onboarding" 
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold border border-zinc-700 text-white hover:bg-zinc-900"
                >
                  Profil jetzt erstellen
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase */}
        <ProductShowcaseSection />

        {/* Dual Call‑to‑Action */}
        <section className="py-16 bg-black w-full">
          <div className="mx-auto max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl ring-1 ring-zinc-800 p-8 bg-zinc-900/40">
              <h3 className="text-2xl font-semibold">Bereit, dein Profil zu erstellen?</h3>
              <p className="mt-2 text-sm text-zinc-300">Starte kostenlos und werde von Unternehmen gefunden.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/onboarding" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold bg-[color:var(--brand)] text-black">Für Schüler, Azubis und Fachkräfte: Jetzt starten</Link>
              </div>
            </div>
            <div className="rounded-2xl ring-1 ring-zinc-800 p-8 bg-zinc-900/40">
              <h3 className="text-2xl font-semibold">Talente schneller finden</h3>
              <p className="mt-2 text-sm text-zinc-300">Registrieren Sie Ihr Unternehmen und schalten Sie passende Profile frei.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/unternehmen/onboarding" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold bg-white text-black">Unternehmen-Account erstellen</Link>
                <Link to="/auth" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold border border-zinc-700">Login</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

// --- FeatureCardsSection ---
export function FeatureCardsSection() {
  return (
    <section id="so-funktionierts" className="w-full bg-black text-white py-16">
      <div className="w-full px-4">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-12 text-center">
          Warum unser Portal genau richtig für Dich ist.
        </h2>

        {/* Masonry-style Grid inspired by the reference */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* CV in 5 Schritten - Large left card */}
          <article className="relative overflow-hidden rounded-2xl bg-zinc-900/90 ring-1 ring-zinc-800 lg:row-span-2 animate-fade-in hover-scale">
            <div className="absolute inset-0">
              <img 
                src={lebenslaufFeature} 
                alt="CV Lebenslauf Feature" 
                className="w-full h-full object-cover opacity-90"
                loading="lazy"
              />
            </div>
            <div className="relative p-6 md:p-8 h-full flex flex-col justify-end min-h-[300px] bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-white">CV in 5 Schritten</h3>
                <p className="mt-4 text-sm text-zinc-200/90 leading-relaxed">
                  Von Layout bis Profil in <strong>5 Minuten</strong>. Einfache
                  Eingabe, klare Struktur, perfekter Look – lade Ihn als PDF herunter,
                  oder erstelle dir ein Profil. Die weltweit schnellste Art, professionelle Lebensläufe zu erstellen und einen neuen Job zu finden.
                </p>
              </div>
            </div>
          </article>

          {/* Community - White card */}
          <article className="relative overflow-hidden rounded-2xl bg-white text-zinc-900 ring-1 ring-zinc-200 animate-fade-in hover-scale" style={{
          animationDelay: '0.1s'
        }}>
            <div className="absolute inset-0">
              <img 
                src={communityFeature} 
                alt="Community Feature" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </article>

          {/* Unternehmen - Dark card with subtle background */}
          <article className="relative rounded-2xl bg-zinc-900/70 ring-1 ring-zinc-800 animate-fade-in hover-scale overflow-hidden" style={{
          animationDelay: '0.2s'
        }}>
            <div className="absolute inset-0">
              <img 
                src={jobsFeature} 
                alt="Jobs Feature" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </article>

          {/* Gruppen - Brand color card */}
          <article className="rounded-2xl bg-[color:var(--brand)] p-6 text-black animate-fade-in hover-scale lg:row-span-2" style={{
          animationDelay: '0.3s'
        }}>
            <div className="flex items-center gap-2 text-black/80">
              <MessageSquare className="h-5 w-5" />
              <span className="uppercase tracking-wide text-xs font-semibold">Gruppen</span>
            </div>
            <h3 className="mt-2 text-xl font-semibold">Tritt Gruppen bei & teile Lernhilfe mit anderen</h3>
            <p className="mt-3 text-sm leading-relaxed">
              Tritt Gruppen bei, lerne von anderen oder hilf mit. Teile
              Dokumente wie Lernzettel für Klausuren und diskutiere in
              kleinen Runden über deine relevante Themen von aktuellen Themen bis hin zur Prüfungsvorbereitungen.
            </p>
          </article>

          {/* AI-Powered CV - New 9th feature */}
          <article className="relative rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-6 text-white animate-fade-in hover-scale overflow-hidden" style={{
          animationDelay: '0.8s'
        }}>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
            <div className="relative">
              <div className="flex items-center gap-2 text-white/90">
                <Sparkles className="h-5 w-5" />
                <span className="uppercase tracking-wide text-xs font-semibold">KI-Powered</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold">Smart CV</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/90">
                KI optimiert automatisch deinen CV für verschiedene Branchen und deinen Wünschen.
              </p>
            </div>
          </article>

          {/* 360° - Large bottom card */}
          <article className="relative rounded-2xl bg-zinc-900/90 ring-1 ring-zinc-800 p-6 md:p-8 lg:col-span-2 animate-fade-in hover-scale overflow-hidden" style={{
          animationDelay: '0.4s'
        }}>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
            <div className="relative">
              <div className="text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-4">360°</div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Recruiting & Employer Branding</h3>
              <p className="text-sm text-zinc-200/90 leading-relaxed max-w-lg">
                Vollständige Recruiting-Lösung: Von der Kandidatensuche über Bewerbermanagement bis hin zu Employer Branding. 
                Alles in einer Plattform, die Unternehmen und Talente intelligent zusammenbringt.
              </p>
            </div>
          </article>

          {/* Sicherheit - Security card */}
          <article className="relative rounded-2xl bg-emerald-600 p-6 text-white animate-fade-in hover-scale overflow-hidden" style={{
          animationDelay: '0.5s'
        }}>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
            <div className="relative">
              <div className="flex items-center gap-2 text-white/90">
                <ShieldCheck className="h-5 w-5" />
                <span className="uppercase tracking-wide text-xs font-semibold">Sicherheit</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold">DSGVO & Datenschutz</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/90">
                Höchste Sicherheitsstandards, Server in Deutschland, volle DSGVO-Konformität.
              </p>
            </div>
          </article>

          {/* Support - Support card */}
          <article className="relative rounded-2xl bg-orange-600 p-6 text-white animate-fade-in hover-scale overflow-hidden" style={{
          animationDelay: '0.6s'
        }}>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1553484771-371a605b060b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
            <div className="relative">
              <div className="flex items-center gap-2 text-white/90">
                <PhoneCall className="h-5 w-5" />
                <span className="uppercase tracking-wide text-xs font-semibold">Support</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold">Persönlicher Support</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/90">
                Unser Team steht dir bei Fragen zur Seite – per Chat, E-Mail oder Telefon.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

// --- ProductShowcaseSection ---
export function ProductShowcaseSection() {
  return (
    <section id="produkt" className="w-full bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-12 text-center">
          So sieht unser Portal aus
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Talents */}
          <div className="relative group">
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900/40 ring-1 ring-zinc-800">
              <div className="aspect-[16/10] relative">
                <picture>
                  <source srcSet="/lovable-uploads/feed-interface-532x332.webp" type="image/webp" />
                  <img 
                    src="/lovable-uploads/feed-interface-532x332.png" 
                    alt="Portal Feed Interface für Azubis und Fachkräfte" 
                    className="h-full w-full object-cover" 
                    loading="lazy"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-semibold text-white mb-2">Für Azubis & Fachkräfte</h3>
                  <p className="text-sm text-zinc-200">Community-Feed, Networking und direkte Jobchancen in einem Portal.</p>
                </div>
              </div>
            </div>
          </div>

          {/* For Companies */}
          <div className="relative group">
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900/40 ring-1 ring-zinc-800">
              <div className="aspect-[16/10] relative">
                <picture>
                  <source srcSet="/lovable-uploads/search-interface-532x332.webp" type="image/webp" />
                  <img 
                    src="/lovable-uploads/search-interface-532x332.png" 
                    alt="Kandidatensuche Interface für Unternehmen" 
                    className="h-full w-full object-cover" 
                    loading="lazy"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-semibold text-white mb-2">Für Unternehmen</h3>
                  <p className="text-sm text-zinc-200">Intelligente Kandidatensuche mit Filtern, Matching und direktem Kontakt.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}