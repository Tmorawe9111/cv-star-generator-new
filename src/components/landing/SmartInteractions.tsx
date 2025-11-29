import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import datenbankFeature from '@/assets/Datenbank-Feature.png';
import vollstaendigeProfileFeature from '@/assets/vollständigeProfile-features.png';
import employeeBrandingFeature from '@/assets/EmployeeBranding-feature.png';

type InteractionCard = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  link: string;
  cta: string;
};

const CARDS: InteractionCard[] = [
  {
    title: 'Datenbank',
    subtitle: 'Profile freischalten',
    description:
      'Nutzen Sie Ihre Tokens, um vollständige Profile aus unserer Datenbank freizuschalten und qualifizierte Kandidaten direkt zu kontaktieren. Gewinnen Sie die besten Talente für Ihr Team.',
    image: datenbankFeature,
    link: '/database',
    cta: 'Datenbank durchsuchen'
  },
  {
    title: 'Vollständige Profile',
    subtitle: 'Immer verifiziert',
    description:
      'Alle Profile auf BeVisiblle sind vollständig und verifiziert. Durch unseren strukturierten Lebenslauf-Generator im Anmeldeprozess garantieren wir Ihnen nur hochwertige Kandidatenprofile.',
    image: vollstaendigeProfileFeature,
    link: '/profiles',
    cta: 'Profile ansehen'
  },
  {
    title: 'Employee Branding',
    subtitle: 'Mitarbeiter als Markenbotschafter',
    description:
      'Ihre Mitarbeiter machen Marketing in der Community, indem sie Beiträge teilen und aktiv teilnehmen. Jeder Post lenkt organisch Aufmerksamkeit auf Ihr Unternehmen und stärkt Ihre Arbeitgebermarke.',
    image: employeeBrandingFeature,
    link: '/employee-branding',
    cta: 'Mehr erfahren'
  }
];

interface SmartInteractionsProps {
  title?: string;
  description?: string;
}

export default function SmartInteractions({ 
  title = "Smart, wenn du es brauchst",
  description = "Entdecke intelligente Features, die genau dann für dich da sind, wenn du sie benötigst"
}: SmartInteractionsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CARDS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeCard = CARDS[activeIndex];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm md:text-base text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)] items-center">
        {/* Copy + cards */}
        <div className="space-y-6">

          <div className="space-y-3">
            {CARDS.map((card, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={card.title}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    'w-full rounded-3xl px-6 py-5 text-left transition duration-300 backdrop-blur',
                    isActive
                      ? 'bg-card shadow-[0_18px_40px_rgba(81,112,255,0.20)] border border-[#e7e7ff]'
                      : 'bg-card/50 text-muted-foreground hover:bg-card/80 border border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{card.subtitle}</span>
                      <h3 className={cn('mt-2 text-lg font-semibold', isActive ? 'text-card-foreground' : 'text-muted-foreground')}>
                        {card.title}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition',
                        isActive ? 'border-card-foreground text-card-foreground' : 'border-border text-muted-foreground'
                      )}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <p className={cn('mt-3 text-sm leading-relaxed', isActive ? 'text-muted-foreground' : 'text-muted-foreground/80')}>
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual */}
        <div className="relative overflow-hidden rounded-[32px] bg-card shadow-[0_24px_50px_rgba(81,112,255,0.15)] h-[430px] w-full">
          <img 
            src={activeCard.image} 
            alt={activeCard.title} 
            className="h-full w-full object-cover object-center" 
            style={{ minHeight: '430px', minWidth: '100%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-transparent" />
          <div className="absolute bottom-4 right-4">
            <Link
              to={activeCard.link || '/auth'}
              className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-2 text-sm font-semibold text-card-foreground shadow-md transition hover:bg-background"
            >
              {activeCard.cta || 'Mehr erfahren'}
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card-foreground text-card text-xs">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
