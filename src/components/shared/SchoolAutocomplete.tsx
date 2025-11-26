import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, MapPin, Users, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SchoolMatch {
  id: string;
  name: string;
  city: string | null;
  type: string | null;
  logo_url: string | null;
  student_count: number;
}

interface SchoolAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSchoolSelect: (school: SchoolMatch | null) => void;
  location?: string;
  placeholder?: string;
  className?: string;
}

const schoolTypeLabels: Record<string, string> = {
  grundschule: 'Grundschule',
  hauptschule: 'Hauptschule',
  realschule: 'Realschule',
  gymnasium: 'Gymnasium',
  gesamtschule: 'Gesamtschule',
  berufsschule: 'Berufsschule',
  fachhochschule: 'Fachhochschule',
  universitaet: 'Universität',
  sonstige: 'Bildungseinrichtung'
};

export function SchoolAutocomplete({
  value,
  onChange,
  onSchoolSelect,
  location,
  placeholder = "Schule/Universität eingeben...",
  className
}: SchoolAutocompleteProps) {
  const [matches, setMatches] = useState<SchoolMatch[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolMatch | null>(null);

  // Debounced search
  const searchSchools = useCallback(async (searchTerm: string, city?: string) => {
    if (searchTerm.length < 2) {
      setMatches([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_schools_for_linking', {
        p_search_term: searchTerm,
        p_city: city || null,
        p_limit: 5
      });

      if (error) throw error;
      setMatches(data || []);

      // Show dialog only if we have matches
      if (data && data.length > 0) {
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Error searching schools:', error);
      setMatches([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Search when value changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length >= 2 && !selectedSchool) {
        searchSchools(value, location);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, location, searchSchools, selectedSchool]);

  const handleSelect = (school: SchoolMatch) => {
    setSelectedSchool(school);
    onChange(school.name);
    onSchoolSelect(school);
    setShowDialog(false);
  };

  const handleDecline = () => {
    setSelectedSchool(null);
    onSchoolSelect(null);
    setShowDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear selection if user changes the text
    if (selectedSchool && newValue !== selectedSchool.name) {
      setSelectedSchool(null);
      onSchoolSelect(null);
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
            selectedSchool && "pr-10 border-green-500 bg-green-50",
            className
          )}
        />
        {selectedSchool && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="h-4 w-4 text-green-600" />
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Meinst du diese Schule?
            </DialogTitle>
            <DialogDescription>
              Wir haben eine registrierte Bildungseinrichtung gefunden, die zu deiner Eingabe passt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {matches.map((school) => (
              <button
                key={school.id}
                onClick={() => handleSelect(school)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarImage src={school.logo_url || undefined} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                    <GraduationCap className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{school.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {school.type && (
                      <span>{schoolTypeLabels[school.type] || school.type}</span>
                    )}
                    {school.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {school.city}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Users className="h-3 w-3" />
                    {school.student_count} {school.student_count === 1 ? 'Student' : 'Studierende'}
                  </span>
                </div>
                <Check className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleDecline}>
              <X className="h-4 w-4 mr-2" />
              Nein, andere Schule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

