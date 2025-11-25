export type PlanKey = "free" | "basic" | "growth" | "bevisiblle" | "enterprise";

export type PlanInterval = "month" | "year";

type PlanConfig = {
  label: string;
  prices: Record<PlanInterval, number>;
  seatsIncluded: number;
  tokensPerMonth: number;
  tokensIncluded: number; // Gesamte Tokens inklusive
  maxAdditionalTokensPerMonth: number;
  tokenPrice: number; // Preis pro Token
  maxActiveJobs: number; // -1 means unlimited
  features: string[];
  ai: "none" | "standard" | "advanced" | "enterprise";
  showCheckout: boolean;
  highlight?: boolean;
};

export const PLAN_ORDER: PlanKey[] = ["free", "basic", "growth", "bevisiblle", "enterprise"];

export const PLANS: Record<PlanKey, PlanConfig> = {
  free: {
    label: "Free",
    prices: { month: 0, year: 0 },
    seatsIncluded: 1,
    tokensPerMonth: 0,
    tokensIncluded: 3, // 3 Tokens einmalig (nur durch Nachkauf erweiterbar)
    maxAdditionalTokensPerMonth: 0, // Unbegrenzt durch Nachkauf
    tokenPrice: 18,
    maxActiveJobs: 0, // Keine Stellenanzeigen möglich
    features: [
      "3 Tokens einmalig (nur durch Nachkauf erweiterbar)",
      "Token-Nachkauf: 18€ pro Token",
      "Keine Stellenanzeigen möglich",
    ],
    ai: "none",
    showCheckout: false,
  },
  basic: {
    label: "Basic",
    prices: { month: 379, year: 3790 },
    seatsIncluded: 3,
    tokensPerMonth: 60,
    tokensIncluded: 60,
    maxAdditionalTokensPerMonth: 50,
    tokenPrice: 18,
    maxActiveJobs: 10,
    features: [
      "60 Tokens pro Monat inklusive",
      "3 Sitze inklusive",
      "3 Standorte inklusive",
      "10 Stellenanzeigen inklusive",
      "Token-Nachkauf: 18€ pro Token",
      "Max. 50 zusätzliche Tokens pro Monat kaufbar",
      "CRM & Export-Funktion",
    ],
    ai: "none",
    showCheckout: true,
  },
  growth: {
    label: "Growth",
    prices: { month: 769, year: 7690 },
    seatsIncluded: 5,
    tokensPerMonth: 150,
    tokensIncluded: 150,
    maxAdditionalTokensPerMonth: 50,
    tokenPrice: 18,
    maxActiveJobs: 20,
    features: [
      "150 Tokens pro Monat inklusive",
      "5 Sitze inklusive",
      "5 Standorte inklusive",
      "20 Stellenanzeigen inklusive",
      "Token-Nachkauf: 18€ pro Token",
      "Max. 50 zusätzliche Tokens pro Monat kaufbar",
      "CRM, Export, Team-Zugänge",
    ],
    ai: "standard",
    showCheckout: true,
    highlight: true,
  },
  bevisiblle: {
    label: "BeVisiblle",
    prices: { month: 1249, year: 12490 },
    seatsIncluded: 10,
    tokensPerMonth: 500,
    tokensIncluded: 500,
    maxAdditionalTokensPerMonth: 0, // Unbegrenzt
    tokenPrice: 18,
    maxActiveJobs: 50,
    features: [
      "500 Tokens pro Monat inklusive",
      "10 Sitze inklusive",
      "15 Standorte inklusive",
      "50 Stellenanzeigen inklusive",
      "Token-Nachkauf: 18€ pro Token",
      "CRM, Teamrechte, Rollen",
      "Export, Reporting",
      "API & SSO optional",
    ],
    ai: "enterprise",
    showCheckout: true,
  },
  enterprise: {
    label: "Enterprise",
    prices: { month: 0, year: 0 }, // Kein Preis, auf Anfrage
    seatsIncluded: 0, // Unbegrenzt
    tokensPerMonth: 0, // Individuell steuerbar pro Standort
    tokensIncluded: 0,
    maxAdditionalTokensPerMonth: 0, // Unbegrenzt
    tokenPrice: 18,
    maxActiveJobs: -1, // Unlimited
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
    ],
    ai: "enterprise",
    showCheckout: false, // Kein Checkout, nur Sales-Kontakt
  },
};

export function isHigherPlan(target: PlanKey, current: PlanKey): boolean {
  return PLAN_ORDER.indexOf(target) > PLAN_ORDER.indexOf(current);
}

export function getPriceLabel(value: number) {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  });
}
