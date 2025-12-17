const PRIVATE_EMAIL_DOMAINS = new Set([
  // Global
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "outlook.de",
  "hotmail.com",
  "hotmail.de",
  "live.com",
  "live.de",
  "msn.com",
  "yahoo.com",
  "yahoo.de",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "aol.com",
  "aol.de",

  // DACH common private providers / ISPs
  "gmx.de",
  "gmx.net",
  "web.de",
  "mail.de",
  "t-online.de",
  "freenet.de",
  "posteo.de",
  "mailbox.org",
  "arcor.de",
  "online.de",
  "1und1.de",
  "ionos.de",
  "vodafone.de",
  "unitybox.de",
  "kabelmail.de",
  "telekom.de",
  "bluewin.ch",
  "gmx.ch",
  "gmx.at",
  "aon.at",
]);

export function getEmailDomain(email: string): string | null {
  const e = String(email || "").trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at <= 0) return null;
  const domain = e.slice(at + 1).trim();
  if (!domain) return null;
  return domain;
}

export function isPrivateEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  // Exact match allowlist
  if (PRIVATE_EMAIL_DOMAINS.has(domain)) return true;
  // Some providers use country variants like outlook.<tld>
  if (domain.startsWith("outlook.") || domain.startsWith("hotmail.") || domain.startsWith("live.")) return true;
  return false;
}

export function isWorkEmail(email: string): boolean {
  return !isPrivateEmail(email);
}


