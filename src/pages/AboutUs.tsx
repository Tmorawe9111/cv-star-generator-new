import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { trackCalendlyClick, trackPageView } from "@/lib/telemetry";

type CalendlyWidget = {
  initPopupWidget: (options: { url: string }) => void;
};

declare global {
  interface Window {
    Calendly?: CalendlyWidget;
  }
}

import toddMoraweImage from "@/assets/todd-morawe.jpeg";
import tomMoraweImage from "@/assets/tom-morawe.jpeg";
import aiMasterImage from "@/assets/ai-master.png";
import emmaMoraweImage from "@/assets/emma-morawe.jpg";

const teamMembers = [
  {
    name: "Todd Morawe",
    role: "Co-Founder & CEO",
    description: "Strategy, Operations und Produkt",
    image: toddMoraweImage,
    linkedin: "https://www.linkedin.com/in/toddmorawe/"
  },
  {
    name: "AI Master",
    role: "Co-Founder & Tech",
    description: "Verantwortung Plattform & Matching-Algorithmen",
    image: aiMasterImage,
    linkedin: ""
  },
  {
    name: "Tom Morawe",
    role: "Co-Founder & CRO",
    description: "Chief Revenue Officer",
    image: tomMoraweImage,
    linkedin: "https://www.linkedin.com/in/tommorawe/"
  },
  {
    name: "Emma Morawe",
    role: "Marketing",
    description: "Gute Laune & Marketing",
    image: emmaMoraweImage,
    linkedin: ""
  }
];

