import React, { useEffect } from 'react';
import { ArrowRight, Target, Zap, BarChart3, Shield, Users2, TrendingUp, CheckCircle } from "lucide-react";
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from './Header';
import Footer from './Footer';
import CareerFieldsSection from './CareerFieldsSection';

export default function CompanyLandingPage() {
  // SEO Head Injection
  useEffect(() => {
    const site = "https://ausbildungsbasis.de";
    const title = "Für Unternehmen | Schneller passende Auszubildende & Fachkräfte finden";
    const desc = "Standardisierte Profile, Direktkontakt und intelligentes Matching. Jetzt Unternehmens-Account erstellen.";
    const keywords = "Azubi finden, Fachkräfte rekrutieren, Unternehmen Ausbildung, Kandidatensuche, Recruiting";
    const ogImage = site + "/lovable-uploads/95e5dd4a-87e4-403a-b2cd-6f3d06433d25.png";
    
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
    meta("viewport", "width=device-width, initial-scale=1");
    link("canonical", site + "/unternehmen");

    // Open Graph
    meta("og:locale", "de_DE", "property");
    meta("og:type", "website", "property");
    meta("og:site_name", "Ausbildungsbasis", "property");
    meta("og:title", title, "property");
    meta("og:description", desc, "property");
    meta("og:url", site + "/unternehmen", "property");
    meta("og:image", ogImage, "property");
    meta("og:image:alt", "Unternehmens-Portal für Recruiting", "property");

    // Twitter Cards
    meta("twitter:card", "summary_large_image");
    meta("twitter:title", title);
    meta("twitter:description", desc);
    meta("twitter:image", ogImage);

    // JSON-LD Structured Data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Unternehmen - Ausbildungsbasis",
      "description": desc,
      "url": site + "/unternehmen",
      "mainEntity": {
        "@type": "Service",
        "name": "Recruiting-Service für Unternehmen",
        "provider": {
          "@type": "Organization",
          "name": "Ausbildungsbasis"
        },
        "description": "Finden Sie passende Auszubildende und Fachkräfte durch standardisierte Profile und intelligentes Matching."
      }
    };
    
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    head.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header variant="business" />
      
      {/* Career Fields Section - B2C */}
      <CareerFieldsSection />
      
      {/* Hero Section with Black Background */}
      <section className="hero-section relative overflow-hidden bg-[#0B0B0B] text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent z-10" />
        <div className="absolute inset-0">
          <img 
            src="/lovable-uploads/95e5dd4a-87e4-403a-b2cd-6f3d06433d25.png" 
            alt="Unternehmen Hero" 
            className="w-full h-full object-cover opacity-40"
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <div className="relative z-20 mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              Schneller passende Auszubildende und Fachkräfte finden.
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
              Standardisierte, vollständige Profile. Direkte Ansprache. Weniger Aufwand – mehr Matches.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link to="/unternehmensregistrierung">Unternehmen-Account erstellen</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent border-white text-white hover:bg-white hover:text-black">
                <Link to="/produkt#demo">Demo ansehen</Link>
              </Button>
            </div>
            
            {/* Trust Badges (optional) */}
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                DSGVO-konform
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Hosted in Deutschland
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* So funktioniert's Section */}
      <section id="so-funktionierts" className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">So funktioniert's</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Registrieren & Unternehmensprofil anlegen</h3>
              <p className="text-muted-foreground">Erstellen Sie Ihr Firmenprofil in wenigen Minuten.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Gezielt Profile filtern & kontaktieren</h3>
              <p className="text-muted-foreground">Nutzen Sie intelligente Filter für passende Kandidaten.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Matches verwalten & Stellen besetzen</h3>
              <p className="text-muted-foreground">Verwalten Sie Ihre Pipeline effizient bis zur Besetzung.</p>
            </div>
          </div>
          <div className="text-center">
            <Button asChild size="lg">
              <Link to="/unternehmensregistrierung">Jetzt kostenlos starten</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Warum Unternehmen auf uns vertrauen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Standardisierte Kandidatenprofile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Alle relevanten Daten auf einen Blick: Ausbildung, Skills, Sprachen, Dokumente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Direkte Ansprache ohne Umwege
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Kontakt per Klick – schneller zum Gespräch statt Postfach-Pingpong.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Intelligentes Matching
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Erhalte Vorschläge, die wirklich zu euren Anforderungen passen.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Transparenz & DSGVO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Daten in Frankfurt gehostet; Freigaben nur mit Einwilligung.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-primary" />
                  Team-Zugänge & Rollen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Kollegen einladen, Sichten teilen, Notizen hinterlegen.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Performance & Reporting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Behalte Pipeline, Antwortraten und Besetzungen im Blick.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Bereit, passende Kandidaten schneller zu finden?
          </h2>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
            <Link to="/unternehmensregistrierung">Kostenlos registrieren</Link>
          </Button>
        </div>
      </section>

      {/* Produkt Teaser */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Das Produkt – klar, einfach, effektiv.
              </h2>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Kandidaten-Datenbank</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Direktkontakt</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Matching</span>
                </li>
              </ul>
              <Button asChild variant="outline">
                <Link to="/produkt">Produkt ansehen</Link>
              </Button>
            </div>
            <div className="relative">
              <img 
                src="/lovable-uploads/356afafd-8910-495a-8ba8-35d74adf7cb1.png" 
                alt="Produkt Interface" 
                className="w-full rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Kontakt Teaser */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Fragen? Wir helfen gern.</h2>
          <p className="text-muted-foreground mb-6">
            Sprechen Sie mit unserem Team über Ihre individuellen Anforderungen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/kontakt">Kontakt aufnehmen</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/kontakt?type=demo">Demo anfragen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}