/**
 * Support Code Generation and Validation
 * 
 * Support codes are used for company verification during registration.
 * Format: SUP-XXXX-XXXX (8 alphanumeric characters)
 */

// Import supabase client
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a unique support code
 * Format: SUP-XXXX-XXXX
 * 
 * @returns Promise<string> - Unique support code
 */
export async function generateSupportCode(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('generate_support_code');
    
    if (error) {
      console.error('Error generating support code:', error);
      // Fallback: generate client-side
      return generateFallbackCode();
    }
    
    return data || generateFallbackCode();
  } catch (error) {
    console.error('Error generating support code:', error);
    return generateFallbackCode();
  }
}

/**
 * Fallback client-side code generation
 * Used if RPC function fails
 */
function generateFallbackCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding 0, O, I, 1
  let code = 'SUP-';
  
  // Generate 4 characters
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  code += '-';
  
  // Generate another 4 characters
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Validates support code format
 * @param code - Support code to validate
 * @returns boolean - True if format is valid
 */
export function validateSupportCodeFormat(code: string): boolean {
  const pattern = /^SUP-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Formats support code for display
 * @param code - Support code to format
 * @returns string - Formatted code
 */
export function formatSupportCode(code: string | null | undefined): string {
  if (!code) return '—';
  return code.toUpperCase();
}