export default function AboutUs() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const openCalendly = (buttonLabel: string = 'Demo buchen') => {
    trackCalendlyClick(buttonLabel, 'About Us');
    window.open('https://calendly.com/todd-bevisiblle/gettoknowbeviviblle', '_blank', 'noopener,noreferrer');
  };

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("Newsletter-Anmeldung erfolgreich!");
  };

  useEffect(() => {
    // Track page view
    trackPageView('About Us');
    
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const totalMembers = teamMembers.length;
  const visibleCount = Math.min(3, totalMembers);
  const visibleMembers = Array.from({ length: visibleCount }, (_, i) => teamMembers[(startIndex + i) % totalMembers]);

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + totalMembers) % totalMembers);
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % totalMembers);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <header className="fixed top-4 left-0 right-0 z-50">
        <nav className="mx-auto max-w-5xl px-4">
          <div className="bg-white/90 backdrop-blur rounded-full shadow-sm border px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <Link to="/" className="flex items-center gap-2 pl-1">
                <img src="/assets/Logo_visiblle-2.svg" alt="BeVisiblle" className="h-8 w-8" />
                <span className="font-semibold text-base">
                  BeVisib<span className="text-primary">ll</span>e
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link to="/cv-generator" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Lebenslauf
                </Link>
                <Link to="/company" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Unternehmen
                </Link>
                <Link to="/unternehmensregistrierung" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Registrieren
                </Link>
                <Link to="/about" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Über uns
                </Link>
              </nav>

              <div className="flex items-center gap-2">
                <Link to="/auth" className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Login
                </Link>
                <button
                  onClick={() => openCalendly('Demo buchen (Header)')}
                  className="hidden sm:inline-flex rounded-full bg-[#5170ff] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-300 transition hover:bg-[#3f5bff]"
                >
                  Demo buchen
                </button>
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

          <div className={`${isMobileMenuOpen ? "block" : "hidden"} md:hidden mx-4 mt-2 bg-white/90 backdrop-blur rounded-lg shadow-sm border px-4 py-2`}>
            <Link to="/cv-generator" className="block py-2 text-gray-700 hover:text-gray-900">
              Lebenslauf
            </Link>
            <Link to="/company" className="block py-2 text-gray-700 hover:text-gray-900">
              Unternehmen
            </Link>
            <Link to="/about" className="block py-2 font-semibold text-[#5170ff]">
              Über uns
            </Link>
            <Link to="/auth" className="block py-2 text-gray-700 hover:text-gray-900">
              Login
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-20 pb-16">
        <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 md:flex-row md:items-center">
          <div className="flex-1 space-y-6">
            <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-medium text-[#5170ff] shadow border border-[#5170ff]/20">
              Das Team hinter BeVisiblle
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Wir verbinden Menschen mit Perspektive und Herz
            </h1>
            <p className="text-base md:text-lg text-slate-600">
              BeVisiblle ist aus der Überzeugung entstanden, dass Talente und Unternehmen echte Einblicke brauchen, um zueinander zu finden. Was als Idee zweier Brüder begann, ist heute eine Community aus Azubis, Fachkräften und Teams, die gemeinsam sichtbar werden.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => openCalendly('Gespräch buchen')}
                className="inline-flex items-center gap-2 rounded-full bg-[#5170ff] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-300 transition hover:bg-[#3f5bff]"
              >
                Gespräch buchen
              </button>
              <Link
                to="/unternehmensregistrierung"
                className="inline-flex items-center rounded-full border border-[#5170ff]/40 bg-white px-5 py-3 text-sm font-semibold text-[#5170ff] shadow-sm transition hover:border-[#5170ff]"
              >
                Unternehmen registrieren
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative overflow-hidden rounded-[36px]">
              <img
                src="/assets/aboutus-hero.png"
                alt="Tobias und Todd Morawe"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0f172a]/35 via-transparent to-transparent" />
            </div>
          </div>
        </section>

        <section className="mt-16 mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-medium text-[#5170ff] shadow border border-[#5170ff]/20">
            Unsere Story
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900">Vom Familienbetrieb zur Talent-Community</h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Aufgewachsen in einem handwerklich geprägten Umfeld haben wir früh verstanden, wie schwierig es ist, passende Talente zu finden und langfristig zu halten. 2023 beschlossen wir, eine Plattform zu schaffen, die Menschen zeigt – mit ihrer Geschichte, ihrem Können und ihrer Motivation. Heute begleitet BeVisiblle Unternehmen dabei, ihre Teams sichtbar zu machen und Talente authentisch anzusprechen.
          </p>
        </section>

        <section className="mt-20 px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-medium text-[#5170ff] shadow border border-[#5170ff]/20">
                Meet our Team
              </span>
              <h3 className="mt-4 text-3xl font-semibold text-slate-900">Gesichter, die BeVisiblle prägen</h3>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-2xl text-sm text-slate-500">
                Unser Kernteam vereint Recruiting, Community und Produktentwicklung. Drei Gesichter auf einen Blick – und per Klick lernst du alle kennen.
              </p>
              <button
                onClick={() => openCalendly('Get in Touch')}
                className="inline-flex items-center gap-2 rounded-full bg-[#5170ff] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(81,112,255,0.25)] transition hover:bg-[#3f5bff]"
              >
                Get in Touch
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative mt-12">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
              <button
                onClick={handlePrev}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#5170ff]/30 bg-white text-[#5170ff] shadow-sm transition hover:bg-[#5170ff] hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex flex-1 justify-center gap-10">
                {visibleMembers.map((member, index) => (
                  <div key={`${member.name}-${index}`} className="relative w-[320px]">
                    <div
                      className={cn(
                        'group relative flex h-[440px] flex-col overflow-hidden rounded-[36px] border border-white/60 bg-white/95 shadow-[0_22px_65px_rgba(81,112,255,0.18)] transition-transform duration-500',
                        index === 1 ? 'hover:rotate-0' : index === 0 ? '-rotate-2 hover:rotate-0' : 'rotate-2 hover:rotate-0'
                      )}
                    >
                      <div className="absolute -left-6 top-6 h-12 w-12 rounded-full bg-[#5170ff]/15 blur-xl" />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#5170ff]/8 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

                      <div className="h-[280px] overflow-hidden">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-between px-7 py-6">
                        <div className="space-y-3">
                          <span className="inline-flex items-center rounded-full bg-[#5170ff]/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#5170ff]">
                            {member.role}
                          </span>
                          <h4 className="text-2xl font-semibold text-slate-900">{member.name}</h4>
                          <p className="text-sm leading-relaxed text-slate-600">{member.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
                          <span>BeVisiblle</span>
                          {member.linkedin && (
                            <div className="flex items-center gap-2 text-[#5170ff]">
                              <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#5170ff]/30 bg-white text-[#5170ff] transition hover:bg-[#5170ff] hover:text-white"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M4.983 3.5C4.983 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.983 2.12 4.983 3.5zM.249 8.25h4.502V24H.249V8.25zM8.497 8.25h4.318v2.136h.062c.602-1.14 2.074-2.344 4.266-2.344 4.56 0 5.405 3.002 5.405 6.906V24h-4.5v-6.874c0-1.64-.03-3.746-2.285-3.746-2.29 0-2.64 1.79-2.64 3.637V24h-4.5V8.25z" />
                                </svg>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNext}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#5170ff]/30 bg-white text-[#5170ff] shadow-sm transition hover:bg-[#5170ff] hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-500" />
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-[#5170ff] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(81,112,255,0.25)] transition hover:bg-[#3f5bff]"
              >
                Unser Team entdecken
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-8 flex justify-center gap-2">
              {teamMembers.map((_, idx) => {
                const isActive = idx === startIndex;
                return (
                  <button
                    key={`dot-${idx}`}
                    onClick={() => setStartIndex(idx)}
                    className={cn(
                      'h-2.5 rounded-full transition-all duration-300',
                      isActive ? 'w-8 bg-[#5170ff]' : 'w-2.5 bg-[#cfd6ff] hover:bg-[#aebcff]'
                    )}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-16 mb-8">
          <div className="mx-auto max-w-5xl px-4">
            <div
              className="rounded-2xl shadow-lg border bg-[#5170ff] text-white px-6 py-8 md:px-10 md:py-10"
              style={{ boxShadow: '0 10px 30px rgba(81,112,255,0.25)' }}
            >
              <div className="grid gap-6 md:grid-cols-[1.1fr,1fr] items-center">
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold">Abonniere unseren Newsletter</h3>
                  <p className="mt-2 text-white/90">
                    Updates zu Community, neuen Funktionen & passenden Jobs – direkt in dein Postfach.
                  </p>
                </div>
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

        <footer className="relative mt-16">
          <div className="border-t">
            <div className="mx-auto max-w-6xl px-4 pt-8 pb-10">
              <div className="grid gap-10 md:grid-cols-4">
                <div>
                <div className="flex items-center gap-2">
                  <img src="/assets/Logo_visiblle-2.svg" alt="BeVisiblle" className="h-8 w-8" />
                  <span className="font-semibold">
                    BeVisib<span className="text-primary">ll</span>e
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  BeVisible ist mehr als eine Jobplattform. Mit uns findest du Menschen, Chancen und Unternehmen, die zu dir passen. Vernetze dich, teile Erfahrungen und werde sichtbar für deinen Traumjob. 💙
                </p>
                </div>
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
      </main>
    </div>
  );
}
