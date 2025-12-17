import { useSEO } from '@/hooks/useSEO';
import { SEOHead } from '@/components/seo/SEOHead';
import { OrganizationStructuredData } from '@/components/seo/StructuredData';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function PflegeHub() {
  const seoData = useSEO({
    title: 'Fachkräfte finden & vermitteln bei BeVisiblle',
    description: 'Ob Pflege, Handwerk, Industrie oder Büro: BeVisiblle verbindet Fachkräfte mit passenden Arbeitgebern. Individuell. Emotional. Wirkungsvoll.',
    keywords: ['Fachkräfte', 'Pflegekräfte', 'Handwerker', 'Industriemechaniker', 'Büromanagement', 'Auszubildende', 'Personalvermittlung'],
    industry: 'general'
  });

  const professions = [
    {
      id: 1,
      title: 'Pflegekräfte',
      roleDetail: '(Ambulante/Stationäre & Klinische)',
      description: 'Für einen stabilen Pflegebetrieb in der Senioren-, außerklinischen Intensiv- und Krankenpflege sowie in Kliniken und Krankenhäusern.',
      image: '/assets/pflege-ambulant.png',
      link: '/karriere/pflege/ambulant'
    },
    {
      id: 2,
      title: 'Funktionsdienste',
      roleDetail: '(OTA / ATA / MTR)',
      description: 'Gezielte Ansprache von Operationstechnischen Assistenten, Anästhesietechnischen Assistenten und Medizinisch-Technischen Radiologieassistenten für spezialisierte Fachbereiche.',
      image: '/assets/pflege-klinik.png',
      link: '/karriere/pflege/funktionsdienste'
    },
    {
      id: 3,
      title: 'Handwerker',
      roleDetail: '(Schreiner, KFZ, Dachedecker etc.)',
      description: 'Wir vermitteln qualifizierte Handwerker für alle Gewerke – von Schreiner über KFZ-Mechatroniker bis hin zu Dachedeckern und vielen weiteren Fachrichtungen.',
      image: '/assets/Handwerker.png',
      link: '/karriere/handwerk'
    },
    {
      id: 4,
      title: 'Industriemechaniker',
      roleDetail: '',
      description: 'Für die Industrie: Wir finden präzise arbeitende Industriemechaniker, die komplexe Maschinen und Anlagen instand halten und optimieren.',
      image: '/assets/Industriemechaniker.png',
      link: '/karriere/industriemechaniker'
    },
    {
      id: 5,
      title: 'Büromanagement',
      roleDetail: '',
      description: 'Organisierte Fachkräfte für Büro und Verwaltung. Wir vermitteln qualifizierte Mitarbeiter für alle Bereiche des Büromanagements.',
      image: '/assets/Buero-management.png',
      link: '/karriere/buromanagement'
    },
    {
      id: 6,
      title: 'Auszubildende',
      roleDetail: '',
      description: 'Wir begeistern junge Talente für verschiedene Berufsfelder. Authentische Einblicke und moderne Arbeitgeberkommunikation für die nächste Generation.',
      image: '/assets/Ausbildung.png',
      link: '/karriere/ausbildung'
    }
  ];

  return (
    <>
      <SEOHead {...seoData} />
      <OrganizationStructuredData />
      
      <div className="min-h-screen bg-white">
        <CareerHubHeader />
        
        {/* Top Section */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* CTA Button */}
            <Button 
              asChild
              className="mb-5 bg-[#eef4ff] hover:bg-[#e0ecff] text-gray-900 border-0 rounded-full px-4 py-2 h-auto font-semibold text-sm"
            >
              <Link to="/unternehmen/registrierung">Welche Fachkräfte fehlen Ihnen?</Link>
            </Button>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
              <span className="text-[#2563eb]">Fachkräfte</span>, die wirklich fehlen.<br />
              Und die wir finden.
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Ob Pflege, Handwerk, Industrie oder Büro. Wir bringen genau die Menschen mit genau den Unternehmen zusammen, die zueinander passen. Individuell. Emotional. Wirkungsvoll inszeniert.
            </p>
          </div>
        </section>

        {/* Profession Cards Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-24 max-w-7xl mx-auto pt-24">
              {professions.map((profession) => (
                <div
                  key={profession.id}
                  className="bg-[#fcfcfc] rounded-[20px] px-5 pb-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 flex flex-col items-center relative"
                >
                  {/* Image with head sticking out - only person, no background */}
                  <div 
                    className={`w-full relative mb-2 flex justify-center items-end ${
                      profession.id === 4 ? 'h-[380px] -mt-[120px]' : 'h-[320px] -mt-[100px]'
                    }`}
                  >
                    <img
                      src={profession.image}
                      alt={profession.title}
                      className={`max-h-full w-auto object-contain ${
                        profession.id === 4 ? 'scale-125' : 'scale-110'
                      }`}
                      style={{
                        WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.1))',
                      }}
                      onError={(e) => {
                        // Fallback to placeholder if image doesn't exist
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=' + encodeURIComponent(profession.title);
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col items-center w-full">
                    <h3 className="text-xl font-bold mb-1 text-gray-900">
                      {profession.title}
                    </h3>
                    {profession.roleDetail && (
                      <div className="font-semibold text-base text-gray-900 mb-4">
                        {profession.roleDetail}
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mb-6 flex-1 leading-relaxed">
                      {profession.description}
                    </p>
                    <Link
                      to={profession.link}
                      className="inline-flex items-center text-[#2563eb] font-semibold text-sm group mt-auto"
                    >
                      Mehr Infos
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

