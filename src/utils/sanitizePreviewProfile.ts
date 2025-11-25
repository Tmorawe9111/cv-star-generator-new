export function sanitizePreviewProfile<T extends Record<string, any>>(profile: T | null | undefined, isUnlocked: boolean): T | null | undefined {
  if (!profile) return profile;

  const sanitized: Record<string, any> = {
    ...profile,
    is_unlocked: isUnlocked,
  };

  if (!isUnlocked) {
    const contactKeys = [
      "email",
      "email_private",
      "private_email",
      "contact_email",
      "kontakt_email",
      "kontaktEmail",
      "kontaktemail",
      "telefon",
      "telefonnummer",
      "phone",
      "phone_number",
      "mobil",
      "mobile",
      "mobile_number",
      "kontakt_telefon",
      "kontaktTelefon",
      "kontaktPhone",
      "contact_phone",
    ];

    for (const key of contactKeys) {
      if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
        delete sanitized[key];
      }
    }
  }

  return sanitized as T;
}
