import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fallback timeout: Always initialize after 5 seconds, even if connection hangs
    const fallbackTimeout = setTimeout(() => {
      console.warn('Supabase init fallback: Initializing app after timeout');
      setIsInitialized(true);
    }, 5000);

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
          clearTimeout(fallbackTimeout);

          if (error) {
            // Don't treat AbortError as a critical error - it's just a timeout
            if (error.message?.includes('aborted') || error.message?.includes('AbortError')) {
              console.warn('Supabase connection timeout (expected):', error.message);
              // Don't set error for timeout - app can still work
            } else {
              console.warn('Supabase connection warning:', error.message);
              // Only set error for real connection issues, not timeouts
            }
          }
        } catch (queryError: any) {
          clearTimeout(timeoutId);
          clearTimeout(fallbackTimeout);
          // Don't treat AbortError as a critical error
          if (queryError?.name === 'AbortError' || queryError?.message?.includes('aborted') || queryError?.message?.includes('AbortError')) {
            console.warn('Supabase connection timeout (expected):', queryError.message);
            // App can still work even if timeout occurs
          } else {
            console.error('Supabase query error:', queryError);
            // Only set error for real connection issues
            setError('Verbindungsfehler - Notfall-Modus aktiviert');
          }
        }
        
        // Always set initialized to true, regardless of errors
        clearTimeout(fallbackTimeout);
        setIsInitialized(true);
      } catch (err: any) {
        clearTimeout(fallbackTimeout);
        console.error('Supabase init error:', err);
        // Always allow app to work, even if initialization fails
        setIsInitialized(true);
        setError('Verbindungsfehler - Notfall-Modus aktiviert');
      }
    };

    initSupabase();

    // Cleanup
    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, []);

  return { isInitialized, error };
};
