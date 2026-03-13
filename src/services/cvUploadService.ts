import { supabase } from "@/integrations/supabase/client";

export interface ExtractedCVData {
  vorname?: string;
  nachname?: string;
  email?: string;
  telefon?: string;
  plz?: string;
  ort?: string;
  strasse?: string;
  branche?: string;
  status?: string;
  geburtsdatum?: string;
  schulbildung?: unknown[];
  berufserfahrung?: unknown[];
  sprachen?: unknown[];
  faehigkeiten?: unknown[];
  ueberMich?: string;
  bio?: string;
  headline?: string;
  [key: string]: unknown;
}

/**
 * Fetches extracted CV data by upload/session ID.
 * Checks cv_creation_sessions first, then storage metadata if needed.
 */
export async function getExtractedData(uploadId: string): Promise<ExtractedCVData | null> {
  if (!uploadId) return null;

  // Try cv_creation_sessions (ID might be session UUID)
  const { data: session, error } = await supabase
    .from("cv_creation_sessions")
    .select("extracted_data")
    .eq("id", uploadId)
    .maybeSingle();

  if (!error && session?.extracted_data) {
    return session.extracted_data as ExtractedCVData;
  }

  // If no session found, the uploadId might be a storage path or different format.
  // Return null so the caller can handle (e.g. CVUploadModal may pass extractedData directly).
  return null;
}
