import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SmartInteractions from '@/components/landing/SmartInteractions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check } from 'lucide-react';
import { trackCalendlyClick, trackPageView } from '@/lib/telemetry';
import { COMPANY_PRICING_TIERS } from '@/config/companyPricing';

type CalendlyWidget = {
  initPopupWidget: (options: { url: string }) => void;
};

declare global {
  interface Window {
    Calendly?: CalendlyWidget;
  }
}

type BillingCycle = 'monthly' | 'yearly';

const faqs = [
  {
    question: 'Was sind Tokens und wie funktionieren sie?',
    answer: 'Tokens ermöglichen es Ihnen, vollständige Profile freizuschalten und direkt mit qualifizierten Fachkräften in Kontakt zu treten. Jedes freigeschaltete Profil kostet 1 Token.'
  },
  {
    question: 'Wie unterscheiden sich die Pläne?',
    answer: 'Der Base-Plan eignet sich für kleinere Unternehmen mit bis zu 20 Neueinstellungen pro Jahr. Der Pro-Plan bietet AI-Matching und mehr Tokens für wachsende Teams. Enterprise ist für große Unternehmen mit unbegrenzten Ressourcen.'
  },
  {
    question: 'Was bedeutet "vollständige und verifizierte Profile"?',
    answer: 'Alle Profile auf BeVisiblle werden durch unseren Lebenslauf-Generator erstellt, wodurch sie standardisiert, vollständig und verifiziert sind. Sie erhalten nur qualitativ hochwertige Kandidatenprofile.'
  },
  {
    question: 'Wie funktioniert Employee Branding?',
    answer: 'Ihre Mitarbeiter können in der Community aktiv sein, Beiträge teilen und so organisch Aufmerksamkeit auf Ihr Unternehmen lenken. Dies stärkt Ihre Arbeitgebermarke und zieht passende Talente an.'
  },
  {
    question: 'Gibt es eine Vertragsbindung?',
    answer: 'Bei monatlicher Zahlung können Sie jederzeit kündigen. Bei jährlicher Zahlung profitieren Sie von erheblichen Rabatten und zahlen etwa 11 Monatspreise für 12 Monate.'
  },
  {
    question: 'Wie schnell kann ich starten?',
    answer: 'Nach der Registrierung und Auswahl Ihres Plans haben Sie sofort Zugang zur Plattform und können mit der Suche nach qualifizierten Fachkräften beginnen.'
  }
];

