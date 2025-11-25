import type { PlanKey } from "./plans";

type FeatureKey = "ai" | "unlimited_jobs" | "exports" | "analytics";

const FEATURE_RULES: Record<FeatureKey, (plan: PlanKey) => boolean> = {
  ai: (plan) => plan !== "basic" && plan !== "free",
  unlimited_jobs: (plan) => plan === "bevisiblle" || plan === "enterprise",
  exports: (plan) => plan === "bevisiblle" || plan === "enterprise",
  analytics: (plan) => plan !== "basic" && plan !== "free",
};

// Plan limits for locations
export const PLAN_LOCATION_LIMITS: Record<PlanKey, number> = {
  free: 1,
  basic: 3,
  growth: 5,
  bevisiblle: 15,
  enterprise: 999999, // Effectively unlimited
};

export function getMaxLocations(plan: PlanKey): number {
  return PLAN_LOCATION_LIMITS[plan] ?? 1;
}

export function canAddLocation(plan: PlanKey, currentCount: number): boolean {
  return currentCount < getMaxLocations(plan);
}

export function featureAllowed(plan: PlanKey, feature: FeatureKey): boolean {
  return FEATURE_RULES[feature]?.(plan) ?? true;
}

type UpgradePromptHandlers = {
  onRequestUpgrade: () => void;
  onFeatureAllowed?: () => void;
};

export function openUpgradeIfGatedV2(plan: PlanKey, feature: FeatureKey, handlers: UpgradePromptHandlers) {
  if (featureAllowed(plan, feature)) {
    handlers.onFeatureAllowed?.();
    return true;
  }

  handlers.onRequestUpgrade();
  return false;
}
