
import React from "react";
import { Input } from "@/components/ui/input";
import { Bell, MessageSquareMore, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import SearchAutosuggest from "@/components/marketplace/SearchAutosuggest";
interface HeaderWithSearchProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  className?: string;
}

export function HeaderWithSearch({ value, onChange, onSubmit, className }: HeaderWithSearchProps) {
  const { profile } = useAuth();
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("w-full bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur border-b", className)}>
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-3 flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" className="h-8 w-8 object-contain" />
          <div className="text-base font-semibold hidden sm:block">Azubi Marketplace</div>
        </div>

        {/* Search next to logo */}
        <div className="relative flex-1 min-w-[140px] max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder="Suche nach Personen, Unternehmen und Beiträgen…"
            className="pl-10 h-10"
            aria-label="Global marketplace search"
          />
          <SearchAutosuggest
            query={value}
            open={open && !!value}
            onSelect={(_, payload) => {
              onChange(payload.label);
              onSubmit();
              setOpen(false);
            }}
          />
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MessageSquareMore className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>
              {profile?.vorname && profile?.nachname ? `${profile.vorname[0]}${profile.nachname[0]}` : "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

export default HeaderWithSearch;
