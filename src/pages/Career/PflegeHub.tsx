import { useSEO } from '@/hooks/useSEO';
import { SEOHead } from '@/components/seo/SEOHead';
import { OrganizationStructuredData } from '@/components/seo/StructuredData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Briefcase, TrendingUp, Heart } from 'lucide-react';

export default function PflegeHub() {
  const seoData = useSEO({
    title: 'Pflegeausbildung & Karriere bei BeVisiblle',
    description: 'Finde deine Pflegeausbildung oder deine Traumstelle als Pflegefachkraft. BeVisiblle verbindet Pflegekräfte mit Arbeitgebern.',
    keywords: ['Pflegeausbildung', 'Pflegefachkraft', 'Pflege Jobs', 'Generalistik', 'Altenpflege', 'Krankenpflege'],
    industry: 'pflege'
  });

  return (
    <>
      <SEOHead {...seoData} />
      <OrganizationStructuredData />
      
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <Heart className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Pflege & Gesundheit</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Deine Karriere in der <span className="text-blue-600">Pflege</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Von der Ausbildung zur Fachkraft – finde deinen Weg in der Pflege. 
              Werde von Arbeitgebern gefunden oder finde deine Traumstelle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link to="/registrieren">Jetzt kostenlos starten</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/karriere/pflege/unternehmen">Für Unternehmen</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Zielgruppen-Sektion */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Dein Weg in der Pflege</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Schüler */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold">Schüler</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Du interessierst dich für eine Pflegeausbildung? Erfahre alles über Generalistik, 
                Voraussetzungen und deine Karrieremöglichkeiten.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/karriere/pflege/schueler">Mehr erfahren</Link>
              </Button>
            </Card>

            {/* Azubi */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Azubi</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Du bist bereits in der Ausbildung? Erhalte Tipps für Prüfungen, 
                deine Rechte und Unterstützung während der Ausbildung.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/karriere/pflege/azubi">Mehr erfahren</Link>
              </Button>
            </Card>

            {/* Profi */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">Fachkraft</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Du bist bereits Pflegefachkraft? Entdecke Weiterbildungen, 
                Gehaltsentwicklung und neue Karrieremöglichkeiten.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/karriere/pflege/profi">Mehr erfahren</Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="p-8 md:p-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Bereit für deine Karriere in der Pflege?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Erstelle dein Profil und werde von Arbeitgebern gefunden
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/registrieren">Jetzt kostenlos registrieren</Link>
            </Button>
          </Card>
        </section>
      </div>
    </>
  );
}

