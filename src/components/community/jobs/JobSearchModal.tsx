import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, Clock, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface JobSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (position: string, location: string) => void;
  initialPosition?: string;
  initialLocation?: string;
}

export function JobSearchModal({
  open,
  onOpenChange,
  onSearch,
  initialPosition = "",
  initialLocation = "",
}: JobSearchModalProps) {
  const { profile } = useAuth();
  const [position, setPosition] = useState(initialPosition);
  const [location, setLocation] = useState(initialLocation);
  const [recentSearches, setRecentSearches] = useState<Array<{ position: string; location: string; count?: number; timestamp: Date }>>([]);

  // Fetch user profile for avatar
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-avatar'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name, plz, ort')
        .eq('id', user.id)
        .single();
      
      return data;
    },
  });

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('job_recent_searches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
        })));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Save search to recent searches
  const saveSearch = (pos: string, loc: string) => {
    const newSearch = {
      position: pos,
      location: loc,
      timestamp: new Date(),
    };
    
    const updated = [
      newSearch,
      ...recentSearches.filter(s => !(s.position === pos && s.location === loc)),
    ].slice(0, 10); // Keep only last 10
    
    setRecentSearches(updated);
    localStorage.setItem('job_recent_searches', JSON.stringify(updated));
  };

  const handleSearch = () => {
    if (position.trim() || location.trim()) {
      saveSearch(position.trim(), location.trim());
      onSearch(position.trim(), location.trim());
      onOpenChange(false);
    }
  };

  const handleRecentSearchClick = (search: { position: string; location: string }) => {
    setPosition(search.position);
    setLocation(search.location);
    onSearch(search.position, search.location);
    onOpenChange(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('job_recent_searches');
  };

  const clearLocation = () => {
    setLocation("");
  };

  const suggestions = [
    "remote",
    "Founder",
    "Co-Founder",
  ];

  const locationSuggestions = userProfile?.ort
    ? [
        userProfile.ort,
        userProfile.plz ? `${userProfile.plz} ${userProfile.ort}` : undefined,
        "Deutschland",
      ].filter(Boolean)
    : ["München", "Frankfurt", "Deutschland"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 max-h-[90vh] overflow-hidden flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback>
              {userProfile?.first_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Position, ..."
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-9 text-sm"
              />
            </div>
            
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ort, Bund..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 pr-10 h-9 text-sm"
              />
              {location && (
                <button
                  onClick={clearLocation}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Aktuelle Suchen */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Aktuelle Suchen</h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Alle entfernen
                </button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg text-left"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {search.position || 'Position'} {search.location && `· ${search.location}`}
                      </p>
                      {search.count && (
                        <p className="text-xs text-green-600">{search.count} neu</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aktuell (Current Location) */}
          {userProfile?.ort && (
            <div>
              <h3 className="text-sm font-medium mb-3">Aktuell</h3>
              <button
                onClick={() => handleRecentSearchClick({ position: "", location: userProfile.ort || "" })}
                className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg text-left"
              >
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{userProfile.plz ? `${userProfile.plz} ${userProfile.ort}` : userProfile.ort}</span>
              </button>
            </div>
          )}

          {/* Suchen nach (Location Suggestions) */}
          <div>
            <h3 className="text-sm font-medium mb-3">Suchen nach</h3>
            <div className="space-y-1">
              {locationSuggestions.map((loc, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick({ position: position, location: loc })}
                  className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg text-left"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{loc}</span>
                  {loc === userProfile?.ort && (
                    <span className="text-xs text-muted-foreground ml-auto">Profilstandort</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Versuchen Sie es mit (Suggestions) */}
          <div>
            <h3 className="text-sm font-medium mb-3">Versuchen Sie es mit</h3>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick({ position: suggestion, location: location })}
                  className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg text-left"
                >
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

