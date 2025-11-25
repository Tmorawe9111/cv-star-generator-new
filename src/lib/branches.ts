/**
 * Zentrale Definition der Branchen für das gesamte System
 * Diese Definition wird für:
 * - User-Onboarding (CV-Generator)
 * - Company-Onboarding
 * - Stellenanzeigen
 * - Profil-Erstellung
 * verwendet, um Matching zu ermöglichen
 */

export interface Branch {
  key: string;
  label: string;
  emoji?: string;
  desc?: string;
}

export const BRANCHES: Branch[] = [
  { key: 'handwerk', label: 'Handwerk', emoji: '👷', desc: 'Bau, Elektro, Sanitär, KFZ und mehr' },
  { key: 'it', label: 'IT & Software', emoji: '💻', desc: 'Programmierung, Support, Systemadmin' },
  { key: 'gesundheit', label: 'Gesundheit', emoji: '🩺', desc: 'Pflege, Therapie, medizinische Assistenz' },
  { key: 'buero', label: 'Büro & Verwaltung', emoji: '📊', desc: 'Organisation, Kommunikation, Administration' },
  { key: 'verkauf', label: 'Verkauf & Handel', emoji: '🛍️', desc: 'Beratung, Kundenservice, Einzelhandel' },
  { key: 'gastronomie', label: 'Gastronomie', emoji: '🍽️', desc: 'Service, Küche, Hotellerie' },
  { key: 'bau', label: 'Bau & Architektur', emoji: '🏗️', desc: 'Konstruktion, Planung, Ausführung' }
] as const;

export type BranchKey = typeof BRANCHES[number]['key'];

/**
 * Get branch by key
 */
export function getBranch(key: string): Branch | undefined {
  return BRANCHES.find(b => b.key === key);
}

/**
 * Get branch label by key
 */
export function getBranchLabel(key: string): string {
  return getBranch(key)?.label || key;
}

/**
 * Get all branch keys
 */
export function getBranchKeys(): BranchKey[] {
  return BRANCHES.map(b => b.key) as BranchKey[];
}

/**
 * Get all branch labels
 */
export function getBranchLabels(): string[] {
  return BRANCHES.map(b => b.label);
}

