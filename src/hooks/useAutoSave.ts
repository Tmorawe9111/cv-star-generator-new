import { useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce.tsx';

/**
 * Auto-Save Hook für CV-Form-Daten
 * Speichert automatisch in localStorage nach einer Debounce-Zeit
 */
export function useAutoSave<T>(data: T, storageKey: string, debounceMs: number = 1000) {
  const isInitialMount = useRef(true);
  
  // Debounced save function
  const debouncedSave = useDebounce((dataToSave: T) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log(`[Auto-Save] Saved to ${storageKey}`);
    } catch (error) {
      console.error('[Auto-Save] Error saving:', error);
    }
  }, debounceMs);

  // Auto-save on data change
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    debouncedSave(data);
  }, [data, debouncedSave]);

  // Load function
  const load = (): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (error) {
      console.error('[Auto-Save] Error loading:', error);
    }
    return null;
  };

  // Clear function
  const clear = () => {
    try {
      localStorage.removeItem(storageKey);
      console.log(`[Auto-Save] Cleared ${storageKey}`);
    } catch (error) {
      console.error('[Auto-Save] Error clearing:', error);
    }
  };

  return { load, clear };
}

