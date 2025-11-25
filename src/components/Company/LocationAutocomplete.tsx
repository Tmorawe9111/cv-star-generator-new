import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LocationSuggestion {
  plz: string;
  ort: string;
  bundesland?: string;
  display: string; // Format: "PLZ Ort" oder "PLZ Ort, Bundesland"
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  country?: string; // 'DE', 'AT', 'CH' - nur für DE wird PLZ-Autocomplete aktiviert
  disabled?: boolean;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'z. B. 10115 Berlin oder Berlin',
  className,
  id,
  country = 'DE',
  disabled = false,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Lade Vorschläge basierend auf Eingabe
  useEffect(() => {
    const loadSuggestions = async () => {
      const query = value.trim();
      
      // Nur für Deutschland: PLZ-Autocomplete nach 3 Ziffern
      // Für andere Länder: normale Suche nach 2 Zeichen
      const minLength = country === 'DE' ? 3 : 2;
      
      if (query.length < minLength) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      // Nur für Deutschland: PLZ-Autocomplete aktivieren
      if (country !== 'DE') {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        // Prüfe ob es eine PLZ ist (3-5 Ziffern)
        const isPLZ = /^\d{3,5}$/.test(query);
        
        let queryBuilder = supabase
          .from('postal_codes')
          .select('plz, ort, bundesland')
          .limit(10);

        if (isPLZ) {
          // Suche nach PLZ (beginnt mit eingegebenen Ziffern)
          queryBuilder = queryBuilder.ilike('plz', `${query}%`);
        } else {
          // Suche nach Stadt
          queryBuilder = queryBuilder.ilike('ort', `%${query}%`);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        const formatted: LocationSuggestion[] = (data || []).map((item) => ({
          plz: item.plz,
          ort: item.ort,
          bundesland: item.bundesland || undefined,
          display: item.bundesland
            ? `${item.plz} ${item.ort}, ${item.bundesland}`
            : `${item.plz} ${item.ort}`,
        }));

        setSuggestions(formatted);
        setIsOpen(formatted.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error loading location suggestions:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    // Debounce: Warte 300ms nach letzter Eingabe
    const timeoutId = setTimeout(loadSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelect = (suggestion: LocationSuggestion) => {
    // Setze Format: "PLZ Ort" oder nur "Ort" wenn keine PLZ
    const displayValue = suggestion.plz 
      ? `${suggestion.plz} ${suggestion.ort}`
      : suggestion.ort;
    
    onChange(displayValue);
    setIsOpen(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSuggestions([]);
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay um Click-Events zu ermöglichen
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const clearValue = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10',
            isOpen && suggestions.length > 0 && 'rounded-b-none border-b-0'
          )}
          autoComplete="off"
          disabled={disabled}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={clearValue}
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
        {loading && (
          <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-0 bg-popover border border-t-0 rounded-b-md shadow-lg max-h-60 overflow-auto"
        >
          <div className="p-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.plz}-${suggestion.ort}-${index}`}
                type="button"
                className={cn(
                  'w-full text-left px-3 py-2 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                  selectedIndex === index && 'bg-accent text-accent-foreground'
                )}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {suggestion.plz} {suggestion.ort}
                    </div>
                    {suggestion.bundesland && (
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.bundesland}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Text */}
      {country === 'DE' && value && value.length >= 3 && !loading && suggestions.length === 0 && (
        <p className="absolute top-full left-0 mt-1 text-xs text-muted-foreground px-1">
          Keine Vorschläge gefunden. Du kannst trotzdem suchen.
        </p>
      )}
      {country !== 'DE' && (
        <p className="absolute top-full left-0 mt-1 text-xs text-muted-foreground px-1">
          Bitte Stadt manuell eingeben (PLZ-Autocomplete nur für Deutschland verfügbar).
        </p>
      )}
    </div>
  );
}

