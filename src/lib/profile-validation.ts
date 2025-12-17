import { supabase } from '@/integrations/supabase/client';

/**
 * Prüft, ob eine E-Mail-Adresse bereits von einem anderen Benutzer verwendet wird
 * @param email Die zu prüfende E-Mail-Adresse
 * @param excludeUserId Optional: User-ID, die von der Prüfung ausgeschlossen werden soll (für Updates)
 * @returns true wenn die E-Mail bereits existiert, false wenn nicht
 */
export async function checkEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
  if (!email || !email.trim()) return false;
  
  const query = supabase
    .from('profiles')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .limit(1);
  
  if (excludeUserId) {
    query.neq('id', excludeUserId);
  }
  
  const { data, error } = await query.maybeSingle();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking email:', error);
    return false; // Bei Fehler nicht blockieren
  }
  
  return !!data;
}

/**
 * Prüft, ob eine Telefonnummer bereits von einem anderen Benutzer verwendet wird
 * @param telefon Die zu prüfende Telefonnummer
 * @param excludeUserId Optional: User-ID, die von der Prüfung ausgeschlossen werden soll (für Updates)
 * @returns true wenn die Telefonnummer bereits existiert, false wenn nicht
 */
export async function checkPhoneExists(telefon: string, excludeUserId?: string): Promise<boolean> {
  if (!telefon || !telefon.trim()) return false;
  
  const query = supabase
    .from('profiles')
    .select('id')
    .eq('telefon', telefon.trim())
    .limit(1);
  
  if (excludeUserId) {
    query.neq('id', excludeUserId);
  }
  
  const { data, error } = await query.maybeSingle();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking phone:', error);
    return false; // Bei Fehler nicht blockieren
  }
  
  return !!data;
}

/**
 * Prüft sowohl E-Mail als auch Telefonnummer auf Eindeutigkeit
 * @param email Die zu prüfende E-Mail-Adresse
 * @param telefon Die zu prüfende Telefonnummer
 * @param excludeUserId Optional: User-ID, die von der Prüfung ausgeschlossen werden soll (für Updates)
 * @returns Objekt mit Ergebnissen der Prüfung
 */
export async function checkProfileUniqueness(
  email?: string,
  telefon?: string,
  excludeUserId?: string
): Promise<{ emailExists: boolean; phoneExists: boolean }> {
  const [emailExists, phoneExists] = await Promise.all([
    email ? checkEmailExists(email, excludeUserId) : Promise.resolve(false),
    telefon ? checkPhoneExists(telefon, excludeUserId) : Promise.resolve(false)
  ]);
  
  return { emailExists, phoneExists };
}

/**
 * Pre-signup uniqueness check (works without an auth session).
 * Requires DB function: public.check_profile_uniqueness_public(email, phone)
 */
export async function checkProfileUniquenessPublic(
  email?: string,
  telefon?: string
): Promise<{ emailExists: boolean; phoneExists: boolean }> {
  try {
    const { data, error } = await supabase.rpc('check_profile_uniqueness_public', {
      p_email: email ?? null,
      p_phone: telefon ?? null,
    });

    if (error) {
      console.error('Error checking profile uniqueness (public):', error);
      return { emailExists: false, phoneExists: false };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      emailExists: !!row?.email_exists,
      phoneExists: !!row?.phone_exists,
    };
  } catch (e) {
    console.error('Unexpected error in checkProfileUniquenessPublic:', e);
    return { emailExists: false, phoneExists: false };
  }
}

