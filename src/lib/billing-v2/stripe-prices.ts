import type { PlanInterval, PlanKey } from "./plans";

type PlanPriceIds = Record<PlanInterval, string>;

type TokenPackKey = "t50" | "t150" | "t300";

type TokenPackConfig = {
  amount: number;
  priceEUR: number;
  stripePriceId: string;
};

export const PLAN_PRICE_IDS: Partial<Record<PlanKey, PlanPriceIds>> = {
  basic: {
    month: "price_basic_month",
    year: "price_basic_year",
  },
  growth: {
    month: "price_growth_month",
    year: "price_growth_year",
  },
  bevisiblle: {
    month: "price_bevisiblle_month",
    year: "price_bevisiblle_year",
  },
};

export const TOKEN_PACKS: Record<TokenPackKey, TokenPackConfig> = {
  t50: {
    amount: 50,
    priceEUR: 980,
    stripePriceId: "price_1SUSkbEn7Iw8aL2bWSfxgfeV",
  },
  t150: {
    amount: 150,
    priceEUR: 2600,
    stripePriceId: "price_1SUSl8En7Iw8aL2bQhWLdho3",
  },
  t300: {
    amount: 300,
    priceEUR: 5000,
    stripePriceId: "price_1SUSoJEn7Iw8aL2bIeX7QI8b",
  },
};
