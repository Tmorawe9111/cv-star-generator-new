/**
 * Unternehmens-Preise – Quelle: bevisiblle.de/unternehmen
 * Base: €369/Monat, €3950/Jahr
 * Pro: €985/Monat, €9555/Jahr
 * Enterprise: Individuell
 */
export const COMPANY_PRICING_TIERS = [
  {
    id: 'base',
    title: 'Base',
    description: 'Ideal für Unternehmen die jährlich rund 20 neue Mitarbeiter suchen',
    price: { monthly: 369, yearly: 3950 },
    badge: undefined,
    features: [
      '10 Tokens pro Monat um vollständige Profile freizuschalten',
      '5 Stellenanzeigen im Quartal',
      '2 Standorte',
      '1 Zugang',
      'Grundlegende Analytics',
      'Support per Mail'
    ],
    ctaLabel: 'Jetzt starten',
    ctaHref: '/unternehmensregistrierung?tarif=basis'
  },
  {
    id: 'pro',
    title: 'Pro',
    description: 'Ideal für Unternehmen die jährlich rund 50 neue Mitarbeiter suchen',
    price: { monthly: 985, yearly: 9555 },
    badge: 'Beliebt',
    features: [
      '25 Tokens pro Monat um vollständige Profile freizuschalten',
      '12 Stellenanzeigen im Quartal',
      'Mehrere Standorte',
      '5 Zugänge',
      'AI Matching',
      'Matches via Email (wöchentlich/monatlich)',
      '1 zu 1 Support mit Onboarding'
    ],
    ctaLabel: 'Jetzt starten',
    ctaHref: '/unternehmensregistrierung?tarif=profi'
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'Ideal für Unternehmen mit über 250 Mitarbeiter die gegen den Fachkräftemangel agieren wollen',
    price: { monthly: null, yearly: null },
    badge: undefined,
    features: [
      'Unlimited Tokens',
      'Unlimited Stellenanzeigen',
      'Unlimited Zugänge',
      'Personalisiertes AI Matching',
      'Matches via Email und WhatsApp (wöchentlich/monatlich)',
      '1 zu 1 Support'
    ],
    ctaLabel: 'Kontaktiere uns',
    ctaHref: '/support'
  }
] as const;
