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

