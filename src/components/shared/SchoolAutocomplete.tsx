import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, MapPin, Check, X, Share2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface SchoolMatch {
  id: string;
  name: string;
  city: string | null;
  type: string | null;
  logo_url: string | null;
}

interface SchoolAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSchoolSelect?: (school: SchoolMatch | null) => void;
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
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolMatch | null>(null);
  const [searched, setSearched] = useState(false);

  // Search schools when value changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length < 3 || selectedSchool) {
        setMatches([]);
        setSearched(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('search_schools_for_linking', {
          p_search_term: value,
          p_city: location || null
        });

        setSearched(true);

        if (error) {
          console.log('search_schools_for_linking not available:', error.message);
          return;
        }

        if (data && data.length > 0) {
          setMatches(data);
          setShowDialog(true);
        } else {
          // No matches - show share dialog
          setMatches([]);
          setShowShareDialog(true);
        }
      } catch (error) {
        console.error('Error searching schools:', error);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [value, location, selectedSchool]);

  const handleSelect = (school: SchoolMatch) => {
    setSelectedSchool(school);
    onChange(school.name);
    onSchoolSelect?.(school);
    setShowDialog(false);
  };

  const handleDecline = () => {
    setSelectedSchool(null);
    onSchoolSelect?.(null);
    setShowDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (selectedSchool && newValue !== selectedSchool.name) {
      setSelectedSchool(null);
      onSchoolSelect?.(null);
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/registrieren?school=${encodeURIComponent(value)}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link kopiert!',
        description: 'Teile den Link mit deinen Mitschülern.',
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/registrieren?school=${encodeURIComponent(value)}`;
    const text = `Hey! Ich bin auf BeVisiblle und suche Mitschüler von ${value}. Melde dich auch an! 🎓`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: `${value} auf BeVisiblle`, text, url: link });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
    setShowShareDialog(false);
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

      {/* Match Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Meinst du diese Schule?
            </DialogTitle>
            <DialogDescription>
              Wir haben eine registrierte Bildungseinrichtung gefunden.
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
                  <AvatarFallback className="rounded-xl bg-amber-100 text-amber-700">
                    <GraduationCap className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{school.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {school.type && <span>{schoolTypeLabels[school.type] || school.type}</span>}
                    {school.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {school.city}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleDecline}>
              <X className="h-4 w-4 mr-2" />
              Nein, andere Schule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog - when no matches found */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-amber-500" />
              Schule noch nicht dabei
            </DialogTitle>
            <DialogDescription>
              "{value}" ist noch nicht auf BeVisiblle registriert. Teile den Link mit deinen Mitschülern!
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-800 mb-3">
                Je mehr Mitschüler sich anmelden, desto besser könnt ihr euch vernetzen!
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Teilen
                </Button>
                <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Link kopieren
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowShareDialog(false)}>
              Später
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