export default function CompanyLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const openCalendly = (buttonLabel: string = 'Demo buchen') => {
    trackCalendlyClick(buttonLabel, 'Company Landing');
    window.open('https://calendly.com/todd-bevisiblle/gettoknowbeviviblle', '_blank', 'noopener,noreferrer');
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Newsletter-Anmeldung erfolgreich!');
  };

  useEffect(() => {
    // Track page view
    trackPageView('Company Landing');
    
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Scroll to pricing when hash is #pricing (on mount or hash change)
  useEffect(() => {
    const scrollToPricing = () => {
      if (window.location.hash === '#pricing') {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    scrollToPricing();
    window.addEventListener('hashchange', scrollToPricing);
    return () => window.removeEventListener('hashchange', scrollToPricing);
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <header className="fixed top-4 left-0 right-0 z-50">
        <nav className="mx-auto max-w-5xl px-4">
          <div className="bg-white/90 backdrop-blur rounded-full shadow-sm border px-3 py-2 h-14">
            <div className="flex items-center justify-between gap-2 h-full">
              <Link to="/" className="flex items-center gap-2 pl-1">
                <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" className="h-8 w-8 object-contain" />
                <span className="font-semibold text-base">
                  BeVisib<span className="text-primary">ll</span>e
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link to="/cv-generator" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Lebenslauf
                </Link>
                <Link to="/company" className="rounded-md px-3 py-2 text-sm font-medium text-[#5170ff] hover:bg-blue-50">
                  Unternehmen
                </Link>
                <Link to="/company#pricing" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Preise
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
            <Link to="/company" className="block py-2 font-semibold text-[#5170ff]">
              Unternehmen
            </Link>
            <Link to="/company#pricing" className="block py-2 text-gray-700 hover:text-gray-900">
              Preise
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

      <section className="relative pt-32 pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              <span className="text-[#5170ff]">BeVisiblle</span>
              <span className="text-4xl md:text-5xl font-semibold text-gray-900"> – das Netzwerk, das Ihr Unternehmen ins Gespräch bringt.</span>
            </h1>
            <p className="mt-4 text-lg md:text-2xl text-gray-800">
              Ob Azubi, Fachkraft oder Führungskraft – mit BeVisiblle vernetzen sich Ihre Mitarbeiter:innen nicht nur miteinander, sondern auch mit Talenten außerhalb Ihres Unternehmens.
            </p>
            <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
              Indem sie Einblicke teilen und gemeinsam aktiv sind, wird Ihr Unternehmen sichtbar – authentisch, menschlich, attraktiv. So werden Sie zur ersten Wahl für neue Bewerber:innen.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/unternehmensregistrierung"
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                style={{
                  background: '#5170ff',
                  boxShadow: '0 8px 25px rgba(81,112,255,0.35)'
                }}
              >
                Jetzt registrieren
              </Link>
              <div className="inline-flex items-center gap-3">
                <img src="/assets/Cluster1.png" alt="Profile Cluster" className="h-10 w-auto object-contain" />
                <span className="text-xs font-medium text-gray-700 tracking-wide">+345 weitere Profile</span>
              </div>
            </div>
          </div>

          <div className="relative mt-8 flex justify-center">
            <img src="/assets/company-mainhero-2.png" alt="Digitale Vernetzung zwischen Talenten und Unternehmen" className="max-w-5xl w-full h-auto object-contain" />
          </div>
        </div>
      </section>

      <section className="relative -mt-8 z-10 flex justify-center gap-6 flex-wrap px-4">
        <button
          onClick={() => openCalendly('Demo buchen (CTA)')}
          className="inline-flex items-center rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105"
          style={{
            background: '#5170ff',
            boxShadow: '0 8px 25px rgba(81,112,255,0.35)'
          }}
        >
          Demo buchen
        </button>
        <Link
          to="/unternehmensregistrierung"
          className="inline-flex items-center rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          style={{
            background: '#5170ff',
            boxShadow: '0 8px 25px rgba(81,112,255,0.35)'
          }}
        >
          Unternehmen registrieren
        </Link>
      </section>


      <section id="about" className="mt-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] items-start gap-6">
            <div className="flex">
              <span className="inline-flex items-center rounded-full bg-white/80 backdrop-blur px-3 py-1 text-xs font-medium text-gray-700 shadow-sm border">
                Über BeVisiblle
              </span>
            </div>
            <div className="flex justify-end">
              <div className="max-w-xl text-right">
                <p className="text-gray-800 text-sm leading-relaxed">
                  Mit <span className="font-semibold">BeVisible</span> präsentieren Sie Ihr Unternehmen authentisch, zeigen Ihre Kultur und offene Stellen, greifen auf eine stetig wachsende Datenbank qualifizierter Talente zu und schalten gezielt bisher unsichtbare Profile frei, um direkt mit passenden Bewerber:innen in Kontakt zu treten.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="community" className="mt-16">
        <div className="mx-auto max-w-6xl px-6 grid gap-8 md:grid-cols-3">
          {[{
            title: 'Datenbank',
            img: '/assets/feature-1.png',
            link: '/database'
          }, {
            title: 'Vollständige Profile',
            img: '/assets/feature-3.png',
            link: '/profiles'
          }, {
            title: 'Employee Branding',
            img: '/assets/feature-2.png',
            link: '/employee-branding'
          }].map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="group relative block rounded-[32px] overflow-hidden shadow-[0_18px_45px_rgba(81,112,255,0.28)] transition hover:-translate-y-1"
            >
              <img src={card.img} alt={card.title} className="w-full h-60 object-cover transition duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition" />
              <span className="absolute bottom-4 left-5 text-white text-2xl font-semibold tracking-tight">{card.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-20">
          <SmartInteractions 
            title="So agieren Sie gegen den Fachkräftemangel"
            description="BeVisiblle verbindet Sie mit echten Profilen und lässt Ihre Mitarbeiter für Sie neue Mitarbeiter gewinnen"
          />
      </section>

      <section id="pricing" className="mt-20 scroll-mt-24 rounded-3xl overflow-hidden bg-slate-900 py-16 px-4 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Simple, transparente Preise</h2>
          <p className="mt-2 text-slate-400">Flexibel wechseln – keine versteckten Kosten.</p>

            <div className="mt-6 inline-flex rounded-full bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 text-sm font-medium rounded-full transition ${
                  billingCycle === 'monthly' ? 'bg-[#5170ff] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monatlich
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 text-sm font-medium rounded-full transition ${
                  billingCycle === 'yearly' ? 'bg-[#5170ff] text-white shadow' : 'text-slate-400 hover:text-white'
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
                ? (billingCycle === 'yearly' ? tier.price.yearly! : tier.price.monthly)
                : null;
              const period = billingCycle === 'yearly' ? 'Jahr' : 'Monat';
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
                      'Kontaktiere uns'
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
                    <button
                      onClick={() => openCalendly(`${tier.title} - ${tier.ctaLabel}`)}
                      className={`mt-8 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
                        isPopular
                          ? 'bg-[#5170ff] text-white hover:bg-[#3d5fe6]'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      {tier.ctaLabel}
                    </button>
                  ) : (
                    <Link
                      to={tier.ctaHref.includes('unternehmensregistrierung') ? `${tier.ctaHref}&billing=${billingCycle}` : tier.ctaHref}
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
      </section>

      <section className="mt-16">
        <div className="mx-auto max-w-4xl px-4">
          <h3 className="text-3xl font-semibold text-slate-900 text-center">Häufige Fragen</h3>
          <Accordion type="single" collapsible className="mt-8 divide-y divide-slate-200 rounded-2xl border bg-white/80 backdrop-blur">
            {faqs.map((faq, idx) => (
              <AccordionItem key={faq.question} value={`faq-${idx}`}>
                <AccordionTrigger className="px-6 text-left text-base text-slate-900">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 text-sm text-slate-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
              <form className="flex flex-wrap w-full items-center gap-3" onSubmit={handleNewsletterSubmit}>
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
                <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" className="h-8 w-8 object-contain" />
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
                  <li><Link className="hover:underline" to="/about">Über uns</Link></li>
                  <li><a className="hover:underline" href="#community">Community</a></li>
                  <li><Link className="hover:underline" to="/unternehmensregistrierung">Unternehmen</Link></li>
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
    </div>
  );
}
