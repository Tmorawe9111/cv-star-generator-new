/**
 * Profilbilder – 11 echte Fotos statt Comic-Avatare
 * Männliche Namen → männliche Bilder, weibliche Namen → weibliche Bilder
 * Gleicher Name = gleiches Bild (deterministisch)
 */

const MALE_IMAGES = ['/assets/profiles/profile-1.png', '/assets/profiles/profile-2.png', '/assets/profiles/profile-4.png', '/assets/profiles/profile-5.png', '/assets/profiles/profile-8.png', '/assets/profiles/profile-11.png'];
const FEMALE_IMAGES = ['/assets/profiles/profile-3.png', '/assets/profiles/profile-6.png', '/assets/profiles/profile-7.png', '/assets/profiles/profile-9.png', '/assets/profiles/profile-10.png'];

const FEMALE_NAMES = new Set([
  'maria', 'julia', 'lisa', 'anna', 'laura', 'sophie', 'jana', 'emma', 'lea', 'hannah', 'mia', 'lena', 'lara',
  'sandra', 'petra', 'claudia', 'andrea', 'monika', 'sabine', 'ulrike', 'katharina', 'christina', 'stefanie', 'nicole',
  'melanie', 'jennifer', 'jessica', 'vanessa', 'nadine', 'tina', 'anja', 'birgit', 'heike', 'kerstin', 'susanne'
]);

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}

function getFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[0] || '').replace(/[^a-zA-ZäöüÄÖÜß]/g, '').toLowerCase();
}

function isFemaleName(name: string): boolean {
  const first = getFirstName(name);
  if (!first) return false;
  return FEMALE_NAMES.has(first);
}

/** Spezifische Profilbilder für bestimmte Vornamen */
const NAMED_IMAGES: Record<string, string> = {
  lisa: '/assets/profiles/profile-lisa.png',
  julia: '/assets/profiles/profile-julia.png',
};

/**
 * Gibt für einen Namen deterministisch das passende Profilbild zurück.
 * Gleicher Name = gleiches Bild. Frau/Mann wird aus dem Vornamen erkannt.
 */
export function getProfileImageForName(name: string): string {
  const first = getFirstName(name);
  const named = NAMED_IMAGES[first];
  if (named) return named;
  const isFemale = FEMALE_NAMES.has(first);
  const images = isFemale ? FEMALE_IMAGES : MALE_IMAGES;
  const idx = simpleHash(name) % images.length;
  return images[idx];
}

/**
 * Für anonyme/ generische Avatare: index 0-10 für die 11 Bilder.
 * Nutzt abwechselnd m/w wenn kein Name bekannt.
 */
export function getProfileImageByIndex(index: number): string {
  const all = [...MALE_IMAGES, ...FEMALE_IMAGES];
  return all[index % all.length];
}
