import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseInit = () => {
  // Optimistische Initialisierung - App startet sofort, Supabase lädt im Hintergrund
  const [isInitialized, setIsInitialized] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSupabase = async () => {
      try {
        // Test Supabase connection with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);

          if (error) {
            // Don't treat AbortError as a critical error - it's just a timeout
            if (error.message?.includes('aborted') || error.message?.includes('AbortError')) {
              // Timeout is expected - app can still work
              // Don't set error for timeout
            } else {
              // Only log real connection issues in development
              if (import.meta.env.DEV) {
                console.warn('Supabase connection warning:', error.message);
              }
            }
          }
        } catch (queryError: any) {
          clearTimeout(timeoutId);
          // Don't treat AbortError as a critical error
          if (queryError?.name === 'AbortError' || queryError?.message?.includes('aborted') || queryError?.message?.includes('AbortError')) {
            // Timeout is expected - app can still work even if timeout occurs
            // No logging needed for expected timeouts
          } else {
            // Only log real connection issues
            console.error('Supabase query error:', queryError);
            setError('Verbindungsfehler - Notfall-Modus aktiviert');
          }
        }
      } catch (err: any) {
        console.error('Supabase init error:', err);
        // App läuft bereits, nur Error setzen falls nötig
        setError('Verbindungsfehler - Notfall-Modus aktiviert');
      }
    };

    // Initialisiere Supabase im Hintergrund, blockiert die App nicht
    initSupabase();
  }, []);

  return { isInitialized, error };
};
