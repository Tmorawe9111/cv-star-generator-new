/**
 * Plan Templates
 * 
 * Vordefinierte Templates für schnelles Erstellen ähnlicher Pläne
 */

export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  category: "starter" | "growth" | "enterprise" | "custom";
  template: {
    name: string;
    price_monthly_cents: number;
    price_yearly_cents: number;
    included_tokens: number;
    included_jobs: number;
    included_seats: number;
    included_locations: number;
    max_locations: number | null;
    token_price_cents: number;
    max_additional_tokens_per_month: number | null;
    ai_level: "none" | "standard" | "advanced" | "enterprise";
    max_active_jobs: number | null;
    features: string[];
    description: string;
    highlight: boolean;
  };
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "free-template",
    name: "Free Plan",
    description: "Basis-Plan für kleine Unternehmen ohne Kosten",
    category: "starter",
    template: {
      name: "Free",
      price_monthly_cents: 0,
      price_yearly_cents: 0,
      included_tokens: 3,
      included_jobs: 0,
      included_seats: 1,
      included_locations: 1,
      max_locations: 1,
      token_price_cents: 1800,
      max_additional_tokens_per_month: null,
      ai_level: "none",
      max_active_jobs: 0,
      features: [
        "3 Tokens einmalig (nur durch Nachkauf erweiterbar)",
        "Token-Nachkauf: 18€ pro Token",
        "Keine Stellenanzeigen möglich",
      ],
      description: "Perfekt für kleine Unternehmen, die die Plattform testen möchten",
      highlight: false,
    },
  },
  {
    id: "basic-template",
    name: "Basic Plan",
    description: "Einstiegsplan für kleine bis mittlere Unternehmen",
    category: "starter",
    template: {
      name: "Basic",
      price_monthly_cents: 37900,
      price_yearly_cents: 379000,
      included_tokens: 60,
      included_jobs: 10,
      included_seats: 3,
      included_locations: 3,
      max_locations: 3,
      token_price_cents: 1800,
      max_additional_tokens_per_month: 50,
      ai_level: "none",
      max_active_jobs: 10,
      features: [
        "60 Tokens pro Monat inklusive",
        "3 Sitze inklusive",
        "3 Standorte inklusive",
        "10 Stellenanzeigen inklusive",
        "Token-Nachkauf: 18€ pro Token",
        "Max. 50 zusätzliche Tokens pro Monat kaufbar",
        "CRM & Export-Funktion",
      ],
      description: "Ideal für kleine bis mittlere Unternehmen",
      highlight: false,
    },
  },
  {
    id: "growth-template",
    name: "Growth Plan",
    description: "Für wachsende Unternehmen mit erweiterten Features",
    category: "growth",
    template: {
      name: "Growth",
      price_monthly_cents: 76900,
      price_yearly_cents: 769000,
      included_tokens: 150,
      included_jobs: 20,
      included_seats: 5,
      included_locations: 5,
      max_locations: 5,
      token_price_cents: 1800,
      max_additional_tokens_per_month: 50,
      ai_level: "standard",
      max_active_jobs: 20,
      features: [
        "150 Tokens pro Monat inklusive",
        "5 Sitze inklusive",
        "5 Standorte inklusive",
        "20 Stellenanzeigen inklusive",
        "Token-Nachkauf: 18€ pro Token",
        "Max. 50 zusätzliche Tokens pro Monat kaufbar",
        "CRM, Export, Team-Zugänge",
        "Standard AI-Features",
      ],
      description: "Perfekt für wachsende Unternehmen",
      highlight: true,
    },
  },
  {
    id: "bevisiblle-template",
    name: "BeVisiblle Plan",
    description: "Premium-Plan mit allen Features",
    category: "enterprise",
    template: {
      name: "BeVisiblle",
      price_monthly_cents: 124900,
      price_yearly_cents: 1249000,
      included_tokens: 500,
      included_jobs: 50,
      included_seats: 10,
      included_locations: 15,
      max_locations: 15,
      token_price_cents: 1800,
      max_additional_tokens_per_month: null,
      ai_level: "enterprise",
      max_active_jobs: 50,
      features: [
        "500 Tokens pro Monat inklusive",
        "10 Sitze inklusive",
        "15 Standorte inklusive",
        "50 Stellenanzeigen inklusive",
        "Token-Nachkauf: 18€ pro Token",
        "CRM, Teamrechte, Rollen",
        "Export, Reporting",
        "API & SSO optional",
        "Enterprise AI-Features",
      ],
      description: "Alles aus Growth plus erweiterte Features",
      highlight: false,
    },
  },
  {
    id: "enterprise-template",
    name: "Enterprise Plan",
    description: "Individueller Plan für große Unternehmen",
    category: "enterprise",
    template: {
      name: "Enterprise",
      price_monthly_cents: 0,
      price_yearly_cents: 0,
      included_tokens: 0,
      included_jobs: 0,
      included_seats: 0,
      included_locations: null,
      max_locations: null,
      token_price_cents: 1800,
      max_additional_tokens_per_month: null,
      ai_level: "enterprise",
      max_active_jobs: -1,
      features: [
        "Alles aus BeVisiblle",
        "Unlimitierte Seats",
        "Unlimitierte Standorte",
        "Individuelle Token-Konfiguration",
        "Unbegrenzte Stellenanzeigen",
        "CRM, Teamrechte, Rollen",
        "Export, Reporting",
        "API & SSO inklusive",
        "Dedicated Support",
        "Enterprise AI-Features",
      ],
      description: "Individuell anpassbar für große Unternehmen",
      highlight: false,
    },
  },
];

export function getTemplateById(id: string): PlanTemplate | undefined {
  return PLAN_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: PlanTemplate["category"]): PlanTemplate[] {
  return PLAN_TEMPLATES.filter((t) => t.category === category);
}

