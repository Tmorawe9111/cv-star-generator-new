import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, MapPin, Users, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CompanyMatch {
  id: string;
  name: string;
  city: string | null;
  logo_url: string | null;
  employee_count: number;
}

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCompanySelect?: (company: CompanyMatch | null) => void;
  location?: string;
  placeholder?: string;
  className?: string;
}

export function CompanyAutocomplete({
  value,
  onChange,
  onCompanySelect,
  location,
  placeholder = "Unternehmen eingeben...",
  className
}: CompanyAutocompleteProps) {
  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyMatch | null>(null);

  // Search companies when value changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length < 2 || selectedCompany) {
        setMatches([]);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('search_companies_for_linking', {
          p_search_term: value,
          p_city: location || null
        });

        if (error) {
          console.log('search_companies_for_linking not available:', error.message);
          return;
        }

        if (data && data.length > 0) {
          setMatches(data);
          setShowDialog(true);
        }
      } catch (error) {
        console.error('Error searching companies:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, location, selectedCompany]);

  const handleSelect = (company: CompanyMatch) => {
    setSelectedCompany(company);
    onChange(company.name);
    onCompanySelect?.(company);
    setShowDialog(false);
  };

  const handleDecline = () => {
    setSelectedCompany(null);
    onCompanySelect?.(null);
    setShowDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (selectedCompany && newValue !== selectedCompany.name) {
      setSelectedCompany(null);
      onCompanySelect?.(null);
    }
  };

  return (
    <>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            selectedCompany && "pr-10 border-green-500 bg-green-50",
            className
          )}
        />
        {selectedCompany && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="h-4 w-4 text-green-600" />
          </div>
        )}
      </div>

      {/* Confirmation Dialog - only shows when matches found */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Meinst du dieses Unternehmen?
            </DialogTitle>
            <DialogDescription>
              Wir haben ein registriertes Unternehmen gefunden.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {matches.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelect(company)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarImage src={company.logo_url || undefined} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                    {company.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{company.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {company.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {company.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {company.employee_count} Mitarbeiter
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleDecline}>
              <X className="h-4 w-4 mr-2" />
              Nein, anderes Unternehmen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
